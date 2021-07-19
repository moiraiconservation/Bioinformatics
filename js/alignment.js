///////////////////////////////////////////////////////////////////////////////
// alignment.js ///////////////////////////////////////////////////////////////

function ALIGNMENT() {

	function REPORT() {
		this.bit_score = 0;
		this.characters = 0;
		this.coverage = 0;
		this.gap_extend = 0;
		this.gap_open = 0;
		this.gaps = 0;
		this.matrix_name = '';
		this.mismatch = 0;
		this.nat_score = 0;
		this.pid = 0;
		this.query = '';
		this.score = 0;
		this.status = true;
		this.subject = '';
	}

	////////////////////////////////////////////////////////////////////////
	// METHODS FOR CREATING NEW ALIGNEMNTS /////////////////////////////////

	this.global = (query, subject, substitution_matrix, gap_open, gap_extend) => {
		return align(query, subject, substitution_matrix, gap_open, gap_extend, 'global');
	}

	this.local = (query, subject, substitution_matrix, gap_open, gap_extend) => {
		return align(query, subject, substitution_matrix, gap_open, gap_extend, 'local');
	}

	this.semiglobal = (query, subject, substitution_matrix, gap_open, gap_extend) => {
		return align(query, subject, substitution_matrix, gap_open, gap_extend, 'semiglobal');
	}

	////////////////////////////////////////////////////////////////////////
	// METHODS FOR CONVERTING EXISTING ALIGNEMNTS //////////////////////////

	this.align_gene_to_protein = (gene_sequence, protein_sequence, codons) => {
		if (typeof (protein_sequence) === 'undefined') { return ''; }
		if (typeof (gene_sequence) === 'undefined') { return ''; }
		if (typeof (codons) === 'undefined') { let reference = new CODONS(); codons = reference.vertebrate; }
		protein_sequence = protein_sequence.toUpperCase();
		gene_sequence = gene_sequence.toUpperCase();
		let result = '';
		if ((gene_sequence.length - 3) === (protein_sequence.replaceAll(/-/g, '').length * 3)) {
			const gap = [...protein_sequence.matchAll(/-/g)].map((a) => { return a.index; });
			for (let i = 0; i < gap.length; i++) {
				gene_sequence = gene_sequence.slice(0, gap[i] * 3) + '---' + gene_sequence.slice(gap[i] * 3);
			}
			result = gene_sequence.slice(0, gene_sequence.length - 3);
		}
		else {
			let gene_index = 0;
			let protein_index = 0;
			while ((gene_index < gene_sequence.length) && (protein_index < protein_sequence.length)) {
				const amino_acid = protein_sequence.charAt(protein_index);
				switch (amino_acid) {
					case '-': {
						result += '---';
						protein_index++;
						break;
					}
					case 'X': {
						let triplet = gene_sequence.substr(gene_index, 3);
						result += triplet;
						gene_index += 3;
						protein_index++;
						break;
					}
					default: {
						let triplet = gene_sequence.substr(gene_index, 3);
						if (codons.reverse[amino_acid].includes(triplet)) {
							result += triplet;
							gene_index += 3;
							protein_index++;
						}
						else { gene_index++; }
						break;
					}
				}
			}
		}
		return result;
	}
	
	////////////////////////////////////////////////////////////////////////
	// METHODS ASSOCIATED WITH MATRIX CALCULATIONS /////////////////////////

	this.expected_score = (matrix) => {
		if (typeof (matrix) === 'undefined') { return 0; }
		const amino_acids = [ 'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y' ];
		const nucleotides = [ 'A', 'C', 'G', 'T'];
		let alphabet = nucleotides;
		let expected = 0;
		const probability = Math.pow((1 / alphabet.length), 2);
		if (matrix.type === 'amino acids') { alphabet = amino_acids; }
		for (let i = 0; i < alphabet.length; i++) {
			for (let j = i; j < alphabet.length; j++) {
				expected += probability * matrix[alphabet[i]][alphabet[j]];
			}
		}
		return expected;
	}

	////////////////////////////////////////////////////////////////////////
	// PRIVATE METHODS /////////////////////////////////////////////////////

	function align(query, subject, substitution_matrix, gap_open, gap_extend, method) {
		const report = new REPORT();
		if (typeof (query) === 'undefined') {
			report.status = false;
			console.log('No query sequence supplied.');
			return report;
		}
		if (typeof (subject) === 'undefined') {
			report.status = false;
			console.log('No subject sequence supplied.');
			return report;
		}
		if (typeof (substitution_matrix) === 'undefined') {
			const query_alphabet = alphabet(query);
			const subject_alphabet = alphabet(subject);
			const max_alphabet = Math.max(query_alphabet.length, subject_alphabet.length);
			if (max_alphabet <= 16) { substitution_matrix = NUC_1_1; console.log('No substitution matrix supplied.  Reverting to NUC_1_1.'); }
			else { substitution_matrix = BLOSUM62; console.log('No substitution matrix supplied.  Reverting to BLOSUM62.'); }
		}
		if (typeof (gap_open) === 'undefined') { gap_open = substitution_matrix.default_gap_open; }
		if (typeof (gap_extend) === 'undefined') { gap_extend = substitution_matrix.default_gap_extend; }
		if (typeof (method) === 'undefined') { method = 'global'; }
		let stats_key = gap_open.toString() + '-' + gap_extend.toString();
		const stats_options = Object.keys(substitution_matrix.stats);
		if (!stats_options.find((x) => { return x === stats_key; })) {
			gap_open = substitution_matrix.default_gap_open;
			gap_extend = substitution_matrix.default_gap_extend;
			stats_key = gap_open.toString() + '-' + gap_extend.toString();
			console.log('Invalid gap_open and gap_extend combination.  Reverting to the default for the substitution matrix.');
		}
		const method_whitelist = ['global', 'local', 'semiglobal'];
		if (!method_whitelist.includes(method)) { method == 'global'; }
		if (/[a-z]/.test(query)) { query = query.toUpperCase(); }
		if (/[a-z]/.test(subject)) { subject = subject.toUpperCase(); }
		if (((query.length + 1) * (subject.length + 1)) > (10000 * 10000)) {
			// the necessary matrix will exceed the safe memory capacity
			report.status = false;
			return report;
		}
		let matrix = create_matrix((query.length + 1), (subject.length + 1));
		if (method === 'global') {
			matrix[0][0] = { score: 0, direction: 'horizontal' };
			matrix[1][0] = { score: 0 - (gap_open + gap_extend), direction: 'vertical' };
			matrix[0][1] = { score: 0 - (gap_open + gap_extend), direction: 'horizontal' };
			for (let row = 2; row <= query.length; row++) { matrix[row][0] = { score: 0 - (gap_open + (gap_extend * row)), direction: 'vertical' }; }
			for (let column = 2; column <= subject.length; column++) { matrix[0][column] = { score: 0 - (gap_open + (gap_extend * column)), direction: 'horizontal' }; }
		}
		else {
			for (let row = 0; row <= query.length; row++) { matrix[row][0] = { score: 0, direction: 'vertical' }; }
			for (let column = 0; column <= subject.length; column++) { matrix[0][column] = { score: 0, direction: 'horizontal' }; }
		}
		for (let row = 1; row <= query.length; row++) {
			for (let column = 1; column <= subject.length; column++) {
				matrix[row][column] = {};
				matrix[row][column].score = 0;
				matrix[row][column].direction = 'diagonal';
				let letter1 = query.charAt(row - 1);
				let letter2 = subject.charAt(column - 1);
				let diagonal_score = 0;
				let horizontal_score = 0;
				let vertical_score = 0;
				// diagonal score
				diagonal_score = matrix[(row - 1)][(column - 1)].score + substitution_matrix[letter1][letter2];
				// vertical score
				if (method === 'semiglobal' && column == subject.length) { vertical_score = matrix[(row - 1)][column].score; }
				else {
					if (matrix[(row - 1)][column].direction == 'vertical') { vertical_score = matrix[(row - 1)][column].score - gap_extend; }
					else { vertical_score = matrix[(row - 1)][column].score - (gap_open + gap_extend); }
				}
				// horizontal score
				if (method === 'semiglobal' && row == query.length) { horizontal_score = matrix[row][(column - 1)].score; }
				else {
					if (matrix[row][(column - 1)].direction == 'horizontal') { horizontal_score = matrix[row][(column - 1)].score - gap_extend; }
					else { horizontal_score = matrix[row][(column - 1)].score - (gap_open + gap_extend); }
				}
				// find max score
				let max_score = Math.max(diagonal_score, vertical_score, horizontal_score);
				matrix[row][column].score = max_score;
				if (horizontal_score == max_score) { matrix[row][column].direction = 'horizontal'; }
				if (vertical_score == max_score) { matrix[row][column].direction = 'vertical'; }
				if (diagonal_score == max_score) { matrix[row][column].direction = 'diagonal'; }
			}
		}
		let row = query.length;
		let column = subject.length;
		if (method === 'local') {
			let max_score = -Infinity;
			let max_score_row = row;
			let max_score_column = column;
			for (let i = 1; i <= query.length; i++) {
				for (let j = 1; j <= subject.length; j++) {
					if (matrix[i][j].score >= max_score) {
						max_score = matrix[i][j].score;
						max_score_row = i;
						max_score_column = j;
					}
				}
			}
			row = max_score_row;
			column = max_score_column;
		}
		report.score = matrix[row][column].score;
		while ((row > 0) || (column > 0)) {
			if (method === 'local' && matrix[row][column].score <= 0) { break; }
			switch (matrix[row][column].direction) {
				case 'diagonal': {
					report.characters++;
					report.coverage++;
					if (query.charAt(row - 1) === subject.charAt(column - 1)) { report.pid++; }
					else { report.mismatch++; }
					report.query += query.charAt(row - 1);
					report.subject += subject.charAt(column - 1);
					row--; column--;
					break;
				}
				case 'horizontal': {
					report.gaps++;
					report.query += '-';
					report.subject += subject.charAt(column - 1);
					column--;
					break;
				}
				case 'vertical': {
					report.characters++;
					report.coverage++;
					report.gaps++;
					report.query += query.charAt(row - 1);
					report.subject += '-';
					row--;
					break;
				}
			}
		}
		report.coverage = Math.round((((report.coverage / query.length) + Number.EPSILON) * 10000) / 100);
		report.nat_score = (substitution_matrix.stats[stats_key].lambda * report.score) - Math.log(substitution_matrix.stats[stats_key].k);
		report.bit_score = report.nat_score / Math.log(2);
		report.gap_extend = gap_extend;
		report.gap_open = gap_open;
		report.matrix_name = substitution_matrix.name;
		report.pid = Math.round((((report.pid / report.characters) + Number.EPSILON) * 10000) / 100);
		report.query = flip_string(report.query);
		report.subject = flip_string(report.subject);
		return report;
	}

	function alphabet(str) {
		let arr = [];
		let letters = '';
		for (let i = 0; i < str.length; i++) {
			if (!arr.includes(str.charAt(i))) { arr.push(str.charAt(i)); }
		}
		arr.sort((a, b) => {
			if (a < b) { return -1; }
			if (a > b) { return 1; }
			return 0;
		});
		for (let i = 0; i < arr.length; i++) { letters = letters + arr[i]; }
		return letters;
	}

	function create_matrix(rows, columns) {
		const matrix = new Array(rows);
		for (let i = 0; i < rows; i++) { matrix[i] = new Array(columns); }
		return matrix;
	}

	function flip_string(string) {
		if (typeof (string) === 'undefined') { string = ''; }
		let new_string = '';
		for (let i = (string.length - 1); i >= 0; i--) { new_string += string[i]; }
		return new_string;
	}

}
///////////////////////////////////////////////////////////////////////////////