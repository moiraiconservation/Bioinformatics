///////////////////////////////////////////////////////////////////////////////
// tsv.js /////////////////////////////////////////////////////////////////////
//	Methods for manimpulating tab separated value (tsv) files (also known as
//	tab delimited files).
//	Requires: wrapper.js
//	Uses main.js for reading files

function TSV() {

	this.package = [];

	this.clear = () => { this.package = []; }

	this.delete_columns_except = (...columns) => {
		this.package = this.get_columns(...columns);
	}

	this.get_columns = (...columns) => {
		const new_table = [];
		if (!columns.length) { return new_table; }
		for (let i = 0; i < this.package.length; i++) {
			let new_row = [];
			for (let j = 0; j < columns.length; j++) { new_row.push(this.package[i][columns[j]]); }
			new_table.push(new_row);
		}
		return new_table;
	}

	this.load_tsv_file = async (path) => {
		const str = await wrapper.read_file(path);
		this.package = parse_tsv(str);
	}

	function parse_tsv(str) {
		const arr = [];
		let lines = str.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			let data = lines[i].split('\t');
			arr.push(data);
		}
		return arr;
	}

	this.get_list = () => {
		const new_list = [];
		for (let i = 0; i < this.package.length; i++) {
			for (let j = 0; j < this.package[i].length; j++) {
				new_list.push(this.package[i][j]);;
			}
		}
		return new_list;
	}

	this.unload = () => {
		const new_package = this.package;
		this.clear();
		return new_package;
	}

}