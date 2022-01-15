///////////////////////////////////////////////////////////////////////////////
// data.js

const { IO } = require('./io.js');
const { XML } = require('./xml.js');
const xlsx = require('xlsx');
const io = new IO();
const xml = new XML();

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
		return true;
	}

	this.load_tsv_file = async (path) => {
		const str = await io.read_file(path);
		this.cargo = parse(str, '\t');
		return true;
	}

	this.load_xlsx_file = async (path) => {
		const file = xlsx.readFile(path);
		this.cargo = [];
		const sheets = file.SheetNames
		for (let i = 0; i < sheets.length; i++) {
			const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
			temp.forEach((res) => { this.cargo.push(res) });
		}
		return true;
	}

	this.load_xml_file = async (path) => {
		const str = await io.read_file(path);
		this.cargo = xml.xml2json(str);
		return true;
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