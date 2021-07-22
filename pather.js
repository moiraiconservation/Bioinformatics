///////////////////////////////////////////////////////////////////////////////
// pather.js
//	Requires: wrapper.js

function PATHER() {

	function PATHER_RECORD() {
		this.basename = '';
		this.delimiter = '';
		this.drive = '';
		this.extension = '';
		this.folders = [];
		this.filename = '';

		this.add_filename = (filename) => {
			if (filename && typeof (filename) === 'string') {
				this.filename = filename;
				const parts = filename.split('.');
				if (parts && parts.length > 1) {
					this.extension = parts[parts.length - 1]
					this.basename = filename.replace('.' + parts[parts.length - 1], '').trim();
				}
			}
		}

		this.create_directory = async () => {
			const new_pather = new PATHER();
			const app_path = await wrapper.get_app_directory();
			const app_record = await new_pather.parse(app_path);
			if (this.folders > app_record.folders) {
				let new_dir = '';
				for (let i = app_record.folders.length; i < this.folders.length; i++) {
					if (i > app_record.folders.length) { new_dir += this.delimiter; }
					new_dir += this.folders[i];
					await wrapper.create_directory(new_dir);
				}
			}
		}

		this.full_path = () => {
			let path = this.drive + this.delimiter;
			for (let i = 0; i < this.folders.length; i++) {
				path += this.folders[i] + this.delimiter;
			}
			path += this.filename;
			return path;
		}

	}

	this.get_delimiter = async () => {
		const platform = await wrapper.get_operating_system();
		if (platform === 'win32') { return '\\'; }
		else { return '/'; }
	}

	this.parse = async (path) => {
		const record = new PATHER_RECORD();
		if (typeof (path) !== 'string') { path = ''; }
		path = path.trim();
		record.delimiter = await this.get_delimiter();
		let parts = [];
		// break the path apart into pieces based on the supplied delimiter (\ or /).
		if (path.includes('\\') && !path.includes('/')) { parts = path.split('\\'); }
		else if (!path.includes('\\') && path.includes('/')) { parts = path.split('/'); }
		else { parts = path.split(record.delimiter); }
		if (parts && parts.length) {
			const l = parts.length - 1;
			// remove any empty entries
			for (let i = l; i >= 0; i--) {
				if (!parts[i] || parts[i] === '.') { parts.splice(i, 1); }
			}
			let folder_start = 0;
			let folder_stop = l;
			if (parts[0] && parts[0].includes(':')) {
				folder_start = 1;
				record.drive = parts[0];
			}
			if (parts[l] && parts[l].includes('.')) {
				folder_stop = l - 1;
				record.filename = parts[l];
				const fparts = parts[l].split('.');
				if (fparts && fparts.length > 1) {
					record.extension = fparts[fparts.length - 1]
					record.basename = parts[l].replace('.' + fparts[fparts.length - 1], '').trim();
				}
			}
			if ((parts.length && !record.filename) || (parts.length > 1 && record.filename)) {
				for (let i = folder_start; i <= folder_stop; i++) {
					if (parts[i]) { record.folders.push(parts[i]); }
				}
			}
		}
		// complete the full path, starting with the drive letter
		if (!record.drive) {
			const app_path = await wrapper.get_app_directory();
			if (app_path && app_path.includes(':')) {
				const app_record = await this.parse(app_path);
				if (app_record) {
					if (app_record.drive) { record.drive = app_record.drive; }
					if (app_record.folders.length) { record.folders = app_record.folders.concat(record.folders); }
				}
			}
		}
		return record;
	}

}