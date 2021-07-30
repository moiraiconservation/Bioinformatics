///////////////////////////////////////////////////////////////////////////////
// orthologs.js
//	Requires: isoforms.js, pather.js, sequences.js, tsv.js, and wrapper.js
//	Uses main.js for reading and writing files

function BLAST_RBH() {
	this.organism_col_0 = '';
	this.organism_col_1 = '';
	this.table = [];
}

function RBH() {
	this.organism_col_0 = '';
	this.organism_col_1 = '';
	this.table = [];
}

function ORTHO_RECORD() {
	this.seq_name = '';
	this.isoforms = [];
}

function ORTHOLOGS() {
	this.cargo = [];
	this.files = {
		blast: [],
		cds: [],
		proteins: []
	}
	this.organisms = [];
	this.extra_cargo = {
		blast: [],
		graphs: [],
		isoforms: [],
		rbh: []
	};

	this.add_blast_files = (files) => {
		if (Array.isArray(files)) {
			this.files.blast = this.files.blast.concat(files);
		}
		else {
			if (typeof (files) === 'string') {
				this.files.blast.push(files);
			}
		}
	}

	this.add_cds_files = (files) => {
		if (Array.isArray(files)) {
			this.files.cds = this.files.cds.concat(files);
		}
		else {
			if (typeof (files) === 'string') {
				this.files.cds.push(files);
			}
		}
	}

	this.add_protein_files = (files) => {
		if (Array.isArray(files)) {
			this.files.proteins = this.files.proteins.concat(files);
		}
		else {
			if (typeof (files) === 'string') {
				this.files.proteins.push(files);
			}
		}
	}

	this.create_isoforms = async () => {
		// This method is a bit odd.  It's not very efficient to repeatedly
		//	load sequence files, but the point here is to limit the amount of
		//	information held in application memory.  Hard drive memory is
		//	generally larger than application memory, so the strategy here is
		//	to store as much information as possible on the hard drive.  This
		//	approach might slow the application some, but it makes it less
		//	likely that a collection of long sequences will crash the
		//	application.
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
		console.log('DONE!');
	}

	this.load_blast_files = async (paths) => {
		for (let i = 0; i < paths.length; i++) {
			const blast_rbh = new BLAST_RBH();
			const tsv = new TSV();
			await tsv.load_tsv_file(paths[i]);
			tsv.delete_columns_except(0, 1);
			blast_rbh.table = tsv.unload();
			this.extra_cargo.blast.push(blast_rbh);
		}
	}

	// undocumented methods
	this.create_initial_graphs = () => {
		const species1 = this.organisms[0];
		const species2 = this.organisms[1];
		const table = this.rbh.find((x) => { return x.organism_col_0 === species1 && x.organism_col_1 === species2; }).table;
		for (let t = 0; t < table.length; t++) {
			console.log('Initializing graphs: ' + (t + 1) + ' of ' + table.length);
			const matrix = new Array(this.organisms.length);
			for (let m = 0; m < matrix.length; m++) {
				matrix[m] = new Array(this.organisms.length);
				for (let n = 0; n < matrix[m].length; j++) {
					matrix[m][n] = { i: -1, j: -1 };
				}
			}
			matrix[0][1].i = table[t][0];
			matrix[0][1].j = table[t][1];
			this.extra_cargo.graphs.push(matrix);
		}
	}

	this.__create_rbh = () => {
		for (let i = 0; i < this.extra_cargo.blast.length; i++) {
			const table = this.extra_cargo.blast[i].table;
			const species1 = this.extra_cargo.blast[i].organism_col_0;
			const species2 = this.extra_cargo.blast[i].organism_col_1;
			const isoforms1 = this.extra_cargo.isoforms.find((x) => { return x.organism === species1; })
			const isoforms2 = this.extra_cargo.isoforms.find((x) => { return x.organism === species2; })
			const new_rbh = new RBH();
			new_rbh.organism_col_0 = species1;
			new_rbh.organism_col_1 = species2;
			for (let j = 0; j < table.length; j++) {
				console.log('RBH Table ' + (i + 1) + ' of ' + this.extra_cargo.blast.length + ' : ' + ' Entry ' + (j + 1) + ' of ' + table.length);
				const group1 = isoforms1.get_group_numbers_by_accession(table[j][0]);
				const group2 = isoforms2.get_group_numbers_by_accession(table[j][1]);
				if (group1.length && group2.length) { new_rbh.table.push([ group1[0], group2[0] ]) }
			}
			new_rbh.table = Array.from(new Set(new_rbh.table.map(JSON.stringify)), JSON.parse);
			this.extra_cargo.rbh.push(new_rbh);
		}
		this.extra_cargo.blast = [];
	}

	this.__filter_rbh_by_hits = () => {
		for (let i = 0; i < this.extra_cargo.rbh.length; i++) {
			const species1 = this.extra_cargo.rbh[i].organism_col_0;
			const species2 = this.extra_cargo.rbh[i].organism_col_1;
			const table1 = this.extra_cargo.rbh[i].table;
			const table2 = this.extra_cargo.rbh.find((x) => { return (x.organism_col_0 === species2) && (x.organism_col_1 === species1); }).table;
			if (table1 && table2) {
				for (let j = table1.length - 1; j >= 0; j--) {
					console.log('Filtering RBHs ' + j + ' of ' + table1.length);
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

	this.__finish_graphs = () => {
		let g = 0;
		while (g < this.graphs.length) {
			console.log('Finishing Graphs: ' + (g + 1) + ' of ' + this.graphs.length);
			const matrix = this.graphs[g];
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
						const table = this.rbh.find((x) => { return x.organism_col_0 === species1 && x.organism_col_1 === species2; }).table;
						// keep the orthologs consistent with those already recorded in
						//	the current matrix
						let match_i = -1;
						let match_j = -1;
						if (j > 1 + 1) { match_i = matrix[i][i + 1].i; }
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
								new_matrix[i][j].i = match[k].i;
								new_matrix[i][j].j = match[k].j;
								this.extra_cargo.graphs.push(new_matrix);
							}
							matrix[i][j].i = match[0].i;
							matrix[i][j].j = match[0].j;
							this.graphs[g] = matrix;
						}
						else { break loop2; }
					}
				}
			}
			g++;
		}
		this.extra_cargo.rbh = [];
	}

	this.__match_organisms = () => {
		if (this.extra_cargo.blast.length && this.extra_cargo.isoforms.length) {
			for (let i = 0; i < this.extra_cargo.blast.length; i++) {
				const col_0 = this.extra_cargo.blast[i].table[0][0];
				const col_1 = this.extra_cargo.blast[i].table[0][1];
				for (let j = 0; j < this.extra_cargo.isoforms.length; j++) {
					if (this.extra_cargo.isoforms[j].includes_accession(col_0)) {
						this.extra_cargo.blast[i].organism_col_0 = this.extra_cargo.isoforms[j].organism;
						if (!this.organisms.includes(this.extra_cargo.blast[i].organism_col_0)) {
							this.organisms.push(this.extra_cargo.blast[i].organism_col_0);
						}
					}
					if (this.extra_cargo.isoforms[j].includes_accession(col_1)) {
						this.extra_cargo.blast[i].organism_col_1 = this.extra_cargo.isoforms[j].organism;
						if (!this.organisms.includes(this.extra_cargo.blast[i].organism_col_1)) {
							this.organisms.push(this.extra_cargo.blast[i].organism_col_1);
						}
					}
				}
			}
			this.organisms.sort((a, b) => {
				if (a < b) { return -1; }
				if (a > b) { return 1; }
				return 0;
			});
			this.__create_rbh();
			this.__filter_rbh_by_hits();
			this.__create_initial_graphs();
			this.__finish_graphs();
		}
	}

}