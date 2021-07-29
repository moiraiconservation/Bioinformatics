///////////////////////////////////////////////////////////////////////////////
// isofrms.js
//	Requires: pather.js, sequences.js, and wrapper.js
//	Uses main.js for reading and writing files

// Isoform objects are meant to be containers for holding sequence information
//	for protein splice variants (isoforms).  As with other Hedron objects,
//	this information is kept as "record" objects in an array named "cargo."
//	Each isoform object can hold this information using one of several
//	different types of record objects, including: a "full" record object
//	(ISO_RECORD), which stores the isoforms as sequences;  a "mixed" record
//	object, which stores both nucleic acid and protein sequences
//	(ISO_RECORD_MIXED); a "compact" record object (ISO_RECORD_COMPACT), which
//	stores an array of sequence accession numbers; or a "compact mixed" record
//	object (ISO_RECORD_COMPACT_MIXED), which stores accession numbers for both
//	the protein sequences and their corresponding CDS DNA sequences.

function ISO_RECORD() {
	this.group = 0;
	this.record_type = 'full';
	this.seq_type = '';
	this.sequences = {}; // SEQUENCES object

	this.save_as_fasta = async (path) => {
		if (typeof (path) === 'undefined') { path = ''; }
		const path_record = await pather.parse(path);
		const filename = create_file_name(path_record.basename, this.group, this.sequences);
		await path_record.set_file_name(filename);
		await path_record.force_path();
		const full_path = await path_record.get_full_path();
		await this.sequences.save_as_fasta(full_path);
	}

	this.set = (parameter, value) => {
		const whitelist = ['group', 'record_type', 'seq_type'];
		if (whitelist.includes(parameter)) { this[parameter] = value; }
		else {
			this.sequences.set(parameter, value);
		}
	}

	function create_file_name(basename, group, sequences) {
		let extension = '.fasta';
		const seq_type = sequences.get_sequence_type();
		if (seq_type === 'amino acids') { extension = '.faa'; }
		if (seq_type === 'nucleotides') { extension = '.fna'; }
		if (basename) { return basename + extension; }
		return 'group_' + group.toString() + extension;
	}

}

function ISO_RECORD_MIXED() {
	this.gene_sequences = {}  // SEQUENCES object
	this.group = 0;
	this.record_type = 'mixed';
	this.seq_type = '';
	this.protein_sequences = {}; // SEQUENCES object

	this.save_as_fasta = async (path) => {
		if (typeof (path) === 'undefined') { path = ''; }
		const g_path_record = await pather.parse(path);
		const p_path_record = await pather.parse(path);
		const g_filename = create_file_name(g_path_record.basename, this.group, this.gene_sequences);
		const p_filename = create_file_name(p_path_record.basename, this.group, this.protein_sequences);
		await g_path_record.set_file_name(g_filename);
		await p_path_record.set_file_name(p_filename);
		await g_path_record.force_path();
		await p_path_record.force_path();
		const g_full_path = await g_path_record.get_full_path();
		const p_full_path = await p_path_record.get_full_path();
		await this.gene_sequences.save_as_fasta(g_full_path);
		await this.protein_sequences.save_as_fasta(p_full_path);
	}

	this.set = (parameter, value) => {
		const whitelist = ['group', 'record_type', 'seq_type'];
		if (whitelist.includes(parameter)) { this[parameter] = value; }
		else {
			this.gene_sequences.set(parameter, value);
			this.protein_sequences.set(parameter, value);
		}
	}

	function create_file_name(basename, group, sequences) {
		let extension = '.fasta';
		const seq_type = sequences.get_sequence_type();
		if (seq_type === 'amino acids') { extension = '.faa'; }
		if (seq_type === 'nucleotides') { extension = '.fna'; }
		if (basename) { return basename + extension; }
		return 'group_' + group.toString() + extension;
	}

}

function ISO_RECORD_COMPACT() {
	this.accessions = [];
	this.group = 0;
	this.gene = '';
	this.protein = '';
	this.record_type = 'compact';
	this.seq_type = '';

	this.set = (parameter, value) => {
		const whitelist = ['group', 'gene', 'protein', 'record_type', 'seq_type'];
		if (whitelist.includes(parameter)) { this[parameter] = value; }
	}
	
}

function ISO_RECORD_COMPACT_MIXED() {
	this.gene_accessions = [];
	this.group = 0;
	this.gene = '';
	this.protein = '';
	this.protein_accessions = [];
	this.record_type = 'compact mixed';
	this.seq_type = '';

	this.set = (parameter, value) => {
		const whitelist = ['group', 'gene', 'protein', 'record_type', 'seq_type'];
		if (whitelist.includes(parameter)) { this[parameter] = value; }
	}

}

