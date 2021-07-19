///////////////////////////////////////////////////////////////////////////////
// ab1.js /////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function ABIF() {

  function DIR() {
		this.data = 0;
		this.data_size = 0;
		this.data_offset = 0;
		this.element_type = 0;
    this.name = '';
		this.num_elements = 0;
    this.tag_number = 0;
  }

  function RECORD() {
		this.bytes = 0;
    this.file_type = '';
    this.data_offset = 0;
    this.data_size = 0;
    this.directory = [];
    this.num_elements = 0;
    this.version = 0;
  }

  ////////////////////////////////////////////////////////////////////////
  // METHODS /////////////////////////////////////////////////////////////

	this.electropherogram = (record) => {
		const height = 400;  // height in pixels of the electropherogram
		const y_offset = 50;  // the amount upward along the y-axis to offset the traces
		const x_scale = 2; // the number of pixels that each measurement takes up along the x - axis
		const area = document.createElement('div');
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		area.appendChild(canvas);
		area.style.width = '100%';
		area.style.height = 'auto';
		area.style.overflowX = 'scroll';
		const color = {
			g: '#ffb429',  // orange
			a: '#8fff8f',  // green
			t: '#ffadad',  // red
			c: '#bdbeff'  // blue
		}
		const traces = this.get_trace_map(record);
		const peaks = this.get_peaks(record);
		const sequence = this.get_sequence(record);
		let width = traces.size * x_scale;
		canvas.height = height;
		canvas.width = width;
		let max_y = -Infinity;
		for (let i = 0; i < traces.g.length; i++) { if (traces.g[i] > max_y) { max_y = traces.g[i]; } }
		for (let i = 0; i < traces.a.length; i++) { if (traces.a[i] > max_y) { max_y = traces.a[i]; } }
		for (let i = 0; i < traces.t.length; i++) { if (traces.t[i] > max_y) { max_y = traces.t[i]; } }
		for (let i = 0; i < traces.c.length; i++) { if (traces.c[i] > max_y) { max_y = traces.c[i]; } }
		let y_scale = (height - (y_offset + 5)) / max_y;
		context.save();
		context.translate(0, height);
		context.scale(1, -1);
		context.fillStyle = 'transparent';
		context.fillRect(0, 0, width, height);
		// draw the horizontal line below the traces
		context.strokeStyle = 'silver';
		context.beginPath();
		context.moveTo(0, y_offset - 5);
		context.lineTo(width, y_offset - 5);
		context.lineWidth = 1;
		context.stroke();
		context.closePath();
		// draw the traces
		const key = Object.keys(traces);
		for (let i = 0; i < key.length; i++) {
			if (traces[key[i]].length) {
				let left = 0;
				let prev_stat = Math.round(traces[key[i]][0] * y_scale) + y_offset;
				context.strokeStyle = color[key[i]];
				for (let j = 1; j < traces[key[i]].length; j++) {
					let the_stat = Math.round(traces[key[i]][j] * y_scale) + y_offset;
					context.beginPath();
					context.moveTo(left, prev_stat);
					context.lineTo(left + x_scale, the_stat);
					context.lineWidth = 2;
					context.lineCap = 'round';
					context.shadowBlur = 1;
					context.shadowColor = color[key[i]];
					context.stroke();
					context.closePath();
					prev_stat = the_stat;
					left += x_scale;
				}
			}
		}
		// draw the sequence
		context.restore();
    context.font = '18px Lucida Console';
    context.textAlign = 'center';
    for (let i = 0; i < peaks.length; i++) {
			switch (sequence.charAt(i)) {
				case 'G': { 
					context.fillStyle = color.g;
					break;
				}
				case 'A': {
					context.fillStyle = color.a;
					break;
				}
				case 'T': {
					context.fillStyle = color.t;
					break;
				}
				case 'C': {
					context.fillStyle = color.c;
					break;
				}
				default: {
					context.fillStyle = 'white';
					break;
				}
			}
    	context.fillText(sequence.charAt(i), (peaks[i] * x_scale), ((height - Math.round((y_offset / 2), 0)) + 9));
    }
		return area;
	}

	this.get_data = (record, name, tag_number) => {
		if (typeof (record) === 'undefined') { return new DIR(); }
		if (typeof (name) === 'undefined') { return new DIR(); }
		if (typeof (tag_number) === 'undefined') { return new DIR(); }
		const dir = record.directory.find((x) => { return (x.name === name && x.tag_number === tag_number); });
		return dir.data;
	}

	this.get_directory_entry = (record, name, tag_number) => {
		if (typeof (record) === 'undefined') { return new DIR(); }
		if (typeof (name) === 'undefined') { return new DIR(); }
		if (typeof (tag_number) === 'undefined') { return new DIR(); }
		const dir = record.directory.find((x) => { return (x.name === name && x.tag_number === tag_number); });
		return dir;
	}

	this.get_peaks = (record) => {
		let peaks = this.get_directory_entry(record, 'PLOC', 1);
		if (!peaks) { peaks = this.get_directory_entry(record, 'PLOC', 2); }
		return peaks.data;
	}

	this.get_quality = (record) => {
		let quality = this.get_directory_entry(record, 'PCON', 1);
		if (!quality.data.length) { quality = this.get_directory_entry(record, 'PCON', 2); }
		return quality.data;
	}

	this.get_secondary_sequence = (record) => {
		const sequence = this.get_directory_entry(record, 'P2BA', 1);
		return sequence.data;
	}

	this.get_sequence = (record) => {
		let sequence = this.get_directory_entry(record, 'PBAS', 1);
		if (!sequence) { sequence = this.get_directory_entry(record, 'PBAS', 2); }
		return sequence.data;
	}

	this.get_trace_map = (record) => {
		const peaks = this.get_peaks(record);
		const quality = this.get_quality(record);
		const sequence = this.get_sequence(record);
		const trace_9 = this.get_data(record, 'DATA', 9);
		const trace_10 = this.get_data(record, 'DATA', 10);
		const trace_11 = this.get_data(record, 'DATA', 11);
		const trace_12 = this.get_data(record, 'DATA', 12);
		const map = { a: [], c: [], g: [], t: [], size: 0 }
		for (let i = 0; i < sequence.length; i++) {
			if (quality[i] > 15) {
				let max_trace = trace_9;
				let max_value = -Infinity;
				if (trace_9[peaks[i]] > max_value) { max_value = trace_9[peaks[i]]; max_trace = trace_9; }
				if (trace_10[peaks[i]] > max_value) { max_value = trace_10[peaks[i]]; max_trace = trace_10; }
				if (trace_11[peaks[i]] > max_value) { max_value = trace_11[peaks[i]]; max_trace = trace_11; }
				if (trace_12[peaks[i]] > max_value) { max_value = trace_12[peaks[i]]; max_trace = trace_12; }
				switch (sequence.charAt(i)) {
					case 'A': { map.a = max_trace; break; }
					case 'C': { map.c = max_trace; break; }
					case 'G': { map.g = max_trace; break; }
					case 'T': { map.t = max_trace; break; }
					default: { map.a = max_trace; break; }
				}
			}
		}
		map.size = Math.max(map.a.length, map.c.length, map.g.length, map.t.length);
		return map;
	}

  this.parse = (binary) => {
    const record = new RECORD();
		record.bytes = binary.length;
    record.file_type = String.fromCharCode(binary[0]) + String.fromCharCode(binary[1]) + String.fromCharCode(binary[2]) + String.fromCharCode(binary[3]);
    if (record.file_type !== 'ABIF') { return record; }
    record.version = binary_to_number(binary, 4, 2) / 100;
    record.num_elements = binary_to_number(binary, 18, 4);
    record.data_size = binary_to_number(binary, 22, 4);
    record.data_offset = binary_to_number(binary, 26, 4);
    const limit = record.data_offset + (record.num_elements * 28);
    for (let i = record.data_offset; i < limit; i = i + 28) {
      const dir = new DIR();
      dir.name = binary_to_string(binary, i, 4);
      dir.tag_number = binary_to_number(binary, (i + 4), 4);
			dir.element_type = binary_to_number(binary, (i + 8), 2);
			dir.num_elements = binary_to_number(binary, (i + 12), 4);
			dir.data_size = binary_to_number(binary, (i + 16), 4);
			if (dir.data_size > 4) {
				dir.data_offset = binary_to_number(binary, (i + 20), 4);
				dir.data = binary.slice(dir.data_offset, (dir.data_offset + dir.data_size));
			}
			else { dir.data = binary.slice((i + 24), (i + 28)); }
			dir.data = parse_data(dir);
      record.directory.push(dir);
    }
    return record;
  }

	this.peak_area = (record, peak_index, nucleotide) => {
    // calculates the area under a peak in the electropherogram.  If both minima of the peak
    // are at baseline (zero) then the area will be exact.  Otherwise, the area will be estimated.
    let centralArea = 0;  // the area between the left and right minima (the sum of the y-values at each x-value, inclusive)
    let leftTailArea = 0;  // the area of the left tail (calculated if the y-value at minimumLeft is not zero)
    let rightTailArea = 0;  // the area of the right tail (calculated if the y-value at minimumRight is not zero)
    let trace = null;
		const trace_map = this.get_trace_map(record);
		switch (nucleotide) {
			case 'A': { trace = trace_map.a; break; }
			case 'C': { trace = trace_map.c; break; }
			case 'G': { trace = trace_map.g; break; }
			case 'T': { trace = trace_map.t; break; }
			default: { trace = trace_map.a; break; }
		}
    let length = trace.length;
    // find the peak x location
    let x = this.get_peaks(record)[peak_index];
    // find the true peak
    let y = trace[x];
    let xLeft = x;
    let xRight = x;
		let yLeft = 0;
		let yRight = 0;
    while ((trace[xLeft - 1] > trace[xLeft]) && (xLeft > 0)) { xLeft--; yLeft = trace[xLeft]; }
    while ((trace[xRight + 1] > trace[xRight]) && (xRight < length)) { xRight++; yRight = trace[xRight]; }
    if (yLeft > y) { x = xLeft; }
    else if (yRight > y) { x = xRight; }
    // find the left and right minima
    let minimumLeft = x;
    let minimumRight = x;
    xLeft = x;
    xRight = x;
    y = trace[x];
    while((trace[xLeft - 1] <= trace[xLeft])  && (xLeft > 0)) { xLeft--; minimumLeft  = xLeft; }
    while((trace[xRight + 1] <= trace[xRight]) && (xRight < length)) { xRight++; minimumRight = xRight; }
    // find the central area
    for (let i = minimumLeft; i <= minimumRight; i++) { centralArea += trace[i]; }
    // calculate the left tail area
    if (trace[minimumLeft] > 0) {
			// calculate the slope
			let slope = (trace[x] - trace[minimumLeft]) / (x - minimumLeft);
			y = trace[minimumLeft] - slope;
			if (slope > 0) { while (y > 0) { leftTailArea += y; y -= slope; } }
    }
    // calculate the right tail area
    if (trace[minimumRight] > 0) {
			// calculate the slope
			let slope = (trace[x] - trace[minimumRight]) / (minimumRight - x);
			y = trace[minimumRight] - slope;
			if (slope > 0) { while (y > 0) { rightTailArea += y; y -= slope; } }
    }
    // calculate the overall area
    const area = leftTailArea + centralArea + rightTailArea;
    return area;
	}

	this.replace_data = (record, name, tag_number, replacement) => {
		if (typeof (record) === 'undefined') { return record; }
		if (typeof (name) === 'undefined') { return record; }
		if (typeof (tag_number) === 'undefined') { return record; }
		if (typeof (replacement) === 'undefined') { return record; }
		const index = record.directory.findIndex((x) => { return (x.name === name && x.tag_number === tag_number); });
		if (index && index >= 0) {
			record.directory[index].data = JSON.parse(JSON.stringify(replacement.data));
			record.directory[index].data_size = replacement.data_size;
			record.directory[index].num_elements = replacement.num_elements;
		}
		return record;
	}

	this.quality_trim = (record) => {
    let max = 0;
    const upper_threshold = 24;
    const lower_threshold = 15;
		let peaks = this.get_directory_entry(record, 'PLOC', 1); if (!peaks.data.length) { peaks = this.get_directory_entry(record, 'PLOC', 2); }
		let quality = this.get_directory_entry(record, 'PCON', 1);  if (!quality.data.length) { quality = this.get_directory_entry(record, 'PCON', 2); }
		let sequence = this.get_directory_entry(record, 'PBAS', 1);  if (!sequence.data.length) { sequence = this.get_directory_entry(record, 'PBAS', 2); }
		let sequence_2 = this.get_directory_entry(record, 'P2BA', 1);
		const start = quality.data.findIndex((x) => { return x > lower_threshold; });
		const length = quality.data.length;
    let end = length;
		for (let i = 6; i <= (length - 5); i++) {
			let average = quality.data[i - 5] + quality.data[i - 4] + quality.data[i - 3] + quality.data[i - 2] + quality.data[i - 1];
			average += quality.data[i + 5] + quality.data[i + 4] + quality.data[i + 3] + quality.data[i + 2] + quality.data[i + 1];
			average  = average / 10;
			if (average > max) { max = average; }
			if ((max > upper_threshold) && (average < lower_threshold) && (i < end)) { end = i; }
    }
		peaks = slice_data(peaks, start, end);
		quality = slice_data(quality, start, end);
		sequence = slice_data(sequence, start, end);
		sequence_2 = slice_data(sequence_2, start, end);
		record = this.replace_data(record, 'PLOC', 1, peaks);
		record = this.replace_data(record, 'PLOC', 2, peaks);
		record = this.replace_data(record, 'PCON', 1, quality);
		record = this.replace_data(record, 'PCON', 2, quality);
		record = this.replace_data(record, 'PBAS', 1, sequence);
		record = this.replace_data(record, 'PBAS', 2, sequence);
		record = this.replace_data(record, 'P2BA', 1, sequence_2);
    return record;
}


  ////////////////////////////////////////////////////////////////////////
  // PRIVATE METHODS /////////////////////////////////////////////////////

	function binary_to_float(binary, offset, bytes) {
		let str = '';
		const limit = offset + bytes;
		for (let x = offset; x < limit; x++) {
			str += binary[x].toString(2).padStart(8, '0');
		}
		let num = parseInt(str, 16).toString(2);
		if (num.length < 32) {
			num = ('00000000000000000000000000000000' + num).substr(num.length);
		}
		let sign = (num.charAt(0) == '1') ? -1 : 1;
		let exponent = parseInt(num.substr(1, 8), 2) - 127;
		let significandBase = num.substr(9);
		let significandBin = '1' + significandBase;
		let i = 0;
		let val = 1;
		let significand = 0;
		if (exponent == -127) {
			if (significandBase.indexOf('1') == -1) { return 0; }
			else {
				exponent = -126;
				significandBin = '0' + significandBase;
			}
		}
		while (i < significandBin.length) {
			significand += val * parseInt(significandBin.charAt(i));
			val = val / 2;
			i++;
		}
		return sign * significand * Math.pow(2, exponent);
	}

  function binary_to_number(binary, offset, bytes) {
    let str = '';
    const limit = offset + bytes;
    for (let i = offset; i < limit; i++) {
      str += binary[i].toString(2).padStart(8, '0');
    }
    const num = ~~parseInt(str, 2);
    return num;
  }

  function binary_to_string(binary, offset, bytes) {
    let str = '';
    const limit = offset + bytes;
    for (let i = offset; i < limit; i++) {
			if (binary[i]) {
				str += String.fromCharCode(binary[i]);
			}
    }
    return str;
  }

	function binary_to_unsigned_number(binary, offset, bytes) {
		let str = '';
		const limit = offset + bytes;
		for (let i = offset; i < limit; i++) {
			str += binary[i].toString(2).padStart(8, '0');
		}
		const num = parseInt(str, 2);
		return num;
	}

	function parse_data(dir) {
		var data;
		const char_WL = ['APrX', 'AsyC', 'FWO_', 'PBAS', 'P2BA', 'RMdX'];
		const bytes = Math.floor(dir.data_size / dir.num_elements);
		for (let i = 0; i < dir.data_size; i = i + bytes) {
			switch (dir.element_type) {

				case 1: {
					if (typeof (data) === 'undefined') { data = []; }
					data.push(binary_to_unsigned_number(dir.data, i, bytes));
					break;
				}

				case 2: {
					if (char_WL.includes(dir.name)) {
						if (typeof (data) === 'undefined') { data = ''; }
						data += binary_to_string(dir.data, i, bytes);
					}
					else {
						if (typeof (data) === 'undefined') { data = []; }
						data.push(binary_to_number(dir.data, i, bytes));
					}
					break;
				}

				case 3: {
					if (typeof (data) === 'undefined') { data = []; }
					data.push(binary_to_unsigned_number(dir.data, i, bytes));
					break;
				}

				case 4: {
					if (typeof (data) === 'undefined') { data = []; }
					data.push(binary_to_number(dir.data, i, bytes));
					break;
				}

				case 5: {
					if (typeof (data) === 'undefined') { data = []; }
					data.push(binary_to_number(dir.data, i, bytes));
					break;
				}

				case 7: {
					if (typeof (data) === 'undefined') { data = []; }
					data.push(binary_to_float(dir.data, i, bytes));
					break;
				}

				case 8: {
					if (typeof (data) === 'undefined') { data = []; }
					data.push(binary_to_number(dir.data, i, bytes));
					break;
				}

				case 10: {
					if (typeof (data) === 'undefined') { data = []; }
					data.push(binary_to_unsigned_number(dir.data, i, 2));
					data.push(binary_to_unsigned_number(dir.data, (i + 2), 1));
					data.push(binary_to_unsigned_number(dir.data, (i + 3), 1));
					break;
				}

				case 11: {
					if (typeof (data) === 'undefined') { data = []; }
					data.push(binary_to_unsigned_number(dir.data, i, 1));
					data.push(binary_to_unsigned_number(dir.data, (i + 1), 1));
					data.push(binary_to_unsigned_number(dir.data, (i + 2), 1));
					data.push(binary_to_unsigned_number(dir.data, (i + 3), 1));
					break;
				}

				case 12: {
					if (typeof (data) === 'undefined') { data = []; }
					data.push(binary_to_number(dir.data, i, 4));
					data.push(binary_to_number(dir.data, (i + 4), 4));
					data.push(binary_to_unsigned_number(dir.data, (i + 8), 1));
					data.push(binary_to_unsigned_number(dir.data, (i + 9), 1));
					break;
				}

				case 13: {
					if (typeof (data) === 'undefined') { data = []; }
					data.push(binary_to_number(dir.data, i, bytes));
					break;
				}

				case 18: {
					if (i) {
						if (typeof (data) === 'undefined') { data = ''; }
						data += binary_to_string(dir.data, i, bytes);
					}
					break;
				}

				case 19: {
					if (i < dir.data_size - 1) {
						if (typeof (data) === 'undefined') { data = ''; }
						data += binary_to_string(dir.data, i, bytes);
					}
					break;
				}

				default: {
					if (dir.element_type >= 1024) {
						if (typeof (data) === 'undefined') { data = []; }
						data.push(binary_to_number(dir.data, i, bytes));
					}
				}

			}
		}
		if (data && data.length === 1) { data = data[0]; }
		return data;
	}

	function slice_data(dir, start, end) {
		if (typeof (dir) === 'undefined') { return dir; }
		if (typeof (start) === 'undefined') { return dir; }
		if (typeof (end) === 'undefined') { return dir; }
		if (dir.data) {
			dir.data =  dir.data.slice(start, end);
			const bytes = Math.round(dir.data_size / dir.num_elements);
			dir.num_elements = dir.data.length;
			dir.data_size = dir.num_elements * bytes;
		}
		return dir;
	}

}