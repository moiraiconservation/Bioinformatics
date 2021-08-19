///////////////////////////////////////////////////////////////////////////////
// project.js
//	Requires globals: pather.js

function PROJECT() {
	this.name = '';
	this.directory = '';
	this.folders = {
		iso_compact: '',
		iso_fasta: '',
		iso_rbh_files: '',
		ortho_fasta: ''
	}
	this.path_records = {
		iso_compact: null,
		iso_fasta: null,
		iso_rbh: null,
		ortho_fasta: null,
		project: null
	}

	this.set_directory = async (path) => {
		const path_record = await pather.parse(path);
		this.name = path_record.basename;
		this.directory = await path_record.get_full_path();
		this.path_records.iso_compact = await path_record.clone();
		this.path_records.iso_fasta = await path_record.clone();
		this.path_records.iso_rbh = await path_record.clone();
		this.path_records.ortho_fasta = await path_record.clone();
		this.path_records.project = await path_record.clone();
		await this.path_records.iso_compact.add_folder('iso_compact');
		await this.path_records.iso_fasta.add_folder('iso_fasta');
		await this.path_records.iso_rbh.add_folder('iso_rbh');
		await this.path_records.ortho_fasta.add_folder('ortho_fasta');
		this.folders.iso_compact = await this.path_records.iso_compact.get_full_path();
		this.folders.iso_fasta = await this.path_records.iso_fasta.get_full_path();
		this.folders.iso_rbh = await this.path_records.iso_rbh.get_full_path();
		this.folders.ortho_fasta = await this.path_records.ortho_fasta.get_full_path();
	}

}