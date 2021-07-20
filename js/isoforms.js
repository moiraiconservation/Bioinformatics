///////////////////////////////////////////////////////////////////////////////
// isofrms.js
//	Requires: sequences.js and wrapper.js
//	Uses main.js for reading files

function ISO_RECORD() {
	this.group = 0;
	this.record_type = 'full';
	this.seq_type = '';
	this.sequences = {}; // SEQUENCES object
}

function ISO_RECORD_COMPACT() {
	this.accessions = [];
	this.group = 0;
	this.gene = '';
	this.protein = '';
	this.record_type = 'compact';
	this.seq_type = '';
}

function ISOFORMS() {

	this.package = []; // array of ISO_RECORDS
	this.organism = '';

	this.clear = () => { this.package = []; this.organism = ''; }

	this.compact = () => {
		// This function removes sequence information and is irreversible.
		const new_package = [];
		for (let i = 0; i < this.package.length; i++) {
			const new_record = new ISO_RECORD_COMPACT();
			const iso_record = this.package[i];
			new_record.group = iso_record.group;
			new_record.gene = iso_record.sequences.get_consensus_gene_name();
			new_record.protein = iso_record.sequences.get_consensus_protein_name();
			new_record.seq_type = iso_record.sequences.get_sequence_type();
			for (let j = 0; j < iso_record.sequences.package.length; j++) {
				new_record.accessions.push(iso_record.sequences.package[j].info.accession);
			}
			new_package.push(new_record);
		}
		this.package = new_package;
	}

	this.get_accession_group_number = (accession) => {
		const index = this.package.findIndex((x) => {
			return x.sequences.includes_accession(accession);
		});
		if (index && this.package[index]) { return this.package[index].group; }
		else { return -1; }
	}

	this.includes_accession = (accession) => {
		let found = false;
		for (let i = 0; i < this.package.length; i++) {
			const present = this.package[i].sequences.includes_accession(accession);
			if (present) { found = true; }
		}
		return found;
	}

	this.load_fasta_file = async (path) => {
		this.package = [];
		const sequences = new SEQUENCES();
		await sequences.load_fasta_file(path);
		const organisms = sequences.get_unique_organism_names();
		if (organisms.length === 1) { this.organism = organisms[0]; }
		const names = sequences.get_unique_protein_names();
		if (names.length) {
			for (let i = 0; i < names.length; i++) {
				const filtered_sequences = sequences.filter_by_protein_name(names[i]);
				if (filtered_sequences.is_loaded()) {
					const iso_record = new ISO_RECORD();
					iso_record.group = this.package.length + 1;
					iso_record.seq_type = filtered_sequences.get_sequence_type();
					iso_record.sequences = filtered_sequences;
					this.package.push(iso_record);
				}
			}
		}
		else {
			for (let i = 0; i < sequences.package.length; i++) {
				const iso_record = new ISO_RECORD();
				const new_sequences = new SEQUENCES();
				new_sequences.package.push(sequences.package[i]);
				iso_record.group = this.package.length + 1;
				iso_record.seq_type = new_sequences.get_sequence_type();
				iso_record.sequences = new_sequences;
				this.package.push(iso_record);
			}
		}
	}

	this.unload = () => {
		const new_package = this.package;
		this.clear();
		return new_package;
	}

}