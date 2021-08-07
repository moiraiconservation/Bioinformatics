///////////////////////////////////////////////////////////////////////////////
// wrapper.js /////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
// Manifest:
//	append_file
//	axios_get
//	axios_post
//	axios_post
//	close_read_stream
//	close_write_stream
//	create_directory
//	create_read_stream
//	create_write_stream
//	delete_file (corresponds with 'unlink' in main.js)
//	get_app_data_directory
//	get_app_directory
//	get_app_storage
//	get_operating_system
//	read_from_delimited_stream
//	open_file_dialog
//	read_file
//	set_app_storage
//	sqlite3_all
//	sqlite3_run
//	update_menu_item
//	update_menu_item_batch
//	url_exists
//	wait
//	write_canvas_to_png
//	write_file

function WRAPPER() {

	this.append_file = (filename, contents) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'append_file', filename: filename, data: contents });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'append_file') { return resolve(arg.success); } });
		});
	}

	this.axios_get = (url) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'axios_get', url: url });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'axios_get') { return resolve(arg.data); } });
		});
	}

	this.axios_post = (config, data, url) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'axios_post', config: config, data: data, url: url });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'axios_post') { return resolve(arg.data); } });
		});
	}

	this.close_read_stream = () => { window.api.send('toMain', { command: 'close_read_stream' }); }

	this.close_write_stream = () => { window.api.send('toMain', { command: 'close_write_stream' }); }

	this.create_directory = (dir_name) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'create_directory', dir_name: dir_name });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'create_directory') { return resolve(arg.success); } });
		});
	}

	this.create_read_stream = (filename, encoding) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'create_read_stream', filename: filename, encoding: encoding });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'create_read_stream') { return resolve(arg.success); } });
		});
	}

	this.create_write_stream = (filename, encoding) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'create_write_stream', filename: filename, encoding: encoding });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'create_write_stream') { return resolve(arg.success); } });
		});
	}

	this.delete_file = (filename) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'unlink', filename: filename });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'unlink') { return resolve(arg.success); } });
		});
	}

	this.get_app_data_directory = () => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'get_app_data_directory' });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'get_app_data_directory') { return resolve(arg.data); } });
		});
	}

	this.get_app_directory = () => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'get_app_directory' });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'get_app_directory') { return resolve(arg.data); } });
		});
	}

	this.get_app_storage = () => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'get_app_storage' });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'get_app_storage') { return resolve(arg.data); } });
		});
	}

	this.get_operating_system = () => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'get_operating_system' });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'get_operating_system') { return resolve(arg.data); } });
		});
	}

	this.read_from_delimited_stream = (delimiter) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'read_from_delimited_stream', delimiter: delimiter });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'read_from_delimited_stream') { return resolve(arg.data); } });
		});
	}

	this.open_file_dialog = (filters) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'open_file_dialog', filters: filters });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'open_file_dialog') { return resolve(arg.data); } });
		});
	}

	this.read_file = (filename) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'read_file', filename: filename });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'read_file') { return resolve(arg.data); } });
		});
	}

	this.set_app_storage = (app_storage) => {
		window.api.send('toMain', { command: 'set_app_storage', data: app_storage });
	}

	this.sqlite3_all = (sql) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'sqlite3_all', sql: sql });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'sqlite3_all') { return resolve(arg.data); } });
		});
	}

	this.sqlite3_run = (sql, param) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'sqlite3_run', sql: sql, param: param });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'sqlite3_run') { return resolve(arg.success); } });
		});
	}

	this.update_menu_item = (item, state) => {
		window.api.send('toMain', { command: 'update_menu_item', item: item, state: state });
	}

	this.update_menu_item_batch = (batch, state) => {
		window.api.send('toMain', { command: 'update_menu_item_batch', batch: batch, state: state });
	}

	this.url_exists = (url) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'url_exists', url: url });
			window.api.receive_once('fromMain', (arg) => {
				if (arg.command == 'url_exists') {
					if (arg.success) { return resolve(true); }
					else { return resolve(false); }
				}
			});
		});
	}

	this.wait = () => {
		return new Promise((resolve) => {
			setTimeout(() => { return resolve(); }, 10);
		});
	}

	this.write_canvas_to_png = (filename, canvas) => {
		return new Promise((resolve) => {
			const img = canvas.toDataURL();
			const data = img.replace(/^data:image\/\w+;base64,/, '');
			window.api.send('toMain', { command: 'write_canvas_to_png', filename: filename, data: data });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'write_canvas_to_png') { return resolve(arg.success); } });
		});
	}

	this.write_file = (filename, contents) => {
		return new Promise((resolve) => {
			window.api.send('toMain', { command: 'write_file', filename: filename, data: contents });
			window.api.receive_once('fromMain', (arg) => { if (arg.command == 'write_file') { return resolve(arg.success); } });
		});
	}

}