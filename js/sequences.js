///////////////////////////////////////////////////////////////////////////////
// sequences.js
//	Requires globals: pather and wrapper
//	Requires: pather.js and wrapper.js
//	Uses main.js for reading and writing files

function SEQ_INFO() {
	// These are the standard entries, but more variable can be added
	//	dynamically when the parse function is called from the
	//	SEQUENCES object.
	this.accession = '';
	this.concatenated = [];
	this.database = 'Local';
	this.gene = '';
	this.isoform = '';
	this.location = '';
	this.organism = '';
	this.protein = '';
	this.seq_name = '';
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

	this.clone = () => {
		const record = new SEQ_RECORD();
		record.defline = this.defline;
		record.sequence = this.sequence;
		record.info = JSON.parse(JSON.stringify(this.info));
		return record;
	}

	this.create_file_name = () => {
		let filename = this.defline || 'sequence';
		filename = filename.replace(/[/\\?%*:|"<>]/g, ' '); // removes all illegal file characters
		filename = filename.replace(/[^\x20-\x7E]/g, ''); // removes all non-printable characters
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

	this.get_phylip_accession = () => {
		if (!this.info.accession) { return ''; }
		let replacement = this.info.accession;
		replacement = replacement.slice(0, 10);
		replacement = replacement.padEnd(10, 'x');
		return replacement;
	}

	this.get_phylip_organism_name = () => {
		if (!this.info.organism) { return ''; }
		const parts = this.info.organism.split(' ');
		if (!parts || !parts.length) { return ''; }
		if (parts.length === 1) {
			let replacement = parts[0].slice(0, 10);
			replacement = replacement.padEnd(10, 'x');
			return replacement;
		}
		else if (parts.length > 1) {
			let replacement = parts[0].charAt(0).toUpperCase();
			replacement += '_' + parts[1];
			replacement = replacement.slice(0, 10);
			replacement = replacement.padEnd(10, 'x');
			return replacement;
		}
		return '';
	}

	this.get_phylip_protein_id = () => {
		if (!this.info.protein_id) { return ''; }
		let replacement = this.info.protein_id;
		replacement = replacement.slice(0, 10);
		replacement = replacement.padEnd(10, 'x');
		return replacement;
	}

	this.get_words = (word_size) => {
		const words = [];
		let sequence = this.sequence.toUpperCase().replace(/-/g, '');
		for (let i = 0; i < sequence.length - word_size; i++) {
			words.push(sequence.slice(i, i + word_size));
		}
		return words;
	}

	this.get_unique_words = (word_size) => {
		const words = [];
		let sequence = this.sequence.toUpperCase().replace(/-/g, '');
		for (let i = 0; i < sequence.length - word_size; i++) {
			words.push(sequence.slice(i, i + word_size));
		}
		return Array.from(new Set(words));
	}

	this.mask_low_complexity = (options) => {
		if (this.seq_type === 'amino acids') { this.seg(options); }
		else { this.sdust(options); }
	}

	this.save_as_fasta = async (path, options) => {
		// If the filename has not been supplied, one will be created from the
		//	defline.  If the specified folders do not exist, they will be
		//	created.
		if (typeof (path) === 'undefined') { path = ''; }
		const path_record = await pather.parse(path);
		const new_filename = this.create_file_name();
		if (!path_record.filename) { await path_record.set_file_name(new_filename); }
		await path_record.force_path();
		const full_path = await path_record.get_full_path();
		const contents = this.to_fasta(options);
		await wrapper.write_file(full_path, contents);
		return;
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
			var i, result = [];
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

	this.set = (parameter, value) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		this.info[parameter] = value;
		this.defline = build_defline(this.info);
	}

	this.set_accession = (value) => {
		this.info.accession = value;
		this.defline = build_defline(this.info);
	}

	this.set_database = (value) => {
		this.info.database = value;
		this.defline = build_defline(this.info);
	}

	this.set_location = (value) => {
		this.info.location = value;
		this.defline = build_defline(this.info);
	}

	this.set_gene_name = (value) => {
		this.info.gene = value;
		this.defline = build_defline(this.info);
	}

	this.set_organism_name = (value) => {
		this.info.organism = value;
		this.defline = build_defline(this.info);
	}

	this.set_protein_name = (value) => {
		this.info.protein = value;
		this.defline = build_defline(this.info);
	}

	this.set_sequence_name = (value) => {
		this.info.seq_name = value;
		this.defline = build_defline(this.info);
	}

	this.set_sequence_type = (value) => {
		this.info.seq_type = value;
		this.defline = build_defline(this.info);
	}

	this.set_status = (value) => {
		this.info.status = value;
		this.defline = build_defline(this.info);
	}

	this.to_fasta = (options) => {
		if (typeof (options) !== 'object') { options = {}; }
		if (typeof (options.phylip_defline) === 'undefined') { options.phylip_defline = false; }
		let defline = this.defline;
		if (options.phylip_defline) {
			defline = this.get_phylip_organism_name();
			if (!defline) { defline = this.get_phylip_protein_id(); }
			if (!defline) { defline = this.get_phylip_accession(); }
			if (!defline) { defline = this.defline; }
		}
		let fasta = '>' + defline + '\n';
		let sequence = this.sequence;
		while (sequence.length) {
			fasta += sequence.slice(0, 80) + '\n';
			sequence = sequence.replace(sequence.slice(0, 80), '');
		}
		return fasta;
	}

	this.to_uppercase = () => { this.sequence = this.sequence.toUpperCase(); }

	this.unmask = () => { this.to_uppercase(); }

	function build_defline(info) {
		if (typeof (info) === 'undefined') { return ''; }
		const fields = [];
		let defline = build_defline_identifier(info);
		if (info.seq_name) { defline += ' ' + info.seq_name; }
		if (info.gene && info.gene !== info.seq_name) {
			fields.push('[gene=' + info.gene + ']');
		}
		if (info.protein && info.protein !== info.seq_name) {
			fields.push('[protein=' + info.protein + ']');
		}
		const key_whitelist = ['accession', 'concatenated', 'gene', 'protein', 'seq_name'];
		const keys = Object.keys(info);
		for (let i = 0; i < keys.length; i++) {
			if (!key_whitelist.includes(keys[i]) && info[keys[i]]) {
				fields.push('[' + keys[i] + '=' + info[keys[i]] + ']');
			}
		}
		fields.sort((a, b) => {
			if (a < b) { return -1; }
			if (a > b) { return 1; }
			return 0;
		})
		for (let i = 0; i < fields.length; i++) {
			defline += ' ' + fields[i];
		}
		for (let i = 0; i < info.concatenated.length; i++) {
			defline += '^A' + build_defline(info.concatenated[i]);
		}
		defline = defline.trim();
		defline = defline.replace(/  +/g, ' '); // remove multiple internal spaces
		return defline;
	}

	function build_defline_identifier(info) {
		if (typeof (info) === 'undefined') { return ''; }
		// build the accession using the NCBI underscore system.
		//	The format is as follows:
		//	<genomic accession.version>_<feature_type>_<product accession.version>_<counter>
		let accession = info.accession;
		if (info.genomic_accession && info.feature_type && info.accession && info.counter) {
			accession = info.genomic_accession + '_' + info.feature_type + '_' + info.accession + '_' + info.counter;
		}
		let id = '';
		if (info.database) {
			switch (info.database) {
				case 'DDBJ': {
					id += 'dbj|' + accession + '|';
					if (info.locus) { id += info.locus }
					break;
				}
				case 'EMBL': {
					id += 'emb|' + accession + '|';
					if (info.ID) { id += info.ID; }
					break;
				}
				case 'NCBI GenBank': {
					id += 'gb|' + accession + '|';
					if (info.locus) { id += info.locus }
					break;
				}
				case 'NCBI GenInfo': {
					id += 'gi|' + accession;
					break;
				}
				case 'NCBI Reference Sequence': {
					id += 'ref|' + accession + '|';
					if (info.locus) { id += info.locus }
					break;
				}
				case 'NBRF Protein Information Resource': {
					id += 'pir||' + accession;
					break;
				}
				case 'Protein Research Foundation': {
					id += 'prf||' + accession;
					break;
				}
				case 'SWISS-PROT': {
					id += 'sp|' + accession + '|';
					if (info.entry) { id += info.entry; }
					break;
				}
				case 'Brookhaven Protein Data Bank': {
					id += 'pdb|' + accession + '|';
					if (info.chain) { id += info.chain; }
					break;
				}
				case 'Patents': {
					id += 'pat|';
					if (info.country) { id += info.country; }
					id += '|' + accession;
					break;
				}
				case 'GenInfo Backbone ID': {
					id += 'bbs|' + accession;
					break;
				}
				case 'Local': {
					id += 'lcl|' + accession;
					break;
				}
				case 'General': {
					id += 'gnl||' + accession;
					break;
				}
				default: {
					id += 'gnl|' + info.database + '|' + accession;
					break;
				}
			}
		}
		else { id += 'lcl|' + accession; }
		return id;
	}

}

///////////////////////////////////////////////////////////////////////////////

function SEQUENCES() {

	this.cargo = []; // array of SEQ_RECORD

	this.add = (record) => {
		if (Array.isArray(record)) {
			for (let i = 0; i < record.length; i++) {
				this.add(record[i]);
			}
		}
		else {
			if (record instanceof SEQ_RECORD) { this.cargo.push(record); }
			if (record instanceof SEQUENCES) { this.cargo = this.cargo.concat(record.cargo); }
		}
	}

	this.clear = () => { this.cargo = []; }

	this.clone = () => {
		const seq = new SEQUENCES();
		seq.cargo = this.clone_cargo();
		return seq;
	}

	this.clone_cargo = () => {
		const cargo = [];
		for (let i = 0; i < this.cargo.length; i++) {
			cargo.push(this.cargo[i].clone());
		}
		return cargo;
	}

	this.create_file_name = () => {
		let filename = this.get_consensus_organism_name() || 'sequences';
		filename = filename.replace(/[/\\?%*:|"<>]/g, ' '); // removes all illegal file characters
		filename = filename.replace(/[^\x20-\x7E]/g, ''); // removes all non-printable characters
		filename = filename.trim();
		filename = filename.replace(/ /g, '_');
		filename = filename.replace(/_+/g, '_');
		const seq_type = this.get_sequence_type();
		switch (seq_type) {
			case 'amino acids': { filename += '.faa'; break; }
			case 'nucleotides': { filename += '.fna'; break; }
			default: { filename += '.fasta'; break; }
		}
		return filename;
	}

	// For the filter functions, the filter term can be a string or an array
	//	of strings.  If no filter is supplied, then an array of all unique
	//	values is used as the filtering carierion.

	this.delete_by = (parameter, filter) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				this.delete_by(parameter, filter[i]);
			}
		}
		else {
			for (let i = this.cargo.length - 1; i >= 0; i--) {
				if (this.cargo[i].info[parameter] && this.cargo[i].info[parameter] === filter) {
					this.cargo.splice(i, 1);
				}
			}
		}
	}

	this.delete_by_accession = (filter) => { this.delete_by('accession', filter); }

	this.delete_by_database = (filter) => { this.delete_by('database', filter); }

	this.delete_by_exception = (filter) => { this.delete_by('exception', filter); }

	this.delete_by_location = (filter) => { this.delete_by('location', filter); }

	this.delete_by_gene_name = (filter) => { this.delete_by('gene', filter); }

	this.delete_by_organism_name = (filter) => { this.delete_by('organism', filter); }

	this.delete_by_protein_id = (filter) => { this.delete_by('protein_id', filter); }

	this.delete_by_protein_name = (filter) => { this.delete_by('protein', filter); }

	this.delete_by_pseudogene = (filter) => {
		this.delete_by('pseudo', filter);
		this.delete_by('pseudogene', filter);
	}

	this.delete_by_sequence_name = (filter) => { this.delete_by('seq_name', filter); }

	this.delete_by_sequence_type = (filter) => { this.delete_by('seq_type', filter); }

	this.delete_by_status = (filter) => { this.delete_by('status', filter); }

	this.filter_by = (parameter, filter) => {
		const new_sequences = new SEQUENCES();
		if (!parameter || typeof (parameter) !== 'string') { return new_sequences; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				new_sequences.add(this.filter_by(parameter, filter[i]));
			}
		}
		else {
			new_sequences.cargo = this.cargo.filter((x) => {
				if (x.info[parameter]) { return x.info[parameter] === filter; }
				else { return false; }
			});
		}
		return new_sequences.clone();
	}

	this.filter_by_accession = (filter) => { return this.filter_by('accession', filter); }

	this.filter_by_database = (filter) => { return this.filter_by('database', filter); }

	this.filter_by_exception = (filter) => { return this.filter_by('exception', filter); }

	this.filter_by_location = (filter) => { return this.filter_by('location', filter); }

	this.filter_by_gene_name = (filter) => { return this.filter_by('gene', filter); }

	this.filter_by_organism_name = (filter) => { return this.filter_by('organism', filter); }

	this.filter_by_protein_id = (filter) => { return this.filter_by('protein_id', filter); }

	this.filter_by_protein_name = (filter) => { return this.filter_by('protein', filter); }

	this.filter_by_pseudogene = (filter) => {
		const filtered = this.filter_by('pseudo', filter);
		filtered.add(this.filter_by('pseudogene', filter));
		return filtered;
	}

	this.filter_by_sequence_name = (filter) => { return this.filter_by('seq_name', filter); }

	this.filter_by_sequence_type = (filter) => { return this.filter_by('seq_type', filter); }

	this.filter_by_status = (filter) => { return this.filter_by('status', filter); }

	this.get_consensus = (parameter) => {
		if (!parameter || typeof (parameter) !== 'string') { return ''; }
		const v_list = this.get_unique(parameter);
		if (v_list.length === 1) { return v_list[0]; }
		const p_list = [];
		for (let i = 0; i < v_list.length; i++) {
			const quant = this.cargo.filter((v) => { return v.info[parameter] === v_list[i]; }).length;
			p_list.push({ parameter: v_list[i], quant: quant });
		}
		p_list.sort((a, b) => { return b.quant - a.quant; });
		if (p_list.length && p_list[0].parameter) { return p_list[0].parameter; }
		return '';
	}

	this.get_consensus_accession = () => { return this.get_consensus('accession'); }

	this.get_consensus_database = () => { return this.get_consensus('database'); }

	this.get_consensus_exception = () => { return this.get_consensus('exception'); }

	this.get_consensus_location = () => { return this.get_consensus('location'); }

	this.get_consensus_gene_name = () => { return this.get_consensus('gene'); }

	this.get_consensus_organism_name = () => { return this.get_consensus('organism'); }

	this.get_consensus_protein_id = () => { return this.get_consensus('protein_id'); }

	this.get_consensus_protein_name = () => { return this.get_consensus('protein'); }

	this.get_consensus_sequence_name = () => { return this.get_consensus('seq_name'); }

	this.get_consensus_sequence_type = () => { return this.get_consensus('seq_type'); }

	this.get_consensus_status = () => { return this.get_consensus('status'); }

	this.get_number_of_records = () => { return this.cargo.length; }

	this.get_sequence_type = () => {
		const types = [];
		for (let i = 0; i < this.cargo.length; i++) {
			if (this.cargo[i].info.seq_type) {
				types.push(this.cargo[i].info.seq_type);
			}
		}
		const seq_types = Array.from(new Set(types));
		if (seq_types.length === 1) { return seq_types[0]; }
		if (seq_types.length > 1) { return 'mixed'; }
		return 'unknown';
	}

	this.get_unique = (parameter) => {
		const arr = [];
		if (!parameter || typeof (parameter) !== 'string') { return arr; }
		for (let i = 0; i < this.cargo.length; i++) {
			if (this.cargo[i].info[parameter]) {
				arr.push(this.cargo[i].info[parameter]);
			}
		}
		return Array.from(new Set(arr));
	}

	this.get_unique_accessions = () => { return this.get_unique('accession'); }

	this.get_unique_databases = () => { return this.get_unique('database'); }

	this.get_unique_exceptions = () => { return this.get_unique('exception'); }

	this.get_unique_locations = () => { return this.get_unique('location'); }

	this.get_unique_gene_names = () => { return this.get_unique('gene'); }

	this.get_unique_organism_names = () => { return this.get_unique('organism'); }

	this.get_unique_protein_id = () => { return this.get_unique('protein_id'); }

	this.get_unique_protein_names = () => { return this.get_unique('protein'); }

	this.get_unique_pseudogenes = () => {
		let arr = this.get_unique('pseudogene');
		arr = arr.concat(this.get_unique('pseudo'));
		return arr;
	}

	this.get_unique_sequence_names = () => { return this.get_unique('seq_name'); }

	this.get_unique_sequence_types = () => { return this.get_unique('seq_type'); }

	this.get_unique_status = () => { return this.get_unique('status'); }

	this.includes = (parameter, filter) => {
		if (!parameter || typeof (parameter) !== 'string') { return false; }
		if (typeof (filter) === 'undefined') { filter = this.get_unique(parameter); }
		if (Array.isArray(filter)) {
			for (let i = 0; i < filter.length; i++) {
				if (this.includes(parameter, filter[i])) { return true; }
			}
			return false;
		}
		else {
			const found = this.cargo.findIndex((x) => {
				if (x.info[parameter]) { return x.info[parameter] === filter; }
				else { return false; }
			});
			if (found >= 0) { return true; }
			return false;
		}
	}

	this.includes_accession = (filter) => { return this.includes('accession', filter); }

	this.includes_database = (filter) => { return this.includes('database', filter); }

	this.includes_exception = (filter) => { return this.includes('exception', filter); }

	this.includes_location = (filter) => { return this.includes('location', filter); }

	this.includes_gene_name = (filter) => { return this.includes('gene', filter); }

	this.includes_organism_name = (filter) => { return this.includes('organism', filter); }

	this.includes_protein_id = (filter) => { return this.includes('protein_id', filter); }

	this.includes_protein_name = (filter) => { return this.includes('protein', filter); }

	this.includes_pseudogene = (filter) => {
		const a = this.includes('pseudo', filter);
		const b = this.includes('pseudogene', filter);
		if (a || b) { return true; }
		return false;
	}

	this.includes_sequence_name = (filter) => { return this.includes('seq_name', filter); }

	this.includes_sequence_type = (filter) => { return this.includes('seq_type', filter); }

	this.includes_status = (filter) => { return this.includes('status', filter); }

	this.is_loaded = () => {
		if (this.cargo.length) { return true; }
		return false;
	}

	this.load = (data) => { this.cargo = data; }

	this.load_fasta_file = async (path) => {
		const path_record = await pather.parse(path);
		const full_path = await path_record.get_full_path();
		const contents = await wrapper.read_file(full_path);
		if (contents) { this.cargo = parse_fasta(contents); }
		return;
	}

	this.load_string = (str) => { this.cargo = parse_fasta(str); }

	this.mask_low_complexity = (options) => {
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].mask_low_complexity(options);
		}
	}

	this.save_as_fasta = async (path, options) => {
		// If the filename has not been supplied, one will be created from the
		//	defline.  If the specified folders do not exist, they will be
		//	created.
		if (typeof (path) === 'undefined') { path = ''; }
		if (this.cargo.length) {
			const path_record = await pather.parse(path);
			if (!path_record.filename) { await path_record.set_file_name(this.create_file_name()); }
			await path_record.force_path();
			const full_path = await path_record.get_full_path();
			let contents = '';
			for (let i = 0; i < this.cargo.length; i++) {
				contents += this.cargo[i].to_fasta(options);
			}
			await wrapper.write_file(full_path, contents);
		}
		return;
	}

	this.save_each_as_fasta = async (path) => {
		if (typeof (path) === 'undefined') { path = ''; }
		if (this.cargo.length) {
			const path_record = await pather.parse(path);
			await path_record.remove_file_name();
			await path_record.force_path();
			const full_path = await path_record.get_full_path();
			for (let i = 0; i < this.cargo.length; i++) {
				await this.cargo[i].save_as_fasta(full_path);
			}
		}
		return;
	}

	this.set = (parameter, value) => {
		if (!parameter || typeof (parameter) !== 'string') { return; }
		for(let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].set(parameter, value);
		}
	}

	this.set_accession = (value) => { this.set('accession', value); }

	this.set_database = (value) => { this.set('database', value); }
	
	this.set_database_to_consensus = () => { this.set_to_consensus('database'); }

	this.set_location = (value) => { this.set('location', value); }

	this.set_gene_name = (value) => { this.set('gene', value); }

	this.set_organism_name = (value) => { this.set('organism', value); }
	
	this.set_organism_name_to_consensus = () => { this.set_to_consensus('organism'); }

	this.set_protein_id = (value) => { this.set('protein_id', value); }

	this.set_protein_name = (value) => { this.set('protein', value); }

	this.set_sequence_name = (value) => { this.set('seq_name', value); }

	this.set_sequence_type = (value) => { this.set('seq_type', value); }

	this.set_sequence_type_to_consensus = () => { this.set_to_consensus('seq_type'); }

	this.set_status = (value) => { this.set('status', value); }

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

	this.unmask = () => {
		for (let i = 0; i < this.cargo.length; i++) {
			this.cargo[i].unmask();
		}
	}

	////////////////////////////////////////////////////////////////////////

	function clean_sequence_name(seq_name) {
		if (typeof (seq_name) !== 'string') { seq_name = ''; }
		seq_name = seq_name.replace('hypothetical protein ', '');
		seq_name = seq_name.replace('LOW QUALITY PROTEIN: ', '');
		seq_name = seq_name.replace('partial ', '');
		seq_name = seq_name.replace('probable ', '');
		seq_name = seq_name.replace(/,\s*$/, ''); // remove last comma
		seq_name = seq_name.replace(/  +/g, ' '); // remove multiple internal spaces
		seq_name.trim();
		return seq_name;
	}

	function guess_sequence_type(sequence) {
		// Alphabet system based on extended one-letter sequence codes:
		// 	7 unique letters or less = probable nucleotide sequence
		//	More than 7 letters = probable amino acid sequence
		const alphabet = Array.from(new Set(sequence));
		if (alphabet.length <= 7) { return 'nucleotides'; }
		return 'amino acids';
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
					if (record.info.seq_type === 'amino acids' && record.info.seq_name && !record.info.protein) {
						record.info.protein = record.info.seq_name;
					}
					if (record.info.seq_type === 'nucleotides' && record.info.seq_name && !record.info.gene) {
						record.info.gene = record.info.seq_name;
					}
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
		info = parse_fasta_defline_sequence_name(defline, info);
		info = parse_fasta_defline_location(defline, info);
		info = parse_fasta_defline_isoform(defline, info);
		info = parse_fasta_defline_modifiers(defline, info);
		info = parse_fasta_defline_organism_name(defline, info);
		const extra = defline.split('^A');
		for (let i = 1; i < extra.length; i++) {
			info.concatenated.push(parse_fasta_defline(extra[i]));
		}
		return info;
	}

	function parse_fasta_defline_modifiers(defline, info) {
		if (typeof (info) === 'undefined') { info = new SEQ_INFO(); }
		const parts = defline.match(/\[(.*?)\=(.*?)\]/g);
		if (parts && parts.length) {
			for (let i = 0; i < parts.length; i++) {
				parts[i] = parts[i].replace(/\[/g, '');
				parts[i] = parts[i].replace(/\]/g, '');
				parts[i] = parts[i].trim();
			}
			for (let i = 0; i < parts.length; i++) {
				if (parts[i] && parts[i].includes('=')) {
					const kv = parts[i].split('=');
					info[kv[0]] = kv[1];
				}
			}
		}
		// In case [protein="some name, isoform"] was a field, try again to
		//	remove the isoform from the protein name
		const isoform = info.protein.match(/\sisoform\s[X][0-9]+\b/);
		if (isoform && isoform.length) {
			info.protein = info.protein.replace(isoform[0], '').trim();
		}
		info.protein = clean_sequence_name(info.protein);
		if (!info.seq_name && info.protein) { info.seq_name = info.protein; }
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
					default: {
						info.database = 'local';
						if (parts[1]) { info.accession = parts[1]; }
					}
				}
			}
			else { info.accession = words[0]; }
		}
		// Further parse the accession using the NCBI underscore system.
		//	The format is as follows:
		//	<genomic accession.version>_<feature_type>_<product accession.version>_<counter>
		//	The genomic accession and the product accession may also each
		//	contain and underscore.
		if (info.accession && info.accession.includes('_')) {
			const acc_parts = info.accession.split('_');
			if (acc_parts.length >= 5) {
				if (acc_parts[0].length && acc_parts[0].length <= 2) {
					acc_parts[0] += '_' + acc_parts[1];
					acc_parts.splice(1, 1);
				}
			}
			if (acc_parts.length >= 4) {
				if (acc_parts[2].length && acc_parts[2].length <= 2) {
					acc_parts[2] += '_' + acc_parts[3];
					acc_parts.splice(3, 1);
				}
			}
			if (acc_parts.length >= 3) {
				if (acc_parts[0]) { info.genomic_accession = acc_parts[0]; }
				if (acc_parts[1]) { info.feature_type = acc_parts[1]; }
				if (acc_parts[2]) { info.accession = acc_parts[2]; }
				if (acc_parts[3]) { info.counter = acc_parts[3]; }
			}
		}
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
		if (defline.toLowerCase().includes('axonemal')) { info.location = 'axoneme'; }
		if (defline.toLowerCase().includes('axoneme')) { info.location = 'axoneme'; }
		if (defline.toLowerCase().includes('cytoplasmic')) { info.location = 'cytoplasm'; }
		if (defline.toLowerCase().includes('cytoplasm')) { info.location = 'cytoplasm'; }
		if (defline.toLowerCase().includes('lysosomal')) { info.location = 'lysosome'; }
		if (defline.toLowerCase().includes('lysosome')) { info.location = 'lysosome'; }
		if (defline.toLowerCase().includes('mitochondrial')) { info.location = 'mitochondrion'; }
		if (defline.toLowerCase().includes('mitochondrion')) { info.location = 'mitochondrion'; }
		if (defline.toLowerCase().includes('peroxisome')) { info.location = 'peroxisome'; }
		return info;
	}

	function parse_fasta_defline_organism_name(defline, info) {
		if (typeof (info) === 'undefined') { info = new SEQ_INFO(); }
		// The name of the organism may already may have been parsed from any
		//	included defline fields (e.g., [organism=Mus musculus]).  If the
		//	organism name has not been already parsed, check for an NCBI-
		//	style organism name.  This name will be present as a final
		//	bracket-enclosed name, without an equals sign.
		//	(e.g., [Mus musculus]).
		if (!info.organism) {
			// check to see if the last character is a close bracket
			if (defline.charAt(defline.length -1) === ']') {
				const parts = defline.split('[');
				if (parts.length) {
					const last_part = parts[parts.length - 1];
					if (!last_part.includes('=')) {
						info.organism = last_part.replace(']', '').trim();
					}
				}
			}
		}
		return info;
	}

	function parse_fasta_defline_sequence_name(defline, info) {
		if (typeof (info) === 'undefined') { info = new SEQ_INFO(); }
		const words = defline.split(' ');
		if (words.length > 1) {
			// remove the identifier (accession, etc.)
			defline = defline.replace(words[0], '').trim();
			// remove the last bracket field without an equals sign inside
			const parts = defline.split('[');
			if (parts.length) { defline = defline.replace('[' + parts[parts.length - 1], '').trim(); }
			// remove the fields section of the defline
			const field_start = defline.search(/\[(.*?)\=(.*?)\]/);
			if (field_start > -1) { defline = defline.substring(0, field_start).trim(); }
			// remove terms that should be fields
			let sections = defline.split('isoform');
			let name = sections[0].trim();
			name = clean_sequence_name(name);
			if (name) { info.seq_name = name; }
		}
		return info;
	}

	function parse_fasta_defline_status(defline, info) {
		if (typeof (info) === 'undefined') { info = new SEQ_INFO(); }
		if (defline.includes('hypothetical protein')) { info.status = 'hypothetical protein'; }
		if (defline.includes('LOW QUALITY PROTEIN:')) { info.status = 'low quality'; }
		if (defline.includes('partial')) { info.status = 'partial'; }
		if (defline.includes('probable')) { info.status = 'probable'; }
		return info;
	}

}
