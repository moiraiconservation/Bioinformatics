///////////////////////////////////////////////////////////////////////////////
// data.js

const { IO } = require('./io.js');
const io = new IO();

function DATA() {

	this.cargo = [];

	this.clear = () => { this.cargo = []; }

	this.delete_columns_except = (...columns) => {
		this.cargo = this.get_columns(...columns);
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

	this.load_csv_file = async (path) => {
		const str = await io.read_file(path);
		this.cargo = parse(str, ',');
	}

	this.load_tsv_file = async (path) => {
		const str = await io.read_file(path);
		this.cargo = parse(str, '\t');
	}

	this.get_list = () => {
		const new_list = [];
		for (let i = 0; i < this.cargo.length; i++) {
			for (let j = 0; j < this.cargo[i].length; j++) {
				new_list.push(this.cargo[i][j]);;
			}
		}
		return new_list;
	}

	this.unload = () => {
		const new_cargo = this.cargo;
		this.clear();
		return new_cargo;
	}

}

function parse(str, delimiter) {
	delimiter = delimiter || ',';
	const arr = [];
	let lines = str.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		let data = lines[i].split(delimiter);
		arr.push(data);
	}
	return arr;
}

module.exports = { DATA: DATA }