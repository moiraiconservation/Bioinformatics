///////////////////////////////////////////////////////////////////////////////
// orthologs.js
//	Requires: isoforms.js, pather.js, sequences.js, tsv.js, and wrapper.js
//	Uses main.js for reading and writing files

function ORTHO_BLAST() {
	this.organism_col_0 = '';
	this.organism_col_1 = '';
	this.cargo = [];

	this.find_partners = (partners) => {
		if (!Array.isArray(partners)) { return; }
		const result = { col_0: new ISOFORMS(), col_1: new ISOFORMS() };
		const col_0 = this.get_columns(0);
		const col_1 = this.get_columns(1);
		if (col_0.length && col_1.length) {
			const l = Math.min(col_0.length, col_1.length);
			for (let i = 0; i < l; i++) {
				for (let j = 0; j < partners.length; j++) {
					if (partners[j].is_loaded()) {
						if (!result.col_0.is_loaded()) { if (partners[j].includes_accession(col_0[i])) { result.col_0 = partners[j]; } }
						if (!result.col_1.is_loaded()) { if (partners[j].includes_accession(col_1[i])) { result.col_1 = partners[j]; } }
						if (result.col_0.is_loaded() && result.col_1.is_loaded()) { return result; }
					}
				}
			}
		}
		return result;
	}

	this.get_columns = (...columns) => {
		const new_table = [];
		if (!columns.length) { return new_table; }
		for (let i = 0; i < this.cargo.length; i++) {
			let new_row = [];
			for (let j = 0; j < columns.length; j++) { new_row.push(this.cargo[i][columns[j]]); }
			new_table.push(new_row);
		}
		return new_table;
	}

}

///////////////////////////////////////////////////////////////////////////////

function ORTHO_RBH() {
	this.organism_col_0 = '';
	this.organism_col_1 = '';
	this.cargo = [];

	this.load_rbh_file = async (path) => {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		const full_path = await path_record.get_full_path();
		this.organism_col_0 = '';
		this.organism_col_1 = '';
		this.cargo = [];
		const contents = await wrapper.read_file(full_path);
		const pre_record = JSON.parse(contents);
		if (pre_record.organism_col_0) { this.organism_col_0 = pre_record.organism_col_0; }
		if (pre_record.organism_col_1) { this.organism_col_1 = pre_record.organism_col_1; }
		if (pre_record.cargo) { this.cargo = pre_record.cargo; }
	}

	this.save_as = async (path) => {
		if (typeof (path) !== 'string') { path = ''; }
		const path_record = await pather.parse(path);
		if (path_record.filename) { await path_record.remove_file_name(); }
		const filename = get_file_safe_organism_name(this.organism_col_0, this.organism_col_1);
		await path_record.set_file_name(filename + '.rbh');
		await path_record.force_path();
		const full_path = await path_record.get_full_path();
		let contents = '{ "organism_col_0": "' + this.organism_col_0 + '", ';
		contents += '"organism_col_1": "' + this.organism_col_1 + '", "cargo": [';
		for (let i = 0; i < this.cargo.length; i++) {
			if (i) { contents += ',' }
			contents += JSON.stringify(this.cargo[i]);
		}
		contents += ']}';
		await wrapper.write_file(full_path, contents);
	}

	function get_file_safe_organism_name(org1, org2) {
		let filename1 = '';
		let filename2 = '';
		const parts1 = org1.split(' ');
		const parts2 = org2.split(' ');
		if (parts1[0]) { filename1 = parts1[0].charAt(0); }
		if (parts2[0]) { filename2 = parts2[0].charAt(0); }
		if (parts1[1]) { filename1 += '_' + parts1[1]; }
		if (parts2[1]) { filename2 += '_' + parts2[1]; }
		return filename1 + '_to_' + filename2;
	}

}

///////////////////////////////////////////////////////////////////////////////

function ORTHO_RECORD() {
	this.seq_name = '';
	this.isoforms = [];
}

///////////////////////////////////////////////////////////////////////////////

