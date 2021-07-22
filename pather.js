///////////////////////////////////////////////////////////////////////////////
// pather.js
//	Requires: wrapper.js

function PATHER_RECORD() {
	this.app_drive = '';
	this.basename = '';
	this.delimiter = '';
	this.drive = '';
	this.extension = '';
	this.filename = '';
	this.folders = [];
	this.folders_to_app = [];
	this.verified_folders = [];

	this.set_extension = (extension) => {
		if (typeof (extension) !== 'string') { extension = ''; }
		this.extension = extension.trim();
		this.filename = this.basename + '.' + this.extension;
	}

	this.set_filename = (filename) => {
		if (typeof (filename) !== 'string') { filename = ''; }
		this.filename = filename.trim();
		const parts = this.filename.split('.');
		if (parts && parts.length) {
			for (let i = (parts.length - 1); i >= 0; i--) {
				if (!parts[i]) { parts[i].splice(i, 1); }
			}
			const last = parts.length - 1;
			if (last) {
				// an extension was provided
				this.extension = parts[last]
				this.basename = filename.replace('.' + parts[last], '');
			}
			else {
				// no extension was provided
				this.extension = '';
				this.basename = filename;
			}
		}
	}

	this.force_path = async () => {
		if (this.folders.length > this.verified_folders.length) {
			let new_dir = this.drive;
			for (let i = this.verified_folders.length; i < this.folders.length; i++) {
				new_dir += this.delimiter + this.folders[i];
				await wrapper.create_directory(new_dir);
				this.verified_folders.push(this.folders[i]);
			}
		}
	}

	this.get_full_path = () => {
		let path = this.drive + this.delimiter;
		for (let i = 0; i < this.folders.length; i++) {
			path += this.folders[i] + this.delimiter;
		}
		path += this.filename;
		return path;
	}

	this.remove_filename = () => {
		this.basename = '';
		this.extension = '';
		this.filename = '';
	}

}

///////////////////////////////////////////////////////////////////////////////

function PATHER() {

	this.get_delimiter = async () => {
		const platform = await wrapper.get_operating_system();
		if (platform === 'win32') { return '\\'; }
		else { return '/'; }
	}

	this.parse = async (path) => {
		const record = new PATHER_RECORD();
		if (typeof (path) !== 'string') { path = ''; }
		path = path.trim();
		// parse the supplied path
		record.delimiter = await this.get_delimiter();
		const parts = agnostic_split(path, record.delimiter);
		record.folders = get_folders_from_parts(parts);
		const last = parts.length - 1;
		if (parts[0] && parts[0].includes(':')) { record.drive = parts[0]; }
		if (parts[last] && parts[last].includes('.')) { record.set_filename(parts[last]); }
		// parse the path to the application
		const app_path = await wrapper.get_app_directory();
		const app_parts = agnostic_split(app_path, record.delimiter);
		record.folders_to_app = get_folders_from_parts(app_parts);
		if (app_parts[0] && app_parts[0].includes(':')) { record.app_drive = app_parts[0]; }
		// if the supplied path isn't complete, finish it using the
		//	application path
		if (!record.drive && record.app_drive) {
			record.drive = record.app_drive;
			record.folders = record.folders_to_app.concat(record.folders);
		}
		return record;
	}

	function agnostic_split(path, delimiter) {
		if (typeof (path) !== 'string') { path = ''; }
		path = path.trim();
		let parts = [];
		// break the path apart into pieces based on the proper delimiter (\ or /).
		if (path.includes('\\') && !path.includes('/')) { parts = path.split('\\'); }
		else if (!path.includes('\\') && path.includes('/')) { parts = path.split('/'); }
		else { parts = path.split(delimiter); }
		if (parts && parts.length) {
			// remove any empty entries
			for (let i = (parts.length - 1); i >= 0; i--) {
				if (!parts[i] || parts[i] === '.') { parts.splice(i, 1); }
			}
		}
		return parts;
	}

	function get_folders_from_parts(parts) {
		const folders = [];
		if (parts && parts.length) {
			const last = parts.length - 1;
			let folder_start = 0;
			let folder_stop = last;
			if (parts[0] && parts[0].includes(':')) {
				folder_start = 1;
			}
			if (parts[last] && parts[last].includes('.')) {
				folder_stop = last - 1;
			}
			for (let i = folder_start; i <= folder_stop; i++) {
				if (parts[i]) {
					parts[i] = parts[i].replace(/[/\\?%*:|"<>]/g, ' '); // removes all illegal file characters
					parts[i] = parts[i].replace(/[^\x20-\x7E]/g, ''); // removes all non-printable characters			
					folders.push(parts[i]);
				}
			}
		}
		return folders;
	}

}