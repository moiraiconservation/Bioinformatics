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
	this.protein = '';
	this.isoforms = [];
}

function ORTHOLOGS() {
	this.cargo = [];
	this.organisms = [];
	this.housekeeping = {
		blast_cargo: [],
		graphs_cargo: [],
		isoform_cargo: [],
		rbh_cargo: []
	};

	this.load_blast_files = async (paths) => {
		for (let i = 0; i < paths.length; i++) {
			const blast_rbh = new BLAST_RBH();
			const tsv = new TSV();
			await tsv.load_tsv_file(paths[i]);
			tsv.delete_columns_except(0, 1);
			blast_rbh.table = tsv.unload();
			this.housekeeping.blast_cargo.push(blast_rbh);
		}
	}

	this.load_fasta_files = async (paths) => {
		for (let i = 0; i < paths.length; i++) {
			console.log('Loading FASTA file: ' + (i + 1) + ' of ' + paths.length);
			const isoforms = new ISOFORMS();
			await isoforms.load_fasta_file(paths[i]);
			if (!isoforms.organism) {
				isoforms.set_organism_name_from_partner(this.housekeeping.isoform_cargo);
			}
			//console.log('Saving full isoform group files: ' + (i + 1) + ' of ' + paths.length);
			//await isoforms.save_as('iso_full');
			isoforms.compact();
			//console.log('Saving compact isoform group files: ' + (i + 1) + ' of ' + paths.length);
			//await isoforms.save_as('iso_compact');
			this.housekeeping.isoform_cargo.push(isoforms);
			console.log(isoforms);
			console.log(' ');
		}
	}

	// undocumented methods
	this.create_initial_graphs = () => {
		const species1 = this.organisms[0];
		const species2 = this.organisms[1];
		const table = this.rbh_cargo.find((x) => { return x.organism_col_0 === species1 && x.organism_col_1 === species2; }).table;
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
			this.housekeeping.graphs_cargo.push(matrix);
		}
	}

	this.__create_rbh_cargo = () => {
		for (let i = 0; i < this.housekeeping.blast_cargo.length; i++) {
			const table = this.housekeeping.blast_cargo[i].table;
			const species1 = this.housekeeping.blast_cargo[i].organism_col_0;
			const species2 = this.housekeeping.blast_cargo[i].organism_col_1;
			const isoforms1 = this.housekeeping.isoform_cargo.find((x) => { return x.organism === species1; })
			const isoforms2 = this.housekeeping.isoform_cargo.find((x) => { return x.organism === species2; })
			const new_rbh = new RBH();
			new_rbh.organism_col_0 = species1;
			new_rbh.organism_col_1 = species2;
			for (let j = 0; j < table.length; j++) {
				console.log('RBH Table ' + (i + 1) + ' of ' + this.housekeeping.blast_cargo.length + ' : ' + ' Entry ' + (j + 1) + ' of ' + table.length);
				const group1 = isoforms1.get_group_numbers_by_accession(table[j][0]);
				const group2 = isoforms2.get_group_numbers_by_accession(table[j][1]);
				if (group1.length && group2.length) { new_rbh.table.push([ group1[0], group2[0] ]) }
			}
			new_rbh.table = Array.from(new Set(new_rbh.table.map(JSON.stringify)), JSON.parse);
			this.housekeeping.rbh_cargo.push(new_rbh);
		}
		this.housekeeping.blast_cargo = [];
	}

	this.__filter_rbh_cargo_by_hits = () => {
		for (let i = 0; i < this.housekeeping.rbh_cargo.length; i++) {
			const species1 = this.housekeeping.rbh_cargo[i].organism_col_0;
			const species2 = this.housekeeping.rbh_cargo[i].organism_col_1;
			const table1 = this.housekeeping.rbh_cargo[i].table;
			const table2 = this.housekeeping.rbh_cargo.find((x) => { return (x.organism_col_0 === species2) && (x.organism_col_1 === species1); }).table;
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
			this.housekeeping.rbh_cargo[i].table = table1;
		}
	}

	this.__finish_graphs = () => {
		let g = 0;
		while (g < this.graphs_cargo.length) {
			console.log('Finishing Graphs: ' + (g + 1) + ' of ' + this.graphs_cargo.length);
			const matrix = this.graphs_cargo[g];
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
						const table = this.rbh_cargo.find((x) => { return x.organism_col_0 === species1 && x.organism_col_1 === species2; }).table;
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
								this.housekeeping.graphs_cargo.push(new_matrix);
							}
							matrix[i][j].i = match[0].i;
							matrix[i][j].j = match[0].j;
							this.graphs_cargo[g] = matrix;
						}
						else { break loop2; }
					}
				}
			}
			g++;
		}
		this.housekeeping.rbh_cargo = [];
	}

	this.__match_organisms = () => {
		if (this.housekeeping.blast_cargo.length && this.housekeeping.isoform_cargo.length) {
			for (let i = 0; i < this.housekeeping.blast_cargo.length; i++) {
				const col_0 = this.housekeeping.blast_cargo[i].table[0][0];
				const col_1 = this.housekeeping.blast_cargo[i].table[0][1];
				for (let j = 0; j < this.housekeeping.isoform_cargo.length; j++) {
					if (this.housekeeping.isoform_cargo[j].includes_accession(col_0)) {
						this.housekeeping.blast_cargo[i].organism_col_0 = this.housekeeping.isoform_cargo[j].organism;
						if (!this.organisms.includes(this.housekeeping.blast_cargo[i].organism_col_0)) {
							this.organisms.push(this.housekeeping.blast_cargo[i].organism_col_0);
						}
					}
					if (this.housekeeping.isoform_cargo[j].includes_accession(col_1)) {
						this.housekeeping.blast_cargo[i].organism_col_1 = this.housekeeping.isoform_cargo[j].organism;
						if (!this.organisms.includes(this.housekeeping.blast_cargo[i].organism_col_1)) {
							this.organisms.push(this.housekeeping.blast_cargo[i].organism_col_1);
						}
					}
				}
			}
			this.organisms.sort((a, b) => {
				if (a < b) { return -1; }
				if (a > b) { return 1; }
				return 0;
			});
			this.__create_rbh_cargo();
			this.__filter_rbh_cargo_by_hits();
			this.__create_initial_graphs();
			this.__finish_graphs();
		}
	}

}