function ORTHOLOGS() {
	this.cargo = [];
	this.files = {
		blast: [],
		cds: [],
		isoforms: [],
		proteins: [],
		rbh: []
	}
	this.organisms = [];
	this.extra_cargo = {
		blast: [],
		graphs: [],
		isoforms: [],
		rbh: []
	};

	this.add_files = (parameter, files) => {
		const whitelist = ['blast', 'cds', 'isoforms', 'proteins', 'rbh'];
		if (!whitelist.includes(parameter)) { return; }
		if (Array.isArray(files)) {
			this.files[parameter] = this.files[parameter].concat(files);
		}
		else {
			if (typeof (files) === 'string') {
				this.files[parameter].push(files);
			}
		}
	}

	this.add_blast_files = (files) => { this.add_files('blast', files); }

	this.add_cds_files = (files) => { this.add_files('cds', files); }

	this.add_isoform_files = (files) => { this.add_files('isoforms', files); }

	this.add_protein_files = (files) => { this.add_files('proteins', files); }

	this.add_rbh_files = (files) => { this.add_files('rbh', files); }

	this.create_blast_records = async () => {
		if (!this.files.blast.length || !this.extra_cargo.isoforms.length) { return; }
		this.get_organisms();
		for (let i = this.files.blast.length - 1; i >= 0; i--) {
			const path_record = await pather.parse(this.files.blast[i]);
			const full_path = await path_record.get_full_path();
			const tsv = new TSV();
			await tsv.load_tsv_file(full_path);
			tsv.delete_columns_except(0, 1);
			const blast = new ORTHO_BLAST();
			blast.cargo = tsv.unload();
			const partners = blast.find_partners(this.extra_cargo.isoforms);
			blast.organism_col_0 = partners.col_0.organism;
			blast.organism_col_1 = partners.col_1.organism;
			this.extra_cargo.blast.push(blast);
			this.files.blast.splice(i, 1);
		}
	}

	this.create_final_graphs = () => {
		if (!this.extra_cargo.graphs.length || !this.extra_cargo.rbh.length) { return; }
		let g = 0;
		while (g < this.extra_cargo.graphs.length) {
			const matrix = this.extra_cargo.graphs[g];
			// find first empty matrix cell
			let start_i = Infinity;
			let start_j = Infinity;
			loop1:
			for (let m = 0; m < matrix.length - 1; m++) {
				for (let n = m + 1; n < matrix[m].length; n++) {
					if (matrix[m][n].i === -1 && matrix[m][n].j === -1) {
						start_i = m;
						start_j = n;
						break loop1;
					}
				}
			}
			if (start_i !== Infinity && start_j !== Infinity) {
				loop2:
				for (let i = start_i; i < matrix.length - 1; i++) {
					if (i > start_i) { start_j = i + 1; }
					for (let j = start_j; j < matrix[i].length; j++) {
						const species1 = this.organisms[i];
						const species2 = this.organisms[j];
						const table = this.extra_cargo.rbh.find((x) => { return x.organism_col_0 === species1 && x.organism_col_1 === species2; }).cargo;
						// keep the orthologs consistent with those already recorded in
						//	the current matrix
						let match_i = -1;
						let match_j = -1;
						if (j > i + 1) { match_i = matrix[i][i + 1].i; }
						if (i > 0) { match_j = matrix[0][j].j; }
						// find ALL consistent orthologs
						let match = [];
						if (match_i > -1 && match_j > -1) {
							match = table.filter((x) => { return x[0] === match_i && x[1] === match_j; });
						}
						else if (match_i > -1) { match = table.filter((x) => { return x[0] === match_i; }); }
						else if (match_j > -1) { match = table.filter((x) => { return x[1] === match_j; }); }
						if (match.length) {
							for (let k = 1; k < match.length; k++) {
								// There are multiple compatible RBHs.  Create a new graph
								//	for each possibility and and them to the cargo.
								const new_matrix = JSON.parse(JSON.stringify(matrix));
								new_matrix[i][j].i = match[k][0];
								new_matrix[i][j].j = match[k][1];
								this.extra_cargo.graphs.push(new_matrix);
							}
							matrix[i][j].i = match[0][0];
							matrix[i][j].j = match[0][1];
							this.extra_cargo.graphs[g] = matrix;
						}
						else { break loop2; }
					}
				}
			}
			g++;
		}
		// remove incomplete graphs
		for (let g = this.extra_cargo.graphs.length - 1; g >= 0; g--) {
			const matrix = this.extra_cargo.graphs[g];
			loop3:
			for (let m = 0; m < matrix.length - 1; m++) {
				for (let n = m + 1; n < matrix[m].length; n++) {
					if (matrix[m][n].i === -1 || matrix[m][n].j === -1) {
						this.extra_cargo.graphs.splice(g, 1);
						break loop3;
					}
				}
			}
		}
		this.extra_cargo.rbh = [];
	}

	this.create_initial_graphs = () => {
		if (!this.extra_cargo.rbh.length) { return; }
		this.extra_cargo.graphs = [];
		this.get_organisms();
		if (!this.organisms[0] || !this.organisms[1]) { return; }
		const species1 = this.organisms[0];
		const species2 = this.organisms[1];
		const table = this.extra_cargo.rbh.find((x) => { return x.organism_col_0 === species1 && x.organism_col_1 === species2; }).cargo;
		for (let t = 0; t < table.length; t++) {
			const matrix = new Array(this.organisms.length);
			for (let m = 0; m < matrix.length; m++) {
				matrix[m] = new Array(this.organisms.length);
				for (let n = 0; n < matrix[m].length; n++) {
					matrix[m][n] = { i: -1, j: -1 };
				}
			}
			matrix[0][1].i = table[t][0];
			matrix[0][1].j = table[t][1];
			this.extra_cargo.graphs.push(matrix);
		}
	}

	this.create_isoforms = async () => {
		if (this.files.isoforms.length) {
			await this.load_compact_isoform_files();
			return;
		}
		if (!this.files.cds.length || !this.files.proteins.length) { return; }
		for (let i = this.files.cds.length - 1; i >= 0; i--) {
			const isoforms = new ISOFORMS();
			console.log('Loading CDS file.');
			await isoforms.load_cds_fasta_file(this.files.cds[i]);
			for (let j = this.files.proteins.length - 1; j >= 0; j--) {
				const sequences = new SEQUENCES();
				console.log('Loading protein file.');
				await sequences.load_fasta_file(this.files.proteins[j]);
				if (isoforms.find_partner(sequences)) {
					console.log('Found match.');
					isoforms.merge_protein_sequences(sequences);
					console.log(isoforms);
					console.log('Saving isoform groups.');
					await isoforms.save_as('iso_full');
					isoforms.compact();
					console.log('Saving compact isoform files.');
					await isoforms.save_as('iso_compact');
					this.extra_cargo.isoforms.push(isoforms);
					this.files.proteins.splice(j, 1);
				}
			}
			this.files.cds.splice(i, 1);
		}
		this.get_organisms();
		console.log('DONE!');
	}

	this.create_rbh_records = async () => {
		if (this.files.rbh.length) {
			await this.load_rbh_files();
			this.filter_rbh_by_hits();
			return;
		}
		if (!this.extra_cargo.blast.length || !this.extra_cargo.isoforms.length) { return; }
		for (let i = 0; i < this.extra_cargo.blast.length; i++) {
			const table = this.extra_cargo.blast[i].cargo;
			const species1 = this.extra_cargo.blast[i].organism_col_0;
			const species2 = this.extra_cargo.blast[i].organism_col_1;
			const isoforms1 = this.extra_cargo.isoforms.find((x) => { return x.organism === species1; });
			const isoforms2 = this.extra_cargo.isoforms.find((x) => { return x.organism === species2; });
			const new_rbh = new ORTHO_RBH();
			new_rbh.organism_col_0 = species1;
			new_rbh.organism_col_1 = species2;
			console.log('RBH Table ' + (i + 1) + ' of ' + this.extra_cargo.blast.length + ' : ' + table.length + ' rows');
			for (let j = 0; j < table.length; j++) {
				const group1 = isoforms1.get_group_numbers_by_accession(table[j][0]);
				const group2 = isoforms2.get_group_numbers_by_accession(table[j][1]);
				if (group1.length && group2.length) { new_rbh.cargo.push([group1[0], group2[0]]) }
			}
			new_rbh.cargo = Array.from(new Set(new_rbh.cargo.map(JSON.stringify)), JSON.parse);
			await new_rbh.save_as('iso_rbh');
			this.extra_cargo.rbh.push(new_rbh);
		}
		this.filter_rbh_by_hits();
		this.extra_cargo.blast = [];
	}

	this.filter_rbh_by_hits = () => {
		if (!this.extra_cargo.rbh.length) { return; }
		for (let i = 0; i < this.extra_cargo.rbh.length; i++) {
			const species1 = this.extra_cargo.rbh[i].organism_col_0;
			const species2 = this.extra_cargo.rbh[i].organism_col_1;
			const table1 = this.extra_cargo.rbh[i].cargo;
			const table2 = this.extra_cargo.rbh.find((x) => { return (x.organism_col_0 === species2) && (x.organism_col_1 === species1); }).table;
			if (table1 && table2) {
				for (let j = table1.length - 1; j >= 0; j--) {
					const group1_1 = table1[j][0];
					const group1_2 = table1[j][1];
					const table2_row = table2.findIndex((x) => { return (x[0] === group1_2) && (x[1] === group1_1); });
					if (table2_row < 0) {
						// this is not a reciprocal best hit, so remove it from table1
						table1.splice(j, 1);
					}
				}
			}
			this.extra_cargo.rbh[i].table = table1;
		}
	}

	this.get_organisms = () => {
		const isoforms = this.extra_cargo.isoforms;
		const rbh = this.extra_cargo.rbh;
		if (isoforms.length) {
			const species = [];
			for (let i = 0; i < isoforms.length; i++) { species.push(isoforms[i].organism); }
			this.organisms = Array.from(new Set(species));
		}
		else if (rbh.length) {
			const species = [];
			for (let i = 0; i < rbh.length; i++) {
				species.push(rbh[i].organism_col_0);
				species.push(rbh[i].organism_col_1);
			}
			this.organisms = Array.from(new Set(species));
		}
		this.organisms.sort((a, b) => {
			if (a < b) { return -1; }
			if (a > b) { return 1; }
			return 0;
		});
		return this.organisms;
	}

	this.load_compact_isoform_files = async (path) => {
		if (typeof (path) !== 'string') { path = ''; }
		if (path) {
			const path_record = await pather.parse(path);
			const full_path = await path_record.get_full_path();
			this.add_isoform_files(full_path);
		}
		if (this.files.isoforms.length) {
			this.extra_cargo.isoforms = [];
			for (let i = this.files.isoforms.length - 1; i >= 0; i--) {
				const isoforms = new ISOFORMS();
				await isoforms.load_compact_isoform_file(this.files.isoforms[i]);
				this.extra_cargo.isoforms.push(isoforms);
				this.files.isoforms.splice(i, 1);
			}
			this.get_organisms();
		}
	}

	this.load_rbh_files = async (path) => {
		if (typeof (path) !== 'string') { path = ''; }
		if (path) {
			const path_record = await pather.parse(path);
			const full_path = await path_record.get_full_path();
			this.add_rbh_files(full_path);
		}
		if (this.files.rbh.length) {
			this.extra_cargo.rbh = [];
			for (let i = this.files.rbh.length - 1; i >= 0; i--) {
				const rbh = new ORTHO_RBH();
				await rbh.load_rbh_file(this.files.rbh[i]);
				this.extra_cargo.rbh.push(rbh);
				this.files.rbh.splice(i, 1);
			}
			this.get_organisms();
		}
	}

	/////////////////////////////////////////////////////////////////////////////

}