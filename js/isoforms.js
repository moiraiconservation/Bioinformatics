///////////////////////////////////////////////////////////////////////////////
// isofrms.js
//	Requires: pather.js, sequences.js, and wrapper.js
//	Uses main.js for reading and writing files

function ISO_RECORD() {
	this.cds_sequences = new SEQUENCES();
	this.group = 0;
	this.protein_sequences = new SEQUENCES();

	this.clone = () => {
		const record = new ISO_RECORD();
		record.cds_sequences = this.cds_sequences.clone();
		record.group = this.group;
		record.protein_sequences = this.protein_sequences.clone();
		return record;
	}

	this.save_as_fasta = async (path) => {
		if (typeof (path) === 'undefined') { path = ''; }
		const g_path_record = await pather.parse(path);
		const p_path_record = await pather.parse(path);
		const g_filename = create_file_name(g_path_record.basename, this.group, this.cds_sequences);
		const p_filename = create_file_name(p_path_record.basename, this.group, this.protein_sequences);
		await g_path_record.set_file_name(g_filename);
		await p_path_record.set_file_name(p_filename);
		await g_path_record.force_path();
		await p_path_record.force_path();
		const g_full_path = await g_path_record.get_full_path();
		const p_full_path = await p_path_record.get_full_path();
		if (this.cds_sequences && this.cds_sequences.cargo.length) {
			await this.cds_sequences.save_as_fasta(g_full_path);
		}
		if (this.protein_sequences && this.protein_sequences.cargo.length) {
			await this.protein_sequences.save_as_fasta(p_full_path);
		}
		return;
	}

	this.set = (parameter, value) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		const whitelist = ['group'];
		if (whitelist.includes(parameter)) { this[parameter] = value; }
		else {
			this.cds_sequences.set(parameter, value);
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
	this.seq_name = '';

	this.clone = () => {
		const record = new ISO_RECORD_COMPACT();
		record.accessions = JSON.parse(JSON.stringify(this.accessions));
		record.group = this.group;
		record.gene = this.gene;
		record.seq_name = this.seq_name;
		return record;
	}

	this.set = (parameter, value) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		const whitelist = ['accessions', 'group', 'gene', 'seq_name'];
		if (whitelist.includes(parameter)) {
			this[parameter] = value;
		}
	}

}

///////////////////////////////////////////////////////////////////////////////

