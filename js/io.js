///////////////////////////////////////////////////////////////////////////////
// io.js

const { app, dialog } = require('electron');
const axios = require('axios');
const fs = require('fs');
const qs = require('qs');

function IO() {

	this.append_file = async (filename, data) => {
		if (filename && data) { fs.appendFile(filename, data, () => { return true; }); }
	}

	this.axios_get = async (url) => {
		if (url) {
			axios.get(url)
				.then(result => { return result.data })
				.catch(() => { return ''; });
		}
	}

	this.axios_post = async (url, data, config) => {
		if (url && data && config) {
			data = qs.stringify(arg.data);
			axios.post(url, data, config)
				.then(result => { return result.data })
				.catch(() => { return {} });
		}
	}

	this.create_directory = async (dir_name) => {
		if (dir_name) {
			if (!fs.existsSync(dir_name)) { fs.mkdirSync(dir_name); }
			return true;
		}
	}

	this.delete_file = async (filename) => {
		if (filename) { fs.unlink(filename, () => { return true; }); }
	}

	this.get_app_data_directory = () => { return app.getPath('userData'); }

	this.get_app_directory = () => { return __dirname; }

	this.get_operating_system = () => {
		let os = '';
		switch (process.platform) {
			case 'darwin': { os = 'MacOS'; break; }
			case 'linux': { os = 'Linux'; break; }
			case 'win32': { os = 'Windows'; break; }
			case 'win64': { os = 'Windows'; break; }
			default: { os = 'Unknown'; }
		}
		return os;
	}

	this.open_file_dialog = async (filters) => {
		filters = filters || [
			{ name: 'Text Files', extensions: ['txt'] },
			{ name: 'All Files', extensions: ['*'] }
		];
		dialog.showOpenDialog({
			filters: filters,
			properties: ['openFile']
		})
			.then((response) => {
				if (!response.canceled) {
					return response;
				}
			});
	}

	this.read_file = async (filename, encoding) => {
		return new Promise((resolve) => {
			if (!filename) { return resolve(''); }
			let data = '';
			encoding = encoding || 'utf-8';
			const handle = fs.createReadStream(filename, { encoding: encoding, flags: 'r' });
			handle.on('close', () => { return resolve(data); });
			handle.on('data', (chunk) => { data += chunk; });
			handle.on('end', () => { handle.close(); });
			handle.on('error', () => { return resolve(''); });
		});
	}

	this.url_exists = async (url) => {
		if (url) {
			axios.head(url)
				.then(() => { return true; })
				.catch(() => { return false; });
		}
		return false;
	}

	this.write_canvas_to_png = async (filename, data) => {
		if (filename && data) {
			const buff = buffer.from(data, 'base64');
			fs.writeFile(filename, buff, 'base64', (err) => {
				if (err) { return err; }
				else { return true; }
			});
		}
		return false;
	}

	this.write_file = async (filename, data, encoding) => {
		return new Promise((resolve) => {
			if (filename) {
				data = data || '';
				encoding = encoding || 'utf-8';
				if (data.length <= 10000) {
					fs.writeFile(filename, data, encoding, (err) => {
						if (err) { return resolve(err); }
						else { return resolve(true); }
					});
				}
				else {
					const handle = fs.createWriteStream(filename, { encoding: encoding, flags: 'w' });
					handle.write(data);
					handle.end();
					handle.close();
					handle.on('error', () => { return resolve(false); });
					handle.on('finish', () => { return resolve(true); });
				}
			}
		});
	}

}

module.exports = { IO: IO }