///////////////////////////////////////////////////////////////////////////////

function ISOFORMS() {

	this.cargo = []; // array of ISO_RECORDS
	this.organism = '';
	this.seq_type = 'unknown';

	this.add = (record) => {
		if (Array.isArray(record)) {
			for (let i = 0; i < record.length; i++) {
				this.add(record[i]);
			}
		}
		else {
			if (record instanceof ISO_RECORD) { this.cargo.push(record); }
			if (record instanceof ISO_RECORD_MIXED) { this.cargo.push(record); }
			if (record instanceof ISO_RECORD_COMPACT) { this.cargo.push(record); }
			if (record instanceof ISO_RECORD_COMPACT_MIXED) { this.cargo.push(record); }
			if (record instanceof record) { this.cargo = this.cargo.concat(record.cargo); }
		}
	}

	this.clear = () => { this.organism = ''; this.cargo = []; }

	this.compact = () => {
		// This function removes sequence information and is irreversible.
		const new_cargo = [];
		for (let i = 0; i < this.cargo.length; i++) {
			const new_record = new ISO_RECORD_COMPACT();
			const iso_record = this.cargo[i];
			new_record.group = iso_record.group;
			new_record.gene = iso_record.sequences.get_consensus_gene_name();
			new_record.protein = iso_record.sequences.get_consensus_protein_name();
			new_record.seq_type = iso_record.sequences.get_sequence_type();
			for (let j = 0; j < iso_record.sequences.cargo.length; j++) {
				new_record.accessions.push(iso_record.sequences.cargo[j].info.accession);
			}
			new_cargo.push(new_record);
		}
		this.cargo = new_cargo;
	}

	// for the filter functions, the filter term can be a string or an array of strings
	this.filter_by = (parameter, filter) => {
		const new_isoforms = new ISOFORMS();
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				new_isoforms.add(this.filter_by(parameter, filter[i]));
			}
			new_isoforms.update();
			return new_isoforms;
		}
		else {
			new_isoforms.cargo = this.cargo.filter((x) => {
				if (x instanceof ISO_RECORD || x instanceof ISO_RECORD_MIXED) {
					const whitelist = ['group', 'record_type', 'seq_type'];
					if (whitelist.includes(parameter)) {
						if (x[parameter]) { return x[parameter] === filter; }
						else { return false; }
					}
					else {
						if (x instanceof ISO_RECORD) {
							return x.sequences.includes(parameter, filter);
						}
						else if (x instanceof ISO_RECORD_MIXED) {
							return x.gene_sequences.includes(parameter, filter) || x.protein_sequences.includes(parameter, filter);
						}
						else { return false; }
					}
				}
				else if (x instanceof ISO_RECORD_COMPACT || x instanceof ISO_RECORD_COMPACT_MIXED) {
					const whitelist = ['group', 'gene', 'protein', 'record_type', 'seq_type'];
					if (whitelist.includes(parameter)) {
						if (x[parameter]) { return x[parameter] === filter; }
						else { return false; }
					}
					else if (parameter === 'accession') {
						if (x instanceof ISO_RECORD_COMPACT) { return x.accessions.includes(filter); }
						else if (x instanceof ISO_RECORD_COMPACT_MIXED) { return x.gene_accessions.includes(filter) || x.protein_accessions.includes(filter); }
						else { return false; }
					}
				}
				else { return false; }
			});
		}
		new_isoforms.update();
		return new_isoforms;
	}

	this.filter_by_accession = (filter) => { return this.filter_by('accession', filter); }

	this.filter_by_group = (filter) => { return this.filter_by('group', filter); }

	this.filter_by_database = (filter) => { return this.filter_by('database', filter); }

	this.filter_by_location = (filter) => { return this.filter_by('location', filter); }

	this.filter_by_gene_name = (filter) => { return this.filter_by('gene', filter); }

	this.filter_by_protein_id = (filter) => { return this.filter_by('protein_id', filter); }

	this.filter_by_protein_name = (filter) => { return this.filter_by('protein', filter); }

	this.filter_by_record_type = (filter) => { return this.filter_by('record_type', filter); }

	this.filter_by_sequence_name = (filter) => { return this.filter_by('seq_name', filter); }

	this.filter_by_sequence_type = (filter) => { return this.filter_by('seq_type', filter); }

	this.filter_by_status = (filter) => { return this.filter_by('status', filter); }

	// The "partner" functions are built around steps needed for ultimately
	//	merging an isoform object of protein sequences with an isoform object
	//	of corresponding DNA sequences.  The "partner" is the corresponding
	//	isoform object to merge with, and often will need to be selected
	//	from an array of isoform objects from various species.  For the
	//	"find partner" function, if the proper isoform object is found from
	//	an array, that isoform object will be returned.  If a single
	//	isoform object is supplied to the function instead of an array, then
	//	either true or false will be returned.
	this.find_partner = (partner) => {
		if (Array.isArray(partner)) {
			for (let i = 0; i < partner.length; i++) {
				if (this.find_partner(partner[i])) { return partner[i]; }
			}
			return false;
		}
		else {
			const accessions = this.get_unique_accession();
			if (accessions.length) {
				if (partner.includes_accession(accessions)) { return true; }
			}
		}
		return false;
	}

	this.get_consensus = (parameter) => {
		const v_list = this.get_unique(parameter);
		const p_list = [];
		for (let i = 0; i < v_list.length; i++) {
			const filtered = this.filter_by(parameter, v_list[i]);
			const quant = filtered.cargo.length;
			p_list.push({ parameter: v_list[i], quant: quant });
		}
		p_list.sort((a, b) => { return b.quant - a.quant; });
		if (p_list.length && p_list[0].parameter) { return p_list[0].parameter; }
		return '';
	}

	this.get_consensus_accession = () => { return this.get_consensus('accession'); }

	this.get_consensus_database = () => { return this.get_consensus('database'); }

	this.get_consensus_location = () => { return this.get_consensus('location'); }

	this.get_consensus_gene_name = () => { return this.get_consensus('gene'); }

	this.get_consensus_organism_name = () => { return this.get_consensus('organism'); }

	this.get_consensus_protein_id = () => { return this.get_consensus('protein_id'); }

	this.get_consensus_protein_name = () => { return this.get_consensus('protein'); }

	this.get_consensus_sequence_name = () => { return this.get_consensus('seq_name'); }

	this.get_consensus_sequence_type = () => { return this.get_consensus('seq_type'); }

	this.get_consensus_status = () => { return this.get_consensus('status'); }

	this.get_group_numbers = (parameter, filter) => {
		const group_numbers = [];
		const results = this.filter_by(parameter, filter);
		for (let i = 0; i < results.cargo.length; i++) {
			if (typeof (results.cargo[i].group) === 'number') {
				group_numbers.push(results.cargo[i].group);
			}
		}
		return group_numbers;
	}

	this.get_group_numbers_by_accession = (filter) => { return this.get_group_numbers('accession', filter); }

	this.get_group_numbers_by_database = (filter) => { return this.get_group_numbers('database', filter); }

	this.get_group_numbers_by_location = (filter) => { return this.get_group_numbers('location', filter); }

	this.get_group_numbers_by_gene_name = (filter) => { return this.get_group_numbers('gene', filter); }

	this.get_group_numbers_by_protein_id = (filter) => { return this.get_group_numbers('protein_id', filter); }

	this.get_group_numbers_by_protein_name = (filter) => { return this.get_group_numbers('protein', filter); }

	this.get_group_numbers_by_record_type = (filter) => { return this.get_group_numbers('record_type', filter); }

	this.get_group_numbers_by_sequence_name = (filter) => { return this.get_group_numbers('seq_name', filter); }

	this.get_group_numbers_by_sequence_type = (filter) => { return this.get_group_numbers('seq_type', filter); }

	this.get_group_numbers_by_status = (filter) => { return this.get_group_numbers('status', filter); }

	this.get_record_type = () => {
		const types = [];
		for (let i = 0; i < this.cargo.length; i++) {
			if (this.cargo[i].record_type) {
				types.push(this.cargo[i].record_type);
			}
		}
		const record_types = Array.from(new Set(types));
		if (record_types.length === 1) { return record_types[0]; }
		if (record_types.length > 1) { return 'mixed'; }
		return 'unknown';
	}

	this.get_sequence_type = () => {
		const types = [];
		for (let i = 0; i < this.cargo.length; i++) {
			if (this.cargo[i].seq_type) {
				types.push(this.cargo[i].seq_type);
			}
		}
		const seq_types = Array.from(new Set(types));
		if (seq_types.length === 1) { return seq_types[0]; }
		if (seq_types.length > 1) { return 'mixed'; }
		return 'unknown';
	}

	this.get_sequences = () => {
		const sequences = new SEQUENCES();
		for (let i = 0; i < this.cargo.length; i++) {
			const x = this.cargo[i];
			if (x.sequences) { sequences.add(x.sequences); }
			if (x.gene_sequences) { sequences.add(x.gene_sequences); }
			if (x.protein_sequences) { sequences.add(x.protein_sequences); }
		}
		return sequences;
	}

	this.get_unique = (parameter) => {
		let arr = [];
		for (let i = 0; i < this.cargo.length; i++) {
			const x = this.cargo[i];
			if (x instanceof ISO_RECORD || x instanceof ISO_RECORD_MIXED) {
				const whitelist = ['group', 'record_type', 'seq_type'];
				if (whitelist.includes(parameter)) { arr.push(x[parameter]); }
				else {
					if (x instanceof ISO_RECORD) { arr = arr.concat(x.sequences.get_unique(parameter)); }
					if (x instanceof ISO_RECORD_MIXED) {
						arr = arr.concat(x.gene_sequences.get_unique(parameter));
						arr = arr.concat(x.protein_sequences.get_unique(parameter));
					}
				}
			}
			else if (x instanceof ISO_RECORD_COMPACT || x instanceof ISO_RECORD_COMPACT_MIXED) {
				const whitelist = ['group', 'gene', 'protein', 'record_type', 'seq_type'];
				if (whitelist.includes(parameter)) { arr.push(x[parameter]); }
				else if (parameter === 'accession') {
					if (x instanceof ISO_RECORD_COMPACT) { arr = arr.concat(Array.from(new Set(x.accessions))); }
					if (x instanceof ISO_RECORD_COMPACT_MIXED) {
						arr = arr.concat(Array.from(new Set(x.gene_accessions)));
						arr = arr.concat(Array.from(new Set(x.protein_accessions)));
					}
				}
			}
		}
		return Array.from(new Set(arr));
	}

	this.get_unique_accessions = () => { return this.get_unique('accession'); }

	this.get_unique_databases = () => { return this.get_unique('database'); }

	this.get_unique_locations = () => { return this.get_unique('location'); }

	this.get_unique_gene_names = () => { return this.get_unique('gene'); }

	this.get_unique_organism_names = () => { return this.get_unique('organism'); }

	this.get_unique_protein_id = () => { return this.get_unique('protein_id'); }

	this.get_unique_protein_names = () => { return this.get_unique('protein'); }

	this.get_unique_sequence_names = () => { return this.get_unique('seq_name'); }

	this.get_unique_sequence_types = () => { return this.get_unique('seq_type'); }

	this.get_unique_status = () => { return this.get_unique('status'); }

	this.includes = (parameter, filter) => {
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				if (this.includes(parameter, filter[i])) { return true; }
			}
			return false;
		}
		else {
			const filtered = this.filter_by(parameter, filter);
			if (filtered.cargo.length) { return true; }
			return false;
		}
	}

	this.includes_accession = (filter) => { return this.includes('accession', filter); }

	this.includes_database = (filter) => { return this.includes('database', filter); }

	this.includes_location = (filter) => { return this.includes('location', filter); }

	this.includes_gene_name = (filter) => { return this.includes('gene', filter); }

	this.includes_organism_name = (filter) => { return this.includes('organism', filter); }

	this.includes_protein_id = (filter) => { return this.includes('protein_id', filter); }

	this.includes_protein_name = (filter) => { return this.includes('protein', filter); }

	this.includes_sequence_name = (filter) => { return this.includes('seq_name', filter); }

	this.includes_sequence_type = (filter) => { return this.includes('seq_type', filter); }

	this.includes_status = (filter) => { return this.includes('status', filter); }

	this.is_loaded = () => {
		if (this.cargo.length) { return true; }
		return false;
	}

	this.load_compact_file = async (path) => {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		const full_path = await path_record.get_full_path();
		this.organism = '';
		this.cargo = [];
		const contents = await wrapper.read_file(full_path);
		const pre_record = JSON.parse(contents);
		if (pre_record.organism) { this.organism = pre_record.organism; }
		if (pre_record.seq_type) { this.seq_type = pre_record.seq_type; }
		if (pre_record.cargo && pre_record.cargo.length) {
			for (let i = 0; i < pre_record.cargo.length; i++) {
				let record = {};
				if (pre_record.cargo[i].seq_type && pre_record.cargo[i].record_type === 'compact') {
					record = new ISO_RECORD_COMPACT();
				}
				if (pre_record.cargo[i].seq_type && pre_record.cargo[i].record_type === 'compact mixed') {
					record = new ISO_RECORD_COMPACT_MIXED();
				}
				if (pre_record.cargo[i].accessions) { record.accessions = pre_record.cargo[i].accessions; }
				if (pre_record.cargo[i].gene_accessions) { record.gene_accessions = pre_record.cargo[i].gene_accessions; }
				if (pre_record.cargo[i].group) { record.group = pre_record.cargo[i].group; }
				if (pre_record.cargo[i].gene) { record.gene = pre_record.cargo[i].gene; }
				if (pre_record.cargo[i].protein) { record.protein = pre_record.cargo[i].protein; }
				if (pre_record.cargo[i].protein_accessions) { record.protein_accessions = pre_record.cargo[i].protein_accessions; }
				if (pre_record.cargo[i].record_type) { record.record_type = pre_record.cargo[i].record_type; }
				if (pre_record.cargo[i].seq_type) { record.seq_type = pre_record.cargo[i].seq_type; }
				this.cargo.push(record);
			}
		}
	}

	this.load_fasta_file = async (path) => {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		const full_path = await path_record.get_full_path();
		this.organism = '';
		this.cargo = [];
		const sequences = new SEQUENCES();
		await sequences.load_fasta_file(full_path);
		sequences.set_database_to_consensus();
		sequences.set_organism_name_to_consensus();
		sequences.set_sequence_type_to_consensus();
		const organisms = sequences.get_unique_organism_names();
		const seq_type = sequences.get_unique_sequence_types();
		if (organisms.length) { this.organism = organisms[0]; }
		if (seq_type.length) { this.seq_type = seq_type[0]; }
		let unique = [];
		if (this.seq_type === 'amino acids') { unique = sequences.get_unique_sequence_names(); }
		if (this.seq_type === 'nucleotides') { unique = sequences.get_unique_gene_names(); }
		if (unique.length) {
			for (let i = 0; i < unique.length; i++) {
				let filtered_sequences = new SEQUENCES();
				if (this.seq_type === 'amino acids') { filtered_sequences = sequences.filter_by_sequence_name(unique[i]); }
				if (this.seq_type === 'nucleotides') { filtered_sequences = sequences.filter_by_gene_name(unique[i]); }
				if (filtered_sequences.is_loaded()) {
					const iso_record = new ISO_RECORD();
					iso_record.group = this.cargo.length + 1;
					iso_record.seq_type = filtered_sequences.get_sequence_type();
					iso_record.sequences = filtered_sequences;
					this.cargo.push(iso_record);
				}
			}
		}
		else {
			for (let i = 0; i < sequences.cargo.length; i++) {
				const iso_record = new ISO_RECORD();
				const new_sequences = new SEQUENCES();
				new_sequences.cargo.push(sequences.cargo[i]);
				iso_record.group = this.cargo.length + 1;
				iso_record.seq_type = new_sequences.get_sequence_type();
				iso_record.sequences = new_sequences;
				this.cargo.push(iso_record);
			}
		}
	}

	this.mix = (partner) => {
		if (Array.isArray(partner)) {
			partner = this.find_partner(partner);
		}
		if (partner) {

		}
	}

	this.save_as = async (path) => {
		if (typeof (path) === 'undefined') { path = ''; }
		const record_type = this.get_record_type();
		switch (record_type) {
			case 'full': { await save_as_full(path, this.organism, this.cargo); break }
			case 'full mixed': { await save_as_full_mixed(path, this.organism, this.cargo); break }
			case 'compact': { await save_as_compact(path, this.organism, this.cargo, this.seq_type); break }
			case 'compact mixed': { await save_as_compact_mixed(path, this.organism, this.cargo, this.seq_type); break }
			default: { break; }
		}
	}

	this.set = (parameter, value) => {
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].set(parameter, value);
		}
	}

	this.set_accession = (value) => { this.set('accession', value); }

	this.set_database = (value) => { this.set('database', value); }

	this.set_location = (value) => { this.set('location', value); }

	this.set_gene_name = (value) => { this.set('gene', value); }

	this.set_organism_name = (value) => { this.set('organism', value); }

	this.set_protein_id = (value) => { this.set('protein_id', value); }

	this.set_protein_name = (value) => { this.set('protein', value); }

	this.set_sequence_name = (value) => { this.set('seq_name', value); }

	this.set_sequence_type = (value) => { this.set('seq_type', value); }

	this.set_status = (value) => { this.set('status', value); }

	this.set_database_to_consensus = () => { this.set_to_consensus('database'); }

	this.set_organism_name_to_consensus = () => {
		const value = this.get_consensus('organism');
		this.set('organism', value);
		this.organism = value;
	}

	this.set_organism_name_from_partner = (partner) => {
		if (Array.isArray(partner)) {
			partner = this.find_partner(partner);
		}
		if (partner) { this.organism = partner.organism; }
	}

	this.set_sequence_type_to_consensus = () => {
		const value = this.get_consensus('seq_type');
		this.set('seq_type', value);
		this.seq_type = value;
	}

	this.set_to_consensus = (parameter) => {
		const value = this.get_consensus(parameter);
		this.set(parameter, value);
	}

	this.unload = () => {
		const new_cargo = this.cargo;
		this.clear();
		return new_cargo;
	}

	this.update = () => {
		const organisms = this.get_unique_organism_names();
		const seq_type = this.get_unique_sequence_types();
		if (organisms.length) { this.organism = organisms[0]; }
		if (seq_type.length) { this.seq_type = seq_type[0]; }
	}

	function get_file_safe_organism_name(organism) {
		if (typeof (organism) !== 'string') { organism = ''; }
		let folder = organism || 'unknown_' + Math.random().toString(36).substring(7);
		folder = folder.replace(/[/\\?%*:|"<>]/g, ' '); // removes all illegal file characters
		folder = folder.replace(/[^\x20-\x7E]/g, ''); // removes all non-printable characters
		folder = folder.trim();
		folder = folder.replace(/ /g, '_');
		folder = folder.replace(/_+/g, '_');
		return folder;
	}

	async function save_as_compact(path, organism, cargo, seq_type) {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		if (path_record.filename) { await path_record.remove_file_name(); }
		const filename = get_file_safe_organism_name(organism);
		let extension = '.txt';
		if (seq_type === 'amino acids') { extension = '.iso_proteins'; }
		if (seq_type === 'nucleotides') { extension = '.iso_genes'; }
		await path_record.set_file_name(filename + extension);
		await path_record.force_path();
		const full_path = await path_record.get_full_path();
		let contents = '{ "organism": "' + organism + '", "seq_type": "' + seq_type + '", "cargo": ['
		for (let i = 0; i < cargo.length; i++) {
			if (i) { contents += ',' }
			const obj = {
				accessions: cargo[i].accessions,
				group: cargo[i].group,
				gene: cargo[i].gene,
				protein: cargo[i].protein,
				record_type: 'compact',
				seq_type: cargo[i].seq_type
			}
			contents += JSON.stringify(obj);
		}
		contents += ']}';
		await wrapper.write_file(full_path, contents);
	}

	async function save_as_compact_mixed(path, organism, cargo, seq_type) {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		if (path_record.filename) { await path_record.remove_file_name(); }
		const filename = get_file_safe_organism_name(organism);
		await path_record.set_file_name(filename + '.iso_mixed');
		await path_record.force_path();
		const full_path = await path_record.get_full_path();
		let contents = '{ "organism": "' + organism + '", "seq_type": "' + seq_type + '", "cargo": ['
		for (let i = 0; i < cargo.length; i++) {
			if (i) { contents += ',' }
			const obj = {
				gene_accessions: cargo[i].gene_accessions,
				group: cargo[i].group,
				gene: cargo[i].gene,
				protein: cargo[i].protein,
				protein_accession: cargo[i].protein_accessions,
				record_type: 'compact',
				seq_type: cargo[i].seq_type
			}
			contents += JSON.stringify(obj);
		}
		contents += ']}';
		await wrapper.write_file(full_path, contents);
	}

	async function save_as_full(path, organism, cargo) {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		if (path_record.filename) { await path_record.remove_file_name(); }
		const folder = get_file_safe_organism_name(organism);
		await path_record.add_folder(folder);
		await path_record.force_path();
		for (let i = 0; i < cargo.length; i++) {
			const full_path = await path_record.get_full_path();
			await cargo[i].save_as_fasta(full_path);
		}
	}

	async function save_as_full_mixed(path, organism, cargo) {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		if (path_record.filename) { await path_record.remove_file_name(); }
		const folder = get_file_safe_organism_name(organism);
		await path_record.add_folder(folder);
		await path_record.force_path();
		for (let i = 0; i < cargo.length; i++) {
			const full_path = await path_record.get_full_path();
			await cargo[i].save_as_fasta(full_path);
		}
	}

}