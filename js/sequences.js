///////////////////////////////////////////////////////////////////////////////
// sequences.js
//	Requires: wrapper.js
//	Uses main.js for reading files

///////////////////////////////////////////////////////////////////////////////
// seq_record.js //////////////////////////////////////////////////////////////

function SEQ_INFO() {
	// These are the standard entries, but more variable can be added
	//	dynamically when the parse function is called from the
	//	SEQUENCES object.
	this.accession = '';
	this.concatenated = [];
	this.database = '';
	this.gene = '';
	this.isoform = '';
	this.location = '';
	this.organism = '';
	this.protein = '';
	this.seq_type = 'unknown';
	this.status = '';
}

function SEQ_RECORD() {
	// every sequence record object always has a defline (definition line),
	//	a sequence, and any information gained from parsing the defline.
	this.defline = '';
	this.sequence = '';
	this.info = new SEQ_INFO();

	this.alphabet = () => { return Array.from(new Set(this.sequence)); }

	this.create_filename = () => {
		let filename = this.defline;
		filename = filename.replace(/[/\\?%*:|"<>]/g, ' ');
		filename = filename.trim();
		filename = filename.replace(/ /g, '_');
		filename = filename.replace(/_+/g, '_');
		switch (this.info.seq_type) {
			case 'amino acids': { filename += '.faa'; break; }
			case 'nucleotides': { filename += '.fna'; break; }
			default: { filename += '.fasta'; break; }
		}
		return filename;
	}

	this.to_fasta = () => {
		let fasta = '>' + this.defline + '\n';
		let sequence = this.sequence;
		while (sequence.length) {
			fasta += sequence.slice(0, 80) + '\n';
			sequence = sequence.replace(sequence.slice(0, 80), '');
		}
		return fasta;
	}

	this.to_uppercase = () => { this.sequence = this.sequence.toUpperCase(); }

	this.save_fasta = async (path) => {
		if (typeof (path) === 'undefined') { path = this.create_filename(); }
		const contents = this.to_fasta();
		await wrapper.write_file(path, contents);
	}

	this.sdust = (options) => {
		//////////////////////////////////////////////////////////////////////
		//  The SDUST algorithm is designed for masking low-complexity
		//	regions within nucleotide sequences.  For a complete discussion,
		//	see following:
		//    Morgulis, A., Gertz, E. M., Schäffer, A. A., & Agarwala, R.
		//			(2006). A fast and symmetric DUST implementation to mask
		//			low-complexity DNA sequences. Journal of Computational
		//			Biology, 13(5), 1028-1040.
		//////////////////////////////////////////////////////////////////////
		if (typeof (options) === 'undefined') { options = {}; }
		if (!options.window_length) {
			options.window_length = 64;
			if (this.sequence.length < options.window_length) { options.window_length = this.sequence.length; }
		}
		if (!options.score_threshold) { options.score_threshold = 2; }
		let window_start = 0;
		let window_end = options.window_length;
		// step 1 | find the perfect intervals in the first window
		let w1 = this.sequence.slice(window_start, window_end);
		let subsequences = get_every_substring(w1);
		let perfect_intervals = find_perfect_intervals(subsequences);
		// step 2 | move the window across the sequence
		window_start++;
		window_end++;
		while (window_end <= this.sequence.length) {
			let wk = this.sequence.slice(window_start, window_end);
			subsequences = get_every_suffix(wk, window_start);
			perfect_intervals = find_perfect_intervals(subsequences, perfect_intervals);
			window_start++;
			window_end++;
		}
		// step 3 | mask the low complexity regions
		for (let i = 0; i < perfect_intervals.length; i++) {
			let mask = this.sequence.substring(perfect_intervals[i].start, perfect_intervals[i].end).toLowerCase();
			let seq1 = this.sequence.substring(0, perfect_intervals[i].start);
			let seq2 = this.sequence.substring(perfect_intervals[i].end);
			this.sequence = seq1 + mask + seq2;
		}

		function calculate_score(str) {
			if (str.length <= 3) { return 0; }
			const triplets = count_triplets(str);
			let numerator = 0;
			for (let i = 0; i < triplets.length; i++) {
				numerator = numerator + ((triplets[i] * (triplets[i] - 1)) / 2);
			}
			let score = numerator / (str.length - 3);
			return score;
		}

		function count_triplets(str) {
			const triplets = [];
			for (let i = 0; i < 64; i++) { triplets.push(0); }
			for (let i = 0; i <= (str.length - 3); i++) {
				let triplet = str.slice(i, i + 3);
				triplets[triplet_to_index(triplet)]++;
			}
			return triplets;
		}

		function find_perfect_intervals(seq_array, interval_array) {
			if (typeof (interval_array) === "undefined") { interval_array = []; }
			let intervals = [];
			for (let i = 0; i < interval_array.length; i++) { intervals.push(interval_array[i]); }
			for (let i = 0; i < seq_array.length; i++) {
				seq_array[i].remove = false;
				seq_array[i].score = calculate_score(seq_array[i].str);
				if (seq_array[i].score > options.score_threshold) {
					intervals.push(seq_array[i]);
				}
			}
			for (let i = 0; i < intervals.length; i++) {
				for (let j = 0; j < intervals.length; j++) {
					if (j != i) {
						if (intervals[j].remove == false) {
							// check to see if intervals[i] is a subsequence of intervals[j]
							if ((intervals[i].start >= intervals[j].start) && (intervals[i].end <= intervals[j].end)) {
								if (intervals[i].score > intervals[j].score) { intervals[j].remove = true; }
							}
							// check to see if intervals[j] is a subsequence of intervals[i]
							else if ((intervals[j].start >= intervals[i].start) && (intervals[j].end <= intervals[i].end)) {
								if (intervals[j].score > intervals[i].score) { intervals[i].remove = true; }
							}
						}
					}
				}
			}
			const perfect_intervals = [];
			while (intervals.length) {
				let interval = intervals.pop();
				if (interval.remove == false) { perfect_intervals.push(interval); }
			}
			return perfect_intervals;
		}

		function get_every_substring(str, offset) {
			if (typeof (offset) === 'undefined') { offset = 0; }
			var i, j, result = [];
			for (i = 0; i < str.length; i++) {
				for (j = i + 1; j < str.length; j++) {
					let obj = {};
					obj.str = str.slice(i, j);
					obj.start = i + offset;
					obj.end = j + offset;
					result.push(obj);
				}
			}
			return result;
		}

		function get_every_suffix(str, offset) {
			if (typeof (offset) === 'undefined') { offset = 0; }
			var i, j, result = [];
			for (i = 0; i < str.length; i++) {
				let obj = {};
				obj.str = str.slice(i, str.length);
				obj.start = i + offset;
				obj.end = str.length + offset;
				result.push(obj);
			}
			return result;
		}

		function triplet_to_index(triplet) {
			let index = 0;
			let factor = 1;
			for (let i = (triplet.length - 1); i >= 0; i--) {
				let value = 0;
				let letter = triplet[i];
				switch (letter) {
					case 'A': { value = 0; break; }
					case 'C': { value = 1; break; }
					case 'G': { value = 2; break; }
					case 'T': { value = 3; break; }
					default: { break; }
				}
				index = index + (value * factor);
				factor = factor * 4;
			}
			return index;
		}

	}

	this.seg = (options) => {
		//////////////////////////////////////////////////////////////////////
		//   The segmentation (SEG) algorithm finds and soft-masks (sets to
		//   lowercase) low-complexity regions of sequences.
		//   References:
		//   [1] Wootton, J. C., & Federhen, S. (1993). Statistics of
		//        local complexity in amino acid sequences and sequence
		//        databases. Computers & chemistry, 17(2), 149-163.
		//   [2] Wootton, J. C., & Federhen, S. (1996). [33] Analysis of
		//        compositionally biased regions in sequence databases.
		//        In Methods in enzymology (Vol. 266, pp. 554-571).
		//        Academic Press.
		////////////////////////////////////////////////////////////////////////
		if (typeof (options) === 'undefined') { options = {}; }
		if (!options.w) { options.w = 12; }   // trigger window length
		if (!options.k2_1) { options.k2_1 = 2.2; }   // trigger complexity (in bits)
		if (!options.k2_2) { options.k2_2 = 2.5; }   // extension complexity (in bits)
		if (!options.alphabet) { options.alphabet = 20; }   // the number of possible characters (default set for amino acids)
		if (!options.memory_limit) { options.memory_limit = 500; }   // sequences longer than this will skip calculating P0
		// seed words
		let index = options.w;
		let vector_array = [];
		while (index <= this.sequence.length) {
			let word = this.sequence.substring(index - options.w, index);
			let obj = create_vector_object(word, (index - options.w), index, options);
			// extend
			if (obj.k2 <= options.k2_1) {
				let k2_2 = obj.k2;
				let extend_left = obj.start - 1;
				let extend_right = obj.end + 1;
				// extend left
				while ((k2_2 <= options.k2_2) && (extend_left >= 0)) {
					word = this.sequence.substring(extend_left, obj.end);
					let new_obj = create_vector_object(word, extend_left, obj.end, options);
					k2_2 = new_obj.k2;
					if (k2_2 <= options.k2_2) { obj = new_obj; }
					extend_left--;
				}
				// extend right
				k2_2 = obj.k2;
				while ((k2_2 <= options.k2_2) && (extend_right <= this.sequence.length)) {
					word = this.sequence.substring(obj.start, extend_right);
					let new_obj = create_vector_object(word, obj.start, extend_right, options);
					k2_2 = new_obj.k2;
					if (k2_2 <= options.k2_2) { obj = new_obj; }
					extend_right++;
				} // end while
				index = obj.end;
				vector_array.push(obj);
			}
			index++;
		}
		// merge overlapping vectors
		vector_array = merge_vector_overlap(vector_array);
		let seg_characters = 0;
		for (let i = 0; i < vector_array.length; i++) { seg_characters += vector_array[i].window_length; }
		// calculate P0 and mask low complexity segments
		if (seg_characters < options.memory_limit) {
			for (let i = 0; i < vector_array.length; i++) {
				let substr_vector_array = [];
				substr_array = get_substrings(this.sequence.substring(vector_array[i].start, vector_array[i].end), vector_array[i].start);
				for (let j = 0; j < substr_array.length; j++) {
					let N = vector_array[i].alphabet;
					let L = substr_array[j].end - substr_array[j].start;
					let F = 1;
					let omega = 1;
					let substr_vector = create_vector_object(substr_array[j].str, substr_array[j].start, substr_array[j].end, options);
					let r_dist = new Array((N + 1)); r_dist[N] = 0;
					for (let k = 0; k < N; k++) {
						if (!r_dist[k]) { r_dist[k] = 0; }
						if (!r_dist[substr_vector.vector[k]]) { r_dist[substr_vector.vector[k]] = 0; }
						r_dist[substr_vector.vector[k]]++;
					}
					for (let k = 0; k < r_dist.length; k++) { if (r_dist[k]) { F = F * factorial(r_dist[k]); } }
					F = factorial(N) / F;
					for (let k = 0; k < substr_vector.vector.length; k++) { if (substr_vector.vector[k]) { omega = omega * factorial(substr_vector.vector[k]); } }
					omega = factorial(L) / omega;
					let P0 = (omega * F) / Math.pow(N, L);
					substr_vector.P0 = P0;
					substr_vector_array.push(substr_vector);
				}
				let lowest_P0 = 10000;
				let lowest_P0_index = 0;
				for (j = 0; j < substr_vector_array.length; j++) {
					if (substr_vector_array[j].P0 < lowest_P0) { lowest_P0 = substr_vector_array[j].P0; lowest_P0_index = j; }
				}
				let seg_start = substr_vector_array[lowest_P0_index].start;
				let seg_end = substr_vector_array[lowest_P0_index].end;
				let mask = this.sequence.substring(seg_start, seg_end).toLowerCase();
				this.sequence = this.sequence.substr(0, seg_start) + mask + this.sequence.substr(seg_end);
			}
		}
		else {
			// alternative quick-and-dirty method for long sequences
			for (let i = 0; i < vector_array.length; i++) {
				let seg_start = vector_array[i].start;
				let seg_end = vector_array[i].end;
				let mask = this.sequence.substring(seg_start, seg_end).toLowerCase();
				this.sequence = this.sequence.substr(0, seg_start) + mask + this.sequence.substr(seg_end);
			}
		}

		function create_vector_object(word, start, stop, options) {
			let distribution = {};
			for (let i = 0; i < word.length; i++) {
				if (!distribution[word[i]]) { distribution[word[i]] = 0; }
				distribution[word[i]]++;
			}
			let keys = Object.keys(distribution);
			let alphabet = options.alphabet;
			let vector = [];
			if (keys.length > alphabet) { alphabet = keys.length; }
			for (let i = 0; i < alphabet; i++) {
				if (keys[i]) { vector.push(distribution[keys[i]]); }
				else { vector.push(0); }
			}
			vector.sort(function (a, b) {
				if (a < b) { return 1; }
				if (a > b) { return -1; }
				return 0;
			});
			// calculate complexity in bits
			let complexity = 0;
			for (let i = 0; i < vector.length; i++) {
				if (vector[i]) {
					let a = vector[i] / options.w;
					complexity += (a * Math.log2(a));
				}
			}
			complexity = complexity * -1;
			let obj = { alphabet: alphabet, window_length: (stop - start), vector: vector, start: start, end: stop, k2: complexity, keep: true };
			return obj;
		}

		function factorial(n) {
			let fact = 1;
			for (var i = 1; i <= n; i++) { fact = fact * i; }
			return fact;
		}

		function get_substrings(str, offset) {
			if (typeof (offset) === 'undefined') { offset = 0; }
			var i, j, result = [];
			for (i = 0; i < str.length; i++) {
				for (j = i + 1; j < str.length + 1; j++) {
					let obj = {};
					obj.str = str.slice(i, j);
					obj.start = i + offset;
					obj.end = j + offset;
					result.push(obj);
				}
			}
			return result;
		}

		function merge_vector_overlap(vector_array) {
			let new_vector_array = [];
			for (let i = (vector_array.length - 1); i >= 1; i--) {
				if (vector_array[i].start < vector_array[(i - 1)].end) {
					vector_array[i].keep = false;
					if (vector_array[i].start < vector_array[(i - 1)].start) { vector_array[(i - 1)].start = vector_array[i].start; }
					if (vector_array[i].end > vector_array[(i - 1)].end) { vector_array[(i - 1)].end = vector_array[i].end; }
					if (vector_array[i].alphabet > vector_array[(i - 1)].alphabet) { vector_array[(i - 1)].alphabet = vector_array[i].alphabet; }
					vector_array[(i - 1)].window_length = (vector_array[(i - 1)].end - vector_array[(i - 1)].start);
				}
			}
			for (let i = 0; i < vector_array.length; i++) {
				if (vector_array[i].keep) { new_vector_array.push(vector_array[i]); }
			}
			return new_vector_array;
		}

	}

}

///////////////////////////////////////////////////////////////////////////////

function SEQUENCES() {

	this.package = []; // array of SEQ_RECORD

	this.clear = () => { this.package = []; }

	this.filter_by_accession = (filter) => { return filter_info(filter, this.package, 'accession'); }

	this.filter_by_location = (filter) => { return filter_info(filter, this.package, 'location'); }

	this.filter_by_gene_name = (filter) => { return filter_info(filter, this.package, 'gene'); }

	this.filter_by_organism_name = (filter) => { return filter_info(filter, this.package, 'organism'); }

	this.filter_by_protein_name = (filter) => { return filter_info(filter, this.package, 'protein'); }

	this.filter_by_sequence_type = (filter) => { return filter_info(filter, this.package, 'seq_type'); }

	this.filter_by_status = (filter) => { return filter_info(filter, this.package, 'status'); }

	this.get_consensus_accession = () => { return get_consensus_info(this.package, 'accession'); }

	this.get_consensus_location = () => { return get_consensus_info(this.package, 'location'); }

	this.get_consensus_gene_name = () => { return get_consensus_info(this.package, 'gene'); }

	this.get_consensus_organism_name = () => { return get_consensus_info(this.package, 'organism'); }

	this.get_consensus_protein_name = () => { return get_consensus_info(this.package, 'protein'); }

	this.get_consensus_sequence_type = () => { return get_consensus_info(this.package, 'seq_type'); }

	this.get_consensus_status = () => { return get_consensus_info(this.package, 'status'); }

	this.get_sequence_type = () => {
		const types = [];
		for (let i = 0; i < this.package.length; i++) {
			if (this.package[i].info.seq_type) {
				types.push(this.package[i].info.seq_type);
			}
		}
		const seq_types = Array.from(new Set(types));
		if (seq_types.length === 1) { return seq_types[0]; }
		if (seq_types.length > 1) { return 'mixed'; }
		return 'unknown';
	}

	this.get_unique_accessions = () => { return get_unique_info(this.package, 'accession'); }

	this.get_unique_locations = () => { return get_unique_info(this.package, 'location'); }

	this.get_unique_gene_names = () => { return get_unique_info(this.package, 'gene'); }

	this.get_unique_organism_names = () => { return get_unique_info(this.package, 'organism'); }

	this.get_unique_protein_names = () => { return get_unique_info(this.package, 'protein'); }

	this.get_unique_sequence_types = () => { return get_unique_info(this.package, 'seq_type'); }

	this.get_unique_status = () => { return get_unique_info(this.package, 'status'); }

	this.includes_accession = (accession) => { return includes_info(this.package, 'accession', accession); }

	this.includes_location = (location) => { return includes_info(this.package, 'location', location); }

	this.includes_gene_name = (gene_name) => { return includes_info(this.package, 'gene', gene_name); }

	this.includes_organism_name = (organism_name) => { return includes_info(this.package, 'organism', organism_name); }

	this.includes_protein_name = (protein_name) => { return includes_info(this.package, 'protein', protein_name); }

	this.includes_sequence_type = (sequence_type) => { return includes_info(this.package, 'seq_type', sequence_type); }

	this.includes_status = (status) => { return includes_info(this.package, 'status', status); }

	this.is_loaded = () => {
		if (this.package.length) { return true; }
		return false;
	}

	this.load = (data) => { this.package = data; }
	
	this.load_fasta_file = async (path) => {
		const str = await wrapper.read_file(path);
		this.package = parse_fasta(str);
	}
	
	this.load_string = (str) => { this.package = parse_fasta(str); }

	function guess_sequence_type(sequence) {
		// Alphabet system based on extended one-letter sequence codes:
		// 	7 unique letters or less = probable nucleotide sequence
		//	More than 7 letters = probable amino acid sequence
		const alphabet = Array.from(new Set(sequence));
		if (alphabet.length <= 7) { return 'nucleotides'; }
		return 'amino acids';
	}

	function filter_info(filter, package, parameter) {
		const new_sequences = new SEQUENCES();
		new_sequences.package = package.filter((x) => {
			if (x.info[parameter]) { return x.info[parameter] === filter; }
			else { return false; }
		});
		return new_sequences;
	}

	function get_consensus_info(package, parameter) {
		return [...package].sort((a, b) => {
			const a_length = package.filter((v) => { return v.info[parameter] === a.info[parameter]; }).length;
			const b_length = package.filter((v) => { return v.info[parameter] === b.info[parameter]; }).length;
			return b_length - a_length;
		})[0].info[parameter];
	}

	function get_unique_info(package, parameter) {
		const arr = [];
		for (let i = 0; i < package.length; i++) {
			if (package[i].info[parameter]) {
				arr.push(package[i].info[parameter]);
			}
		}
		return Array.from(new Set(arr));
	}

	function includes_info(package, parameter, filter) {
		const found = package.findIndex((x) => { return x.info[parameter] === filter; });
		if (found >= 0) { return true; }
		return false;
	}

	function parse_fasta(str) {
		let fasta = [];
		let record = new SEQ_RECORD();
		let lines = str.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];
			if (line.includes('>')) {
				line = line.substring(1);
				if (record.sequence.length) {
					if (record.info.seq_type === 'unknown') { record.info.seq_type = guess_sequence_type(record.sequence); }
					record.sequence = record.sequence.replace(/\*/g, '');
					fasta.push(record);
				}
				record = new SEQ_RECORD();
				record.defline = line;
				record.info = parse_fasta_defline(line);
			}
			else { record.sequence += line; }
		}
		if (record.info.seq_type === 'unknown') { record.info.seq_type = guess_sequence_type(record.sequence); }
		record.sequence = record.sequence.replace(/\*/g, '');
		fasta.push(record);
		return fasta;
	}

	function parse_fasta_defline(defline) {
		let info = new SEQ_INFO();
		info = parse_fasta_defline_identifier(defline, info);
		info = parse_fasta_defline_status(defline, info);
		info = parse_fasta_defline_protein_name(defline, info);
		info = parse_fasta_defline_location(defline, info);
		info = parse_fasta_defline_isoform(defline, info);
		info = parse_fasta_defline_fields(defline, info);
		const extra = defline.split('^A');
		for (let i = 1; i < extra.length; i++) {
			info.concatenated.push(parse_fasta_defline(extra[i]));
		}
		return info;
	}

	function parse_fasta_defline_protein_name(defline, info) {
		if (typeof (info) === 'undefined') { info = new SEQ_INFO(); }
		const words = defline.split(' ');
		if (words.length > 1) {
			defline = defline.replace(words[0], '').trim();
			const parts = defline.split('[');
			parts[0] = parts[0].trim();
			let sections = parts[0].split('isoform');
			let name = sections[0].trim();
			name = name.replace('hypothetical protein ', '');
			name = name.replace('LOW QUALITY PROTEIN: ', '');
			name = name.replace('partial ', '');
			name = name.replace('probable ', '');
			name = name.replace(/,\s*$/, ''); // remove last comma
			name = name.replace(/  +/g, ' '); // remove multiple internal spaces
			info.protein = name;
		}
		return info;
	}

	function parse_fasta_defline_fields(defline, info) {
		if (typeof (info) === 'undefined') { info = new SEQ_INFO(); }
		const parts = defline.split('[');
		for (let i = 1; i < parts.length; i++) {
			parts[i] = parts[i].replace(/]/g, '');
			parts[i] = parts[i].trim();
		}
		for (let i = 1; i < parts.length; i++) {
			if (parts[i].includes('=')) {
				const kv = parts[i].split('=');
				info[kv[0]] = kv[1];
			}
			else { info.organism = parts[i]; }
		}
		// In case [protein="some name, isoform"] was a field, try again to
		//	remove the isoform from the protein name
		info.protein = info.protein.split('isoform')[0].trim();
		return info;
	}

	function parse_fasta_defline_identifier(defline, info) {
		if (typeof (info) === 'undefined') { info = new SEQ_INFO(); }
		const words = defline.split(' ');
		if (words.length) {
			if (words[0].includes('|')) {
				const parts = words[0].split('|');
				switch (parts[0]) {

					case 'dbj': {
						info.database = 'DDBJ';
						if (parts[1]) { info.accession = parts[1]; }
						if (parts[2]) { info.locus = parts[2]; }
						break;
					}

					case 'emb': {
						info.database = 'EMBL';
						if (parts[1]) { info.accession = parts[1]; }
						if (parts[2]) { info.ID = parts[2]; }
						break;
					}

					case 'gb': {
						info.database = 'NCBI GenBank';
						if (parts[1]) { info.accession = parts[1]; }
						if (parts[2]) { info.locus = parts[2]; }
						break;
					}

					case 'gi': {
						info.database = 'NCBI GenInfo';
						if (parts[1]) { info.accession = parts[1]; }
						break;
					}

					case 'ref': {
						info.database = 'NCBI Reference Sequence';
						if (parts[1]) { info.accession = parts[1]; }
						if (parts[2]) { info.locus = parts[2]; }
						break;
					}

					case 'pir': {
						info.database = 'NBRF Protein Information Resource';
						if (parts[2]) { info.accession = parts[2]; }
						break;
					}

					case 'prf': {
						info.database = 'Protein Research Foundation';
						if (parts[2]) { info.accession = parts[2]; }
						break;
					}

					case 'sp': {
						info.database = 'SWISS-PROT';
						if (parts[1]) { info.accession = parts[1]; }
						if (parts[2]) { info.entry = parts[2]; }
						break;
					}

					case 'pdb': {
						info.database = 'Brookhaven Protein Data Bank';
						if (parts[1]) { info.accession = parts[1]; }
						if (parts[2]) { info.chain = parts[2]; }
						break;
					}

					case 'pat': {
						info.database = 'Patents';
						if (parts[1]) { info.country = parts[1]; }
						if (parts[2]) { info.accession = parts[2]; }
						break;
					}

					case 'bbs': {
						info.database = 'GenInfo Backbone ID';
						if (parts[1]) { info.accession = parts[1]; }
						break;
					}

					case 'lcl': {
						info.database = 'Local';
						if (parts[1]) { info.accession = parts[1]; }
						break;
					}

					case 'gnl': {
						info.database = 'General';
						if (parts[1]) { info.database = parts[1]; }
						if (parts[2]) { info.accession = parts[2]; }
						break;
					}

				}
			}
			else { info.accession = words[0]; }
		}
		info.accession = info.accession.split('_cds_')[0];
		return info;
	}

	function parse_fasta_defline_isoform(defline, info) {
		if (typeof (info) === 'undefined') { info = new SEQ_INFO(); }
		const isoform = defline.match(/\sisoform\s[X][0-9]+\b/);
		if (isoform && isoform.length) {
			info.isoform = isoform[0].replace('isoform', '').trim();
		}
		return info;
	}

	function parse_fasta_defline_location(defline, info) {
		if (typeof (info) === 'undefined') { info = new SEQ_INFO(); }
		if (defline.includes('axonemal')) { info.location = 'axoneme'; }
		if (defline.includes('cytoplasmic')) { info.location = 'cytoplasm'; }
		if (defline.includes('lysosomal')) { info.location = 'lysosome'; }
		if (defline.includes('mitochondrial')) { info.location = 'mitochondrion'; }
		if (defline.includes('peroxisomal')) { info.location = 'peroxisome'; }
		return info;
	}

	function parse_fasta_defline_status(defline, info) {
		if (typeof (info) === 'undefined') { info = new SEQ_INFO(); }
		if (defline.includes('hypothetical protein')) {	info.status = 'hypothetical protein'; }
		if (defline.includes('LOW QUALITY PROTEIN:')) { info.status = 'low quality'; }
		if (defline.includes('partial')) { info.status = 'partial'; }
		if (defline.includes('probable')) { info.status = 'probable'; }
		return info;
	}

	this.unload = () => {
		const new_package = this.package;
		this.clear();
		return new_package;
	}

}