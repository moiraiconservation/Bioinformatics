///////////////////////////////////////////////////////////////////////////////
// tree.js

function TREE() {

	function TREE_CONNECTION() {
		this.distance = 0;
		this.gene = { query: '', score: 0, subject: ''};
		this.newick = '';
		this.protein = { query: '', score: 0, subject: '' };
		this.variance = 0;
	}
	this.new_connection = () => { return new TREE_CONNECTION(); }

	function TREE_GRAPH() {
		this.complete = true;
		this.connection = []; // array of CONNECTION objects
		this.vertex = []; // array of VERTEX objects
	}
	this.new_graph = () => { return new TREE_GRAPH(); }

	function TREE_VERTEX() {
		this.accession = '';
		this.name = ''; // the name of the protein and/or gene
		this.organism = '';
	}
	this.new_vertex = () => { return new TREE_VERTEX(); }

	this.calculate_protein_distance = (graph, distance_func, clock_func, ignore_gaps) => {
		if (!graph || !distance_func) { return graph; }
		if (Array.isArray(graph)) {
			for (let x = 0; x < graph.length; x++) {
				for (let i = 0; i < graph[x].connection.length; i++) {
					for (let j = 0; j < graph[x].connection[i].length; j++) {
						if (graph[x].connection[i][j]) {
							const sequence1 = graph[x].connection[i][j].protein.query;
							const sequence2 = graph[x].connection[i][j].protein.subject;
							const d = distance_func(sequence1, sequence2, clock_func, ignore_gaps);
							graph[x].connection[i][j].distance = d.distance;
							graph[x].connection[i][j].variance = d.variance;
						}
					}
				}
			}
		}
		else {
			for (let i = 0; i < graph.connection.length; i++) {
				for (let j = 0; j < graph.connection[i].length; j++) {
					if (graph.connection[i][j]) {
						const sequence1 = graph.connection[i][j].protein.query;
						const sequence2 = graph.connection[i][j].protein.subject;
						const d = distance_func(sequence1, sequence2);
						graph.connection[i][j].distance = d.distance;
						graph.connection[i][j].variance = d.variance;
					}
				}
			}
		}
		return graph;
	}

	this.dayhoff_distance = (sequence1, sequence2, clock_func, ignore_gaps) => {
		if (!sequence1 || !sequence2) { return { distance: 0, variance: 0 }; }
		const alpha = 2.25;
		const pcgd = this.poisson_correction_gamma_distance(sequence1, sequence2, alpha, clock_func, ignore_gaps);
		return { distance: pcgd.distance, variance: pcgd.variance }
	}

	this.jtt_distance = (sequence1, sequence2, clock_func, ignore_gaps) => {
		if (!sequence1 || !sequence2) { return { distance: 0, variance: 0 }; }
		const alpha = 2.4;
		const jtt = this.poisson_correction_gamma_distance(sequence1, sequence2, alpha, clock_func, ignore_gaps);
		return { distance: jtt.distance, variance: jtt.variance };
	}

	this.neighbor_joining = (graph, show_distance) => {
		/////////////////////////////////////////////////////////////////
		// Reference:
		//		Saitou, N., & Nei, M. (1987). The neighbor-joining method:
		//		a new method for reconstructing phylogenetic trees.
		//		Molecular biology and evolution, 4(4), 406-425.
		/////////////////////////////////////////////////////////////////
		if (typeof (graph) === 'undefined') { return graph; }
		if (typeof (show_distance) === 'undefined') { show_distance = false; }
		if (Array.isArray(graph)) {
			const new_graph = [];
			for (let i = 0; i < graph.length; i++) {
				new_graph.push(this.neighbor_joining(graph[i], show_distance));
			}
			return new_graph;
		}
		if (typeof (graph.connection) == 'undefined') { return graph; }
		if (typeof (graph.vertex) == 'undefined') { return graph; }
		let d = create_d_matrix(graph);
		let distance = 0;
		let i = 0;
		let j = 0;
		const nodes = get_vertices(graph);
		const n = nodes.length;
		let labels = JSON.parse(JSON.stringify(nodes));
		do {
			let branches = new Array(n).fill(0);
			const d_star = create_d_star_matrix(d);
			[i, j] = get_smallest_distance(d_star);
			distance = d[i][j];
			const delta_ij = get_delta_ij(i, j, d);
			branches[i] = 0.5 * (d[i][j] + delta_ij);
			branches[j] = 0.5 * (d[i][j] - delta_ij);
			const ith_column = get_column(i, d);
			const jth_column = get_column(j, d);
			const ith_row = get_row(i, d);
			const jth_row = get_row(j, d);
			d = delete_two_columns(i, j, d);
			d = delete_two_rows(i, j, d);
			const new_column = new_nj(i, j, ith_column, jth_column, distance);
			const new_row = new_nj(i, j, ith_row, jth_row, distance);
			new_column.push(0);
			d = append_row(new_row, d);
			d = append_column(new_column, d);
			if (show_distance) { labels = update_labels(i, j, labels, branches); }
			else { labels = update_labels(i, j, labels); }
		} while (labels.length > 1);
		graph.newick = labels[0] + ';';
		return graph;
	}

	this.p_distance = (sequence1, sequence2, clock_func, ignore_gaps) => {
		if (!sequence1 || !sequence2) { return { distance: 0, variance: 0 }; }
		if (sequence1.length !== sequence2.length) { return { distance: 0, variance: 0 }; }
		if (!clock_func) { clock_func = (x) => { return x; } }
		if (typeof (ignore_gaps) === 'undefined') { ignore_gaps = true; }
		if (ignore_gaps) { [sequence1, sequence2] = strip_gaps([sequence1, sequence2]); }
		const nd = mismatches(sequence1, sequence2);
		const n = sequence1.length;
		const p = clock_func(nd / n);
		const variance = (p * (1 - p)) / n;
		return { distance: p, variance: variance };
	}

	this.poisson_correction_distance = (sequence1, sequence2, clock_func, ignore_gaps) => {
		if (!sequence1 || !sequence2) { return { distance: 0, variance: 0 }; }
		if (sequence1.length !== sequence2.length) { return { distance: 0, variance: 0 }; }
		if (!clock_func) { clock_func = (x) => { return x; } }
		if (typeof (ignore_gaps) === 'undefined') { ignore_gaps = true; }
		if (ignore_gaps) { if (!sequence1 || !sequence2) { return { distance: 0, variance: 0 }; } }
		[sequence1, sequence2] = strip_gaps([sequence1, sequence2]);
		const nd = mismatches(sequence1, sequence2);
		const n = sequence1.length;
		const p = nd / n;
		const d = clock_func(-1 * Math.log(1 - p));
		const variance = p / ((1 - p) * n);
		return { distance: d, variance: variance };
	}

	this.poisson_correction_gamma_distance = (sequence1, sequence2, alpha, clock_func, ignore_gaps) => {
		if (!sequence1 || !sequence2) { return { distance: 0, variance: 0 }; }
		if (sequence1.length !== sequence2.length) { return { distance: 0, variance: 0 }; }
		if (typeof (alpha) === 'undefined') { return { distance: 0, variance: 0 }; }
		if (!clock_func) { clock_func = (x) => { return x; } }
		if (typeof (ignore_gaps) === 'undefined') { ignore_gaps = true; }
		if (ignore_gaps) { [sequence1, sequence2] = strip_gaps([sequence1, sequence2]); }
		const nd = mismatches(sequence1, sequence2);
		const n = sequence1.length;
		const p = nd / n;
		const dg = clock_func(alpha * (Math.pow((1 - p), (-1 * (1 / alpha))) - 1));
		const variance = (p * (Math.pow((1 - p), (-1 * (1 + (2 / alpha)))))) / n;
		return { distance: dg, variance: variance };
	}

	this.scoredist = (sequence1, sequence2, clock_func, ignore_gaps) => {
		/////////////////////////////////////////////////////////////////
		// NOTE: This method is an implementation of the scoredist
		//	algorithm for calculating a phylogenetic tree distance
		//	metric based on	pairs of ungapped protein alignment scores.
		//	Reference:
		//		Sonnhammer, E. L., & Hollich, V. (2005). Scoredist: a simple
		//		and robust protein sequence distance estimator. BMC
		//		bioinformatics, 6(1), 1-8.
		//	Note: This function has the option to allow the algorithm to
		//	include gap scores in the calculations.  The scoredist
		//	algorithm was not originally designed to work using sequence
		//	gaps.  The variable <sigma_r> is the expected value from the
		//	BLOSUM62 matrix, which cannot be caclulated for scoring
		//	schemes involving gap penalties.  <Sigma_r> serves at the
		//	baseline from which the final distance value is scaled.  If
		//	the parameter <ignore_gaps> is set to false, the final
		//	distance estimate will be at least somewhat wrong.
		//	Note: Setting the <clock_func> parameter to the following
		//	function should scale the distance value to time in millions
		//	of years:
		//			(x) => { return ((33.985 * x) + 14.968); }
		//	This function has an r-squared value of 0.9959 and a p-value
		//	of 7.472E-011.  If no <clock_func> argument is supplied, then
		//	the algorithm returns a raw distance value.
		/////////////////////////////////////////////////////////////////
		if (!sequence1 || !sequence2) { return { distance: 0, variance: 0 }; }
		if (sequence1.length !== sequence2.length) { return { distance: 0, variance: 0 }; }
		if (!clock_func) { clock_func = (x) => { return x; } }
		if (typeof (ignore_gaps) === 'undefined') { ignore_gaps = true; }
		if (ignore_gaps) { [sequence1, sequence2] = strip_gaps([sequence1, sequence2]); }
		else {
			// trim gaps from either end
			while (sequence1.charAt(0) === '-' || sequence2.charAt(0) === '-') {
				sequence1 = sequence1.slice(1);
				sequence2 = sequence2.slice(1);
			}
			while (sequence1.charAt(sequence1.length - 1) === '-' || sequence2.charAt(sequence2.length - 1) === '-') {
				sequence1 = sequence1.slice(0, sequence1.length - 1);
				sequence2 = sequence1.slice(0, sequence2.length - 1);
			}
		}
		const n = sequence1.length;
		// Calculate the alignment score (sigma).  This section has logic in
		// place for calculating the default gap open and gap extension scores
		// for the BLOSUM62 matrix.  However, if <ignore_gaps> is set to true
		// (the default value), then neither sequence will contain gaps.
		const gap_open = 11;
		const gap_extend = 1;
		let last_gap = -Infinity;
		let sigma = 0;
		for (let i = 0; i < n; i++) {
			const a = sequence1.charAt(i);
			const b = sequence2.charAt(i);
			if (a === '-' || b === '-') {
				if (last_gap === i - 1) { sigma -= gap_extend; last_gap = i; }
				else { sigma -= (gap_open + gap_extend); last_gap = i; }
			}
			else { sigma += BLOSUM62[a][b]; }
		}
		// Calculate the expected score (sigma r)
		// -9.6875 is the expected score from the BLOSUM62 matrix
		const sigma_r = -9.6875 * sequence1.length;
		// Calculate the normalized score (sigma n) as the distance between
		//	the true score (sigma) and the expected score (sigma r).
		//	(sigma n).
		const sigma_n = sigma - sigma_r;
		// Calculate the upper limit score (sigma u)
		let sigma_u = 0;
		[sequence1, sequence2] = strip_gaps([sequence1, sequence2]);
		for (let i = 0; i < sequence1.length; i++) {
			sigma_u += BLOSUM62[sequence1.charAt(i)][sequence1.charAt(i)];
			sigma_u += BLOSUM62[sequence2.charAt(i)][sequence2.charAt(i)];
		}
		sigma_u = sigma_u / 2;
		// Calculate the normalized upper limit score (sugma un) as the
		//	distance between the upper limit (sigma u) score and the 
		//	expected score (sigma r).
		const sigma_un = sigma_u - sigma_r;
		// Calculate the the raw distance (dr) as a modified Poisson process
		const dr = clock_func(-1 * Math.log(sigma_n / sigma_un) * 100);
		return { distance: dr, variance: 0 };
	}		

	this.parse_newick = (str) => {
		/////////////////////////////////////////////////////////////////
		// Newick format parser in JavaScript.
		// Copyright (c) Jason Davies 2010.
		// Modified 2019 by Neil Copes
		// Permission is hereby granted, free of charge, to any person
		// obtaining a copy of this software and associated documentation
		// files (the "Software"), to deal in the Software without
		// restriction, including without limitation the rights to use,
		// copy, modify, merge, publish, distribute, sublicense, and/or
		// sell copies of the Software, and to permit persons to whom the
		// Software is furnished to do so, subject to the following
		// conditions: The above copyright notice and this permission
		// notice shall be included in all copies or substantial portions
		// of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT
		// WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
		// LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
		// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
		// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
		// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
		// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
		// Example tree (from http://en.wikipedia.org/wiki/Newick_format):
		/////////////////////////////////////////////////////////////////
		if (typeof (str) === 'undefined') { return {}; }
		let distance = false;
		if (str.includes(':')) { distance = true; }
		let ancestors = []; 
		let close = 0;
		let open = 0;
		let tree = {};
		try {
			if (!distance) { str = str.replace(/:/g, ' '); }
			str = str.replace(/;/g, '');
			str = str.replace(/\s*\(kingdom in.*?\)\s*/ig, '_');
			str = str.replace(/\s*\(phylum in.*?\)\s*/ig,  '_');
			str = str.replace(/\s*\(class in.*?\)\s*/ig,   '_');
			str = str.replace(/\s*\(order in.*?\)\s*/ig,   '_');
			str = str.replace(/\s*\(family in.*?\)\s*/ig,  '_');
			str = str.replace(/\s*\(genus in.*?\)\s*/ig,   '_');
			str = str.replace(/\s*\(species in.*?\)\s*/ig, '_');
			let tokens = str.split(/\s*(;|\(|\)|,|:)\s*/);
			for (let i = 0; i < tokens.length; i++) {
				let token = tokens[i];
				switch (token) {
					// new children
					case '(': {
						let subtree = {};
						tree.name = '';
						tree.children = [subtree];
						ancestors.push(tree);
						tree = subtree;
						open++;
						break;
					}
					// another branch
					case ',': {
						let subtree = {};
						if (ancestors.length == 0) { ancestors.push({ 'name': '', 'children': []}); }
						ancestors[ancestors.length - 1].name = '';
						ancestors[ancestors.length - 1].children.push(subtree);
						tree = subtree;
						break;
					}
					// optional name next
					case ')': {
						tree = ancestors.pop();
						close++;
						break;
					}
					// optional length next
					case '':  { break; }
					default: {
						let x = tokens[i-1];
						if (x == ')' || x == '(' || x == ',') {
							let part = token.split(/( |_)ott/g);
							part[0] = part[0].replace(/_/g, ' ');
							part[0] = part[0].replace(/'/g, '');
							part[0] = part[0].replace(/"/g, '');
							part[0] = part[0].trim();
							tree.name = part[0];
							if (part[2]) {
								part[2] = part[2].replace(/'/g, '');
								part[2] = part[2].replace(/"/g, '');
								tree.ott_id = part[2].trim();
							}
						}
						else if (x == ':') { if (distance) { tree.distance = parseFloat(token); } 	}
					}
				}
			}
			for (i = 0; i < (open - close); i++) { tree = ancestors.pop(); }
			tree.name = "root";
			return tree;
		}
		catch(err) { return undefined; }
	}

	this.upgma = (graph, show_distance) => {
		/////////////////////////////////////////////////////////////////
		// Reference:
		//		Sokal, R. R. (1958). A statistical method for evaluating
		//		systematic relationships. Univ. Kansas, Sci. Bull., 38,
		//		1409-1438.
		/////////////////////////////////////////////////////////////////
		if (typeof (graph) === 'undefined') { return graph; }
		if (typeof (show_distance) === 'undefined') { show_distance = false; }
		if (Array.isArray(graph)) {
			const new_graph = [];
			for (let i = 0; i < graph.length; i++) {
				new_graph.push(this.upgma(graph[i], show_distance));
			}
			return new_graph;
		}
		if (typeof (graph.connection) == 'undefined') { return graph; }
		if (typeof (graph.vertex) == 'undefined') { return graph; }
		let d = create_d_matrix(graph);
		let distance = 0;
		let i = 0;
		let j = 0;
		const nodes = get_vertices(graph);
		const n = nodes.length;
		let labels = JSON.parse(JSON.stringify(nodes));
		let weights = new Array(n).fill(1);
		let branches = new Array(n).fill(0);
		do {
			[i, j, distance] = get_smallest_distance(d);
			branches[i] = (distance / 2) - branches[i]; if (branches[i] < 0) { branches[i] = 0; }
			branches[j] = (distance / 2) - branches[j]; if (branches[j] < 0) { branches[j] = 0; }
			const ith_column = get_column(i, d);
			const jth_column = get_column(j, d);
			const ith_row = get_row(i, d);
			const jth_row = get_row(j, d);
			d = delete_two_columns(i, j, d);
			d = delete_two_rows(i, j, d);
			const new_column = new_upgma(i, j, ith_column, jth_column, weights);
			const new_row = new_upgma(i, j, ith_row, jth_row, weights);
			new_column.push(0);
			d = append_row(new_row, d);
			d = append_column(new_column, d);
			if (show_distance) { labels = update_labels(i, j, labels, branches); }
			else { labels = update_labels(i, j, labels); }
			weights = update_weights(i, j, weights);
			branches = update_branches_upgma(i, j, branches);
		} while (labels.length > 1);
		graph.newick = labels[0] + ';';
		return graph;
	}

	function append_column(column, d) {
		for (let x = 0; x < d.length; x++) {
			d[x].push(column[x]);
		}
		return d;
	}

	function append_row(row, d) {
		d.push(row);
		return d;
	}
	
	////////////////////////////////////////////////////////////////////////

	function create_d_matrix(graph) {
		let d = JSON.parse(JSON.stringify(graph.connection));
		d.push(Array(graph.connection[0].length).fill(0));
		d = d.map((i) => { return i.map((j) => { if (!j) { return 0; } else { return j.distance; }}); });
		for (let i = 0; i < d.length; i++) {
			for (let j = 0; j < d[i].length; j++) {
				if (i === j) { d[i][j] = 0; }
				else if (!d[i][j]) { d[i][j] = d[j][i]; }
			}
		}
		return d;
	}

	function create_d_star_matrix(d) {
		const n = d.length;
		const d_star = new Array(n);
		for (x = 0; x < n; x++) { d_star[x] = new Array(n).fill(0); }
		const totals = get_matrix_totals(d);
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < n; j++) {
				if (i ===j) { d_star[i][j] = 0; }
				else { d_star[i][j] = ((n - 2) * d[i][j]) - totals[i] - totals[j]; }
			}
		}
		return d_star;
	}

	function delete_column(j, d) {
		for (let m = 0; m < d.length; m++) {
			d[m] = d[m].slice(0, j).concat(d[m].slice(j + 1));
		}
		return d;
	}

	function delete_row(i, d) {
		return d.slice(0, i).concat(d.slice(i + 1));
	}

	function delete_two_columns(i, j, d) {
		const max = Math.max(i, j);
		const min = Math.min(i, j);
		d = delete_column(max, d);
		d = delete_column(min, d);
		return d;
	}

	function delete_two_rows(i, j, d) {
		const max = Math.max(i, j);
		const min = Math.min(i, j);
		d = delete_row(max, d);
		d = delete_row(min, d);
		return d;
	}

	function get_column(j, d) {
		let column = [];
		for (let m = 0; m < d.length; m++) {
			column.push(JSON.parse(JSON.stringify(d[m][j])));
		}
		return column;
	}

	function get_delta_ij(i, j, d) {
		const n = d.length;
		const totals = get_matrix_totals(d);
		return (totals[i] - totals[j]) / (n - 2);
	}

	function get_matrix_totals(d) {
		const n = d.length;
		const totals = new Array(n).fill(0);
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < n; j++) {
				totals[i] += d[i][j];
			}
		}
		return totals;
	}

	function get_row(i, d) {
		return JSON.parse(JSON.stringify(d[i]));
	}

	function get_smallest_distance(d) {
		let min = { i: 0, j: 0, d: Infinity }
		if (d.length === 2) { min = { i: 0, j: 1, d: d[0][1] }; }
		else {
			for (let i = 0; i < d.length - 1; i++) {
				for (let j = i; j < d[i].length; j++) {
					if (d[i][j]) {
						if (d[i][j] === min.d) { min = { i: i, j: j, d: d[i][j] }; }
						if (d[i][j] < min.d) {
							min = { i: i, j: j, d: d[i][j] };
						}
					}
				}
			}
		}
		if (min.d === Infinity) { min.d = 0; }
		return [ min.i, min.j, min.d ];
	}

	function get_vertices(graph) {
		const vertices = [];
		for (let i = 0; i < graph.vertex.length; i++) {
			let new_vertex = graph.vertex[i].organism;
			new_vertex = new_vertex.replace(/ /g, '_');
			vertices.push(new_vertex);
		}
		return vertices;
	}

	function mismatches(sequence1, sequence2) {
		if (!sequence1 || !sequence2) { return 0; }
		if (sequence1.length !== sequence2.length) { return 0; }
		sequence1 = sequence1.toUpperCase();
		sequence2 = sequence2.toUpperCase();
		let mismatches = 0;
		const n = sequence1.length;
		for (let i = 0; i < n; i++) {
			if (sequence1.charAt(i) !== sequence2.charAt(i)) { mismatches++; }
		}
		return mismatches++;
	}

	function new_upgma(i, j, i_vector, j_vector, weights) {
		const n = i_vector.length;
		let new_vector = new Array(n).fill(0);
		for (let x = 0; x < n; x++) {
			new_vector[x] = ((i_vector[x] * weights[i]) + (j_vector[x] * weights[j])) / (weights[i] + weights[j]);
		}
		const max = Math.max(i, j);
		const min = Math.min(i, j);
		new_vector = new_vector.slice(0, max).concat(new_vector.slice(max + 1));
		new_vector = new_vector.slice(0, min).concat(new_vector.slice(min + 1));
		return new_vector;
	}

	function new_nj(i, j, i_vector, j_vector, distance) {
		const n = i_vector.length;
		let new_vector = new Array(n).fill(0);
		for (let k = 0; k < n; k++) {
			new_vector[k] = (i_vector[k] + j_vector[k] - distance) / 2;
		}
		const max = Math.max(i, j);
		const min = Math.min(i, j);
		new_vector = new_vector.slice(0, max).concat(new_vector.slice(max + 1));
		new_vector = new_vector.slice(0, min).concat(new_vector.slice(min + 1));
		return new_vector;
	}

	function strip_gaps(arr) {
		if (typeof (arr) === 'undefined') { return []; }
		for (let i = 0; i < arr.length; i++) {
			for (let j = arr[i].length -1; j >= 0; j--) {
				if (arr[i].charAt(j) === '-') {
					for (let k = 0; k < arr.length; k++) {
						arr[k] = arr[k].slice(0, j) + arr[k].slice(j + 1);
					}
				}
			}
		}
		return arr;
	}

	function update_branches_upgma(i, j, branches) {
		const max = Math.max(i, j);
		const min = Math.min(i, j);
		let branch_i = branches[i];
		let branch_j = branches[j];
		branches = branches.slice(0, max).concat(branches.slice(max + 1));
		branches = branches.slice(0, min).concat(branches.slice(min + 1));
		const new_branch = Math.max(branch_i, branch_j);
		if (new_branch < 0) { new_branch = 0; }
		branches.push(new_branch);
		return branches;
	}

	function update_labels(i, j, labels, branches) {
		const max = Math.max(i, j);
		const min = Math.min(i, j);
		let label_i = labels[i];
		let label_j = labels[j];
		if (branches && branches.length) {
			if (branches[i] >= 0) { label_i += ':' + branches[i]; }
			if (branches[j] >= 0) { label_j += ':' + branches[j]; }
		}
		labels = labels.slice(0, max).concat(labels.slice(max + 1));
		labels = labels.slice(0, min).concat(labels.slice(min + 1));
		let new_label = '(' + label_i + ',' + label_j + ')';
		labels.push(new_label);
		return labels;
	}

	function update_weights(i, j, weights) {
		const max = Math.max(i, j);
		const min = Math.min(i, j);
		const new_weight = weights[i] + weights[j];
		weights = weights.slice(0, max).concat(weights.slice(max + 1));
		weights = weights.slice(0, min).concat(weights.slice(min + 1));
		weights.push(new_weight);
		return weights;
	}

}
