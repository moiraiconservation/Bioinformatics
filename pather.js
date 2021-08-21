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

	this.add_folder = async (folder) => {
		if (typeof (folder) !== 'string') { folder = ''; }
		const parts = await this.agnostic_split(folder);
		const folders = await this.get_folders_from_parts(parts);
		this.folders = this.folders.concat(folders);
	}

	this.agnostic_split = async (path) => {
		if (typeof (path) !== 'string') { path = ''; }
		path = path.trim();
		let parts = [];
		// break the path apart into pieces based on the proper delimiter (\ or /).
		if (path.includes('\\') && !path.includes('/')) { parts = path.split('\\'); }
		else if (!path.includes('\\') && path.includes('/')) { parts = path.split('/'); }
		else {
			if (!this.delimiter) { await this.get_delimiter(); }
			parts = path.split(this.delimiter);
		}
		if (parts && parts.length) {
			// remove any empty entries
			for (let i = (parts.length - 1); i >= 0; i--) {
				if (!parts[i] || parts[i] === '.') { parts.splice(i, 1); }
			}
		}
		return parts;
	}

	this.clone = async () => {
		const path_record = new PATHER_RECORD();
		path_record.app_drive = this.app_drive;
		path_record.basename = this.basename;
		path_record.delimiter = this.delimiter;
		path_record.drive = this.drive;
		path_record.extension = this.extension;
		path_record.filename = this.filename;
		path_record.folders = this.folders;
		path_record.folders_to_app = this.folders_to_app;
		path_record.verified_folders = this.verified_folders;
		return path_record;
	}

	this.get_delimiter = async () => {
		const platform = await wrapper.get_operating_system();
		if (platform === 'win32') { this.delimiter = '\\'; return '\\'; }
		else { this.delimiter = '/'; return '/'; }
	}

	this.get_folders_from_parts = async (parts) => {
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
					parts[i] = this.make_text_file_safe(parts[i]);
					folders.push(parts[i]);
				}
			}
		}
		return folders;
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

	this.get_full_path = async () => {
		let path = this.drive + this.delimiter;
		for (let i = 0; i < this.folders.length; i++) {
			path += this.folders[i] + this.delimiter;
		}
		path += this.filename;
		return path;
	}

	this.make_text_file_safe = (str) => {
		str = str.replace(/[/\\?%*:|"<>]/g, ' '); // removes all illegal file characters
		str = str.replace(/[^\x20-\x7E]/g, ''); // removes all non-printable characters
		return str;
	}

	this.remove_file_name = async () => {
		this.basename = '';
		this.extension = '';
		this.filename = '';
	}

	this.set_extension = async (extension) => {
		if (typeof (extension) !== 'string') { extension = ''; }
		this.extension = this.make_text_file_safe(extension.trim());
		this.filename = this.basename + '.' + this.extension;
	}

	this.set_file_name = async (filename) => {
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
				this.extension = this.make_text_file_safe(parts[last]);
				this.basename = this.make_text_file_safe(filename.replace('.' + parts[last], ''));
			}
			else {
				// no extension was provided
				this.extension = '';
				this.basename = this.make_text_file_safe(filename);
			}
		}
	}

}

///////////////////////////////////////////////////////////////////////////////

function PATHER() {

	this.parse = async (path) => {
		const record = new PATHER_RECORD();
		if (typeof (path) !== 'string') { path = ''; }
		path = path.trim();
		// parse the supplied path
		await record.get_delimiter();
		const parts = await record.agnostic_split(path);
		record.folders = await record.get_folders_from_parts(parts);
		const last = parts.length - 1;
		if (parts[0] && parts[0].includes(':')) { record.drive = parts[0]; }
		if (parts[last] && parts[last].includes('.')) { await record.set_file_name(parts[last]); }
		// parse the path to the application
		const app_path = await wrapper.get_app_directory();
		const app_parts = await record.agnostic_split(app_path);
		record.folders_to_app = await record.get_folders_from_parts(app_parts);
		if (app_parts[0] && app_parts[0].includes(':')) { record.app_drive = app_parts[0]; }
		// if the supplied path isn't complete, finish it using the
		//	application path
		if (!record.drive && record.app_drive) {
			record.drive = record.app_drive;
			record.folders = record.folders_to_app.concat(record.folders);
		}
		return record;
	}

}