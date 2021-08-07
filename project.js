///////////////////////////////////////////////////////////////////////////////
// project.js
//	Requires globals: pather

function PROJECT() {
	this.name = '';
	this.directory = '';
	this.folders = {
		iso_compact_files: '',
		iso_fasta_files: '',
		iso_rbh_files: ''
	}
	this.pather = new PATHER();

	this.set_directory = async (path) => {
		const path_record = await pather.parse(path);
		this.name = path_record.basename;
		this.directory = await path_record.get_full_path();
	}

}