function ISOFORMS() {

	this.cargo = []; // array of ISO_RECORDS
	this.options = { clean_sequences: true };
	this.organism = '';

	this.add = (record) => {
		if (Array.isArray(record)) {
			for (let i = 0; i < record.length; i++) {
				this.add(record[i]);
			}
		}
		else {
			if (record instanceof ISO_RECORD) { this.cargo.push(record); }
			if (record instanceof ISO_RECORD_COMPACT) { this.cargo.push(record); }
			if (record instanceof ISOFORMS) { this.cargo = this.cargo.concat(record.cargo); }
		}
	}

	this.clear = () => { this.organism = ''; this.cargo = []; }

	this.clone = () => {
		const iso = new ISOFORMS();
		iso.cargo = this.clone_cargo();
		iso.options.clean_sequences = this.options.clean_sequences;
		iso.organism = this.organism;
		return iso;
	}

	this.clone_cargo = () => {
		const cargo = [];
		for (let i = 0; i < this.cargo.length; i++) {
			cargo.push(this.cargo[i].clone());
		}
		return cargo;
	}

	this.compact = () => {
		// This function removes sequence information and is irreversible.
		const new_cargo = [];
		for (let i = 0; i < this.cargo.length; i++) {
			const old_record = this.cargo[i];
			const new_record = new ISO_RECORD_COMPACT();
			new_record.group = old_record.group;
			new_record.gene = old_record.cds_sequences.get_consensus_gene_name();
			new_record.seq_name = old_record.protein_sequences.get_consensus_sequence_name();
			for (let j = 0; j < old_record.protein_sequences.cargo.length; j++) {
				new_record.accessions.push(old_record.protein_sequences.cargo[j].info.accession);
			}
			new_cargo.push(new_record);
		}
		this.cargo = new_cargo;
	}

	// for the filter functions, the filter term can be a string or an array of strings
	this.filter_by = (parameter, filter) => {
		const new_isoforms = new ISOFORMS();
		if (!parameter || typeof (parameter) !== 'string') { return new_isoforms; }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				new_isoforms.add(this.filter_by(parameter, filter[i]));
			}
		}
		else {
			new_isoforms.cargo = this.cargo.filter((x) => {
				if (x instanceof ISO_RECORD) {
					const whitelist = ['group'];
					if (whitelist.includes(parameter)) {
						if (x[parameter]) { return x[parameter] === filter; }
						else { return false; }
					}
					else {
						return x.cds_sequences.includes(parameter, filter) || x.protein_sequences.includes(parameter, filter);
					}
				}
				else if (x instanceof ISO_RECORD_COMPACT) {
					const whitelist = ['group', 'gene', 'seq_name'];
					if (whitelist.includes(parameter)) {
						if (x[parameter]) { return x[parameter] === filter; }
						else { return false; }
					}
					else if (parameter === 'accession') { return x.accessions.includes(filter); }
				}
				else { return false; }
			});
		}
		new_isoforms.organism = this.organism;
		return new_isoforms.clone();
	}

	this.filter_by_accession = (filter) => { return this.filter_by('accession', filter); }

	this.filter_by_group_number = (filter) => { return this.filter_by('group', filter); }

	this.filter_by_database = (filter) => { return this.filter_by('database', filter); }

	this.filter_by_location = (filter) => { return this.filter_by('location', filter); }

	this.filter_by_gene_name = (filter) => { return this.filter_by('gene', filter); }

	this.filter_by_protein_id = (filter) => { return this.filter_by('protein_id', filter); }

	this.filter_by_protein_name = (filter) => { return this.filter_by('protein', filter); }

	this.filter_by_sequence_name = (filter) => { return this.filter_by('seq_name', filter); }

	this.filter_by_sequence_type = (filter) => { return this.filter_by('seq_type', filter); }

	this.filter_by_status = (filter) => { return this.filter_by('status', filter); }

	this.find_partner = (partner) => {
		if (Array.isArray(partner)) {
			for (let i = 0; i < partner.length; i++) {
				if (this.find_partner(partner[i])) { return partner[i]; }
			}
			return false;
		}
		else {
			const accessions = this.get_unique_accessions();
			if (accessions.length) {
				if (partner.includes_accession(accessions)) { return true; }
			}
		}
		return false;
	}

	this.get_consensus = (parameter) => {
		if (!parameter || typeof (parameter) !== 'string') { return ''; }
		const v_list = this.get_unique(parameter);
		if (v_list.length === 1) { return v_list[0]; }
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

	this.get_group_numbers_by = (parameter, filter) => {
		const group_numbers = [];
		if (!parameter || typeof (parameter) !== 'string') { return group_numbers; }
		const results = this.filter_by(parameter, filter);
		for (let i = 0; i < results.cargo.length; i++) {
			if (typeof (results.cargo[i].group) === 'number') {
				group_numbers.push(results.cargo[i].group);
			}
		}
		return group_numbers;
	}

	this.get_group_numbers_by_accession = (filter) => { return this.get_group_numbers_by('accession', filter); }

	this.get_group_numbers_by_database = (filter) => { return this.get_group_numbers_by('database', filter); }

	this.get_group_numbers_by_location = (filter) => { return this.get_group_numbers_by('location', filter); }

	this.get_group_numbers_by_gene_name = (filter) => { return this.get_group_numbers_by('gene', filter); }

	this.get_group_numbers_by_protein_id = (filter) => { return this.get_group_numbers_by('protein_id', filter); }

	this.get_group_numbers_by_protein_name = (filter) => { return this.get_group_numbers_by('protein', filter); }

	this.get_group_numbers_by_sequence_name = (filter) => { return this.get_group_numbers_by('seq_name', filter); }

	this.get_group_numbers_by_sequence_type = (filter) => { return this.get_group_numbers_by('seq_type', filter); }

	this.get_group_numbers_by_status = (filter) => { return this.get_group_numbers_by('status', filter); }

	this.get_index_by = (parameter, filter) => {
		if (!parameter || typeof (parameter) !== 'string') { return -1; }
		const whitelist = ['group'];
		if (whitelist.includes(parameter)) {
			for (let i = 0; i < this.cargo.length; i++) {
				if (typeof (this.cargo[i]) !== 'undefined') {
					if (this.cargo[i][parameter] === filter) { return i; }
				}
			}
		}
		else {
			for (let i = 0; i < this.cargo.length; i++) {
				if (typeof (this.cargo[i]) !== 'undefined') {
					if (this.cargo[i].cds_sequences.includes(parameter, filter)) { return i; }
					if (this.cargo[i].protein_sequences.includes(parameter, filter)) { return i; }
				}
			}
		}
		return -1;
	}

	this.get_index_by_accession = (filter) => { return this.get_index_by('accession', filter); }

	this.get_index_by_database = (filter) => { return this.get_index_by('database', filter); }

	this.get_index_by_group_number = (filter) => { return this.get_index_by('group', filter); }

	this.get_index_by_location = (filter) => { return this.get_index_by('location', filter); }

	this.get_index_by_gene_name = (filter) => { return this.get_index_by('gene', filter); }

	this.get_index_by_protein_id = (filter) => { return this.get_index_by('protein_id', filter); }

	this.get_index_by_protein_name = (filter) => { return this.get_index_by('protein', filter); }

	this.get_index_by_sequence_name = (filter) => { return this.get_index_by('seq_name', filter); }

	this.get_index_by_sequence_type = (filter) => { return this.get_index_by('seq_type', filter); }

	this.get_index_by_status = (filter) => { return this.get_index_by('status', filter); }

	this.get_number_of_records = () => { return this.cargo.length; }

	this.get_sequences = () => {
		const sequences = new SEQUENCES();
		for (let i = 0; i < this.cargo.length; i++) {
			const x = this.cargo[i];
			if (x.sequences) { sequences.add(x.sequences); }
			if (x.cds_sequences) { sequences.add(x.cds_sequences); }
			if (x.protein_sequences) { sequences.add(x.protein_sequences); }
		}
		return sequences;
	}

	this.get_unique = (parameter) => {
		let arr = [];
		if (!parameter || typeof (parameter) !== 'string') { return arr; }
		for (let i = 0; i < this.cargo.length; i++) {
			const x = this.cargo[i];
			if (x instanceof ISO_RECORD) {
				const whitelist = ['group'];
				if (whitelist.includes(parameter)) { arr.push(x[parameter]); }
				else {
					arr = arr.concat(x.cds_sequences.get_unique(parameter));
					arr = arr.concat(x.protein_sequences.get_unique(parameter));
				}
			}
			else if (x instanceof ISO_RECORD_COMPACT) {
				const whitelist = ['group', 'gene', 'seq_name'];
				if (whitelist.includes(parameter)) { arr.push(x[parameter]); }
				else if (parameter === 'accession') {
					arr = arr.concat(Array.from(new Set(x.accessions)));
				}
			}
		}
		return Array.from(new Set(arr));
	}

	this.get_unique_accessions = () => { return this.get_unique('accession'); }

	this.get_unique_databases = () => { return this.get_unique('database'); }

	this.get_unique_group_numbers = () => { return this.get_unique('group'); }

	this.get_unique_locations = () => { return this.get_unique('location'); }

	this.get_unique_gene_names = () => { return this.get_unique('gene'); }

	this.get_unique_organism_names = () => { return this.get_unique('organism'); }

	this.get_unique_protein_id = () => { return this.get_unique('protein_id'); }

	this.get_unique_protein_names = () => { return this.get_unique('protein'); }

	this.get_unique_sequence_names = () => { return this.get_unique('seq_name'); }

	this.get_unique_sequence_types = () => { return this.get_unique('seq_type'); }

	this.get_unique_status = () => { return this.get_unique('status'); }

	this.includes = (parameter, filter) => {
		if (!parameter || typeof (parameter) !== 'string') { return false; }
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

	this.includes_group_number = (filter) => { return this.includes('group', filter); }

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

	this.load_compact_isoform_file = async (path) => {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		const full_path = await path_record.get_full_path();
		this.organism = '';
		this.cargo = [];
		const contents = await wrapper.read_file(full_path);
		const pre_record = JSON.parse(contents);
		if (pre_record.organism) { this.organism = pre_record.organism; }
		if (pre_record.cargo && pre_record.cargo.length) {
			for (let i = 0; i < pre_record.cargo.length; i++) {
				const record = new ISO_RECORD_COMPACT();
				if (pre_record.cargo[i].accessions) { record.accessions = pre_record.cargo[i].accessions; }
				if (pre_record.cargo[i].group) { record.group = pre_record.cargo[i].group; }
				if (pre_record.cargo[i].gene) { record.gene = pre_record.cargo[i].gene; }
				if (pre_record.cargo[i].seq_name) { record.seq_name = pre_record.cargo[i].seq_name; }
				this.cargo.push(record);
			}
		}
		return;
	}

	this.load_cds_fasta_file = async (path) => {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		const full_path = await path_record.get_full_path();
		this.organism = '';
		this.cargo = [];
		const sequences = new SEQUENCES();
		await sequences.load_fasta_file(full_path);
		sequences.set_database_to_consensus();
		sequences.set_sequence_type_to_consensus();
		if (this.options.clean_sequences) { sequences.delete_by_exception(); }
		let unique = sequences.get_unique_gene_names();
		console.log(unique.length + ' groups found.');
		if (unique.length) {
			for (let i = 0; i < unique.length; i++) {
				console.log('looping');
				filtered_sequences = sequences.filter_by_gene_name(unique[i]);
				if (filtered_sequences.is_loaded()) {
					const iso_record = new ISO_RECORD();
					iso_record.group = this.cargo.length + 1;
					iso_record.cds_sequences = filtered_sequences;
					this.cargo.push(iso_record);
				}
			}
		}
		else {
			console.log('Using ' + sequences.cargo.length + ' groups.');
			for (let i = 0; i < sequences.cargo.length; i++) {
				console.log('looping');
				const iso_record = new ISO_RECORD();
				const new_sequences = new SEQUENCES();
				new_sequences.cargo.push(sequences.cargo[i]);
				iso_record.group = this.cargo.length + 1;
				iso_record.cds_sequences = new_sequences;
				this.cargo.push(iso_record);
			}
		}
		return;
	}

	this.merge_protein_sequences = (sequences) => {
		if (!sequences instanceof SEQUENCES) { console.log('Incorrect object type.'); return; }
		sequences.set_database_to_consensus();
		sequences.set_organism_name_to_consensus();
		sequences.set_sequence_type_to_consensus();
		this.organism = sequences.get_consensus_organism_name();
		const unique = this.get_unique_gene_names();
		console.log('Merging ' + unique.length + ' groups.');
		for (let i = 0; i < unique.length; i++) {
			console.log('looping');
			const index = this.get_index_by_gene_name(unique[i]);
			if (index > -1) {
				const accessions = this.cargo[index].cds_sequences.get_unique_accessions();
				this.cargo[index].protein_sequences = sequences.filter_by_accession(accessions);
				for (let j = this.cargo[index].cds_sequences.cargo.length - 1; j >= 0; j--) {
					const accession = this.cargo[index].cds_sequences.cargo[j].info.accession;
					if (!this.cargo[index].protein_sequences.includes_accession(accession)) {
						this.cargo[index].cds_sequences.cargo.splice(j, 1);
					}
				}
			}
		}
	}

	this.save_as = async (path) => {
		if (typeof (path) === 'undefined') { path = ''; }
		if (this.cargo.length) {
			if (this.cargo[0] instanceof ISO_RECORD) {
				await save_as_full(path, this.organism, this.cargo);
			}
			else if (this.cargo[0] instanceof ISO_RECORD_COMPACT) {
				await save_as_compact(path, this.organism, this.cargo);
			}
		}
		return;
	}

	this.set = (parameter, value) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
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

	this.set_to_consensus = (parameter) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		const value = this.get_consensus(parameter);
		this.set(parameter, value);
	}

	this.unload = () => {
		const new_cargo = this.cargo;
		this.clear();
		return new_cargo;
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

	async function save_as_compact(path, organism, cargo) {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		if (path_record.filename) { await path_record.remove_file_name(); }
		const filename = get_file_safe_organism_name(organism);
		await path_record.set_file_name(filename + '.isoforms');
		await path_record.force_path();
		const full_path = await path_record.get_full_path();
		let contents = '{ "organism": "' + organism + '", "cargo": ['
		for (let i = 0; i < cargo.length; i++) {
			if (i) { contents += ',' }
			const obj = {
				accessions: cargo[i].accessions,
				group: cargo[i].group,
				gene: cargo[i].gene,
				seq_name: cargo[i].seq_name
			}
			contents += JSON.stringify(obj);
		}
		contents += ']}';
		await wrapper.write_file(full_path, contents);
		return;
	}

	async function save_as_full(path, organism, cargo) {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		if (path_record.filename) { await path_record.remove_file_name(); }
		const folder = get_file_safe_organism_name(organism);
		await path_record.add_folder(folder);
		await path_record.force_path();
		console.log('Saving ' + cargo.length + ' files.');
		for (let i = 0; i < cargo.length; i++) {
			console.log('looping');
			const full_path = await path_record.get_full_path();
			await cargo[i].save_as_fasta(full_path);
		}
		return;
	}

}