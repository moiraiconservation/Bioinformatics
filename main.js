///////////////////////////////////////////////////////////////////////////////
// main.js

///////////////////////////////////////////////////////////////////////////////
// REQUIRED COMPONENTS ////////////////////////////////////////////////////////

const { app, BrowserWindow, dialog, Menu } = require('electron');
const app_menu = require ('./menu.js');
const axios = require('axios');
const child_process = require('child_process');
const eStore = require('electron-store');
const fs = require('fs');
const ipc = require('electron').ipcMain;
const path = require('path');
//const sqlite3 = require('sqlite3'); // uncomment this if using sqlite3 database
const qs = require('qs');

///////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////

const store = new eStore();
const spawns = [];
const win = { main: null, icon: 'assets/icons/pentagon_512x512.png' };

///////////////////////////////////////////////////////////////////////////////
// LOAD THE DEFAULT SETTINGS //////////////////////////////////////////////////

let app_storage = {};
app_storage.project_directory = store.get('projectDirectory');
app_storage.window_bounds = store.get('windowBounds');
if (typeof (app_storage.project_directory) === 'undefined') { app_storage.project_directory = ''; }
if (typeof (app_storage.window_bounds) === 'undefined') { app_storage.window_bounds = {}; }
if (typeof (app_storage.window_bounds.height) === 'undefined') { app_storage.window_bounds.height = 800; }
if (typeof (app_storage.window_bounds.maximized) === 'undefined') { app_storage.window_bounds.maximized = false; }
if (typeof (app_storage.window_bounds.width) === 'undefined') { app_storage.window_bounds.width = 1000; }

///////////////////////////////////////////////////////////////////////////////
// MENU ///////////////////////////////////////////////////////////////////////

const menu = Menu.buildFromTemplate(app_menu.create_menu(win));
Menu.setApplicationMenu(menu);

///////////////////////////////////////////////////////////////////////////////
// APPLICATION CONTROL ////////////////////////////////////////////////////////

app.whenReady().then(show_window);
app.once('before-quit', () => { window.removeAllListeners('close'); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { show_window(); } });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') { app.quit() } });

///////////////////////////////////////////////////////////////////////////////
// FUNCTIONS //////////////////////////////////////////////////////////////////

function show_window(filename) {
	if (typeof (filename) === 'undefined') { filename = 'render.html'; }
	const file_path = path.join(__dirname, filename);
	if (!win.main) {
		win.main = new BrowserWindow({
			frame: true,
			height: app_storage.window_bounds.height,
			show: false,
			webPreferences: {
				contextIsolation: true,
				enableRemoteModule: false,
				nodeIntegration: false,
				preload: path.join(__dirname, 'preload.js')
			},
			width: app_storage.window_bounds.width
		});
		if (app_storage.window_bounds.maximized) { win.main.maximize(); }
		if (app_storage.window_bounds.x && app_storage.window_bounds.y) { win.main.setPosition(app_storage.window_bounds.x, app_storage.window_bounds.y); }
		win.main.loadFile(file_path);
		win.main.on('close', () => {
			ipc.removeAllListeners();
			const position = win.main.getPosition();
			store.set('projectDirectory', app_storage.project_directory);
			store.set('windowBounds.height', app_storage.window_bounds.height);
			store.set('windowBounds.maximized', app_storage.window_bounds.maximized);
			store.set('windowBounds.width', app_storage.window_bounds.width);
			store.set('windowBounds.x', position[0]);
			store.set('windowBounds.y', position[1]);
		});
		win.main.on('maximize', () => {
			app_storage.window_bounds.maximized = true;
			win.main.webContents.send('window-resized', win.main.getBounds());
		});
		win.main.on('resize', () => {
			if (!win.main.isMaximized()) {
				let { height, width } = win.main.getBounds();
				app_storage.window_bounds.height = height;
				app_storage.window_bounds.width = width;
				win.main.webContents.send('window-resized', win.main.getBounds());
			}
		});
		win.main.on('unmaximize', () => {
			app_storage.window_bounds.maximized = false;
			win.main.setSize(app_storage.window_bounds.width, app_storage.window_bounds.height)
		});
	}
	win.main.once('ready-to-show', () => { win.main.show(); });
}

///////////////////////////////////////////////////////////////////////////////
// OBJECTS ////////////////////////////////////////////////////////////////////

function SPAWN() {
	this.handle = undefined;
	this.id = '';

	this.create = (cmd, args, options) => {
		if (!cmd) { cmd = 'cmd'; }
		if (!args) { args = []; }
		if (!options) { options = { shell: true }; }
		this.handle = child_process.spawn(cmd);
		this.id = Math.random().toString(36).substring(7);

		this.handle.stdout.on('data', (data) => {
			const cleaned = data.toString() + '\r\n';
			win.main.webContents.send('fromSpawn', { id: this.id, data: cleaned, success: true });
		});

		this.handle.stderr.on('data', (data) => {
			const cleaned = data.toString() + '\r\n';
			win.main.webContents.send('fromSpawn', { id: this.id, data: cleaned, success: false });
		});

		this.handle.on('close', () => { this.handle = undefined; });

		return this.id;

	}

	this.kill = () => {
		this.handle.stdin.pause();
		this.handle.kill();
	}

	this.write = (cmd) => {
		this.handle.stdin.cork();
		this.handle.stdin.write(cmd + '\n');
		this.handle.stdin.uncork();
	}

}

///////////////////////////////////////////////////////////////////////////////
// IPC COMMUNICATION //////////////////////////////////////////////////////////

// toMain Manifest:
//	append_file
//	axios_get
//	axios_post
//	create_directory
//	create_spawn
//	delete_file
//	get_app_data_directory
//	get_app_directory
//	get_app_storage
//	get_operating_system
//	open_file_dialog
//	read_file
//	set_app_storage
//	sqlite3_all
//	sqlite3_run
//	update_menu_item
//	update_menu_item_batch
//	url_exists
//	write_canvas_to_png
//	write_file

ipc.on('toMain', async (event, arg) => {
	event.preventDefault();
	if (arg.command) {
		switch (arg.command) {

			case 'append_file': {
				if (arg.filename && arg.data) {
					fs.appendFile(arg.filename, arg.data, () => { win.main.webContents.send('fromMain', { command: arg.command, success: true }); });
				}
				break;
			}

			case 'axios_get': {
				if (arg.url) {
					axios.get(arg.url)
						.then(result => { win.main.webContents.send('fromMain', { command: arg.command, success: true, data: result.data }); })
						.catch(() => { win.main.webContents.send('fromMain', { command: arg.command, success: false, data: '' }); });
				}
				break;
			}

			case 'axios_post': {
				if (arg.url && arg.data && arg.config) {
					const data = qs.stringify(arg.data);
					axios.post(arg.url, data, arg.config)
					.then(result => { win.main.webContents.send('fromMain', { command: arg.command, success: true, data: result.data }); })
						.catch(() => { win.main.webContents.send('fromMain', { command: arg.command, success: true, data: {} }); });
				}
				break;
			}

			case 'create_directory': {
				if (arg.dir_name) {
					if (!fs.existsSync(arg.dir_name)) { fs.mkdirSync(arg.dir_name); }
					win.main.webContents.send('fromMain', { command: arg.command, success: true });
				}
				break;
			}

			case 'create_spawn': {
				let cmd = arg.cmd;
				let args = arg.args;
				let options = arg.options;
				if (!cmd) { cmd = 'cmd'; }
				if (!args) { args = []; }
				if (!options) { options = { shell: true }; }
				let id = '';
				const spawn = new SPAWN();
				id = spawn.create(cmd, args, options);
				spawns.push(spawn);
				win.main.webContents.send('fromMain', { command: arg.command, data: id, success: true });
				break;
			}

			case 'delete_file': {
				if (arg.filename) {
					fs.unlink(arg.filename, () => { win.main.webContents.send('fromMain', { command: arg.command, success: true }); });
				}
				break;
			}

			case 'get_app_data_directory': {
				win.main.webContents.send('fromMain', { command: arg.command, success: true, data: app.getPath('userData') });
				break;
			}

			case 'get_app_directory': {
				win.main.webContents.send('fromMain', { command: arg.command, success: true, data: __dirname });
				break;
			}

			case 'get_app_storage': {
				win.main.webContents.send('fromMain', { command: arg.command, success: true, data: app_storage });
				break;
			}

			case 'get_operating_system': {
				let os = '';
				switch(process.platform) {
					case 'darwin': { os = 'MacOS'; break; }
					case 'linux': { os = 'Linux'; break; }
					case 'win32': { os = 'Windows'; break; }
					case 'win64': { os = 'Windows'; break; }
					default: { os = 'Unknown'; }
				}
				win.main.webContents.send('fromMain', { command: arg.command, success: true, data: os });
				break;
			}

			case 'open_file_dialog': {
				let filters = [
					{ name: 'FASTA', extensions: ['fasta', 'faa', 'fna'] },
					{ name: 'Text Files', extensions: ['txt'] },
					{ name: 'All Files', extensions: ['*'] }
				];
				if (arg.filters) { filters = arg.filters; }
				dialog.showOpenDialog({
					filters: filters,
					properties: ['openFile']
				})
					.then((response) => {
						if (!response.canceled) {
							win.main.webContents.send('fromMain', { command: arg.command, success: true, data: response });
						}
					});
				break;
			}

			case 'read_file': {
				if (!arg.filename) { win.main.webContents.send('fromMain', { command: arg.command, success: false, data: data }); }
				let data = '';
				encoding = 'utf-8';
				if (arg.encoding) { encoding = arg.encoding; }
				const handle = fs.createReadStream(arg.filename, { encoding: encoding, flags: 'r' });
				handle.on('close', () => { win.main.webContents.send('fromMain', { command: arg.command, success: true, data: data }); });
				handle.on('data', (chunk) => { data += chunk; });
				handle.on('end', () => { handle.close(); });
				handle.on('error', () => { win.main.webContents.send('fromMain', { command: arg.command, success: false, data: '' }); });
				break;
			}

			case 'set_app_storage': {
				if (arg.data) { app_storage = arg.data; }
				break;
			}

			case 'sqlite3_all': {
				if (arg.sql) {
					db.all(arg.sql, (error, rows) => {
						if (error) { win.main.webContents.send('fromMain', { command: arg.command, success: false }); }
						else { win.main.webContents.send('fromMain', { command: arg.command, success: true, data: rows }); }
					});
				}
				break;
			}
			
			case 'sqlite3_run': {
				if (arg.sql) {
					db.run(arg.sql, arg.param, (error) => {
						if (error) { console.log(error); win.main.webContents.send('fromMain', { command: arg.command, success: false }); }
						else { win.main.webContents.send('fromMain', { command: arg.command, success: true }); }
					});
				}
				break;
			}

			case 'update_menu_item': {
				if (arg.item) {
					const menu_item = menu.getMenuItemById(arg.item);
					if (arg.state) {
						switch (arg.state) {
							case 'disable': { menu_item.enabled = false; break; }
							case 'enable': { menu_item.enabled = true; break; }
						}
					}
				}
				break;
			}

			case 'update_menu_item_batch': {
				if (arg.batch && arg.state) {
					for (let i = 0; i < arg.batch.length; i++) {
						let menu_item = menu.getMenuItemById(arg.batch[i]);
						if (menu_item) {
							switch (arg.state) {
								case 'disable': { menu_item.enabled = false; break; }
								case 'enable': { menu_item.enabled = true; break; }
							}
						}
					}
				}
				break;
			}

			case 'url_exists': {
				if (arg.url) {
					axios.head(url)
						.then(() => { win.main.webContents.send('fromMain', { command: arg.command, success: true }); })
						.catch(() => { win.main.webContents.send('fromMain', { command: arg.command, success: false }); });
				}
				break;
			}

			case 'write_canvas_to_png': {
				if (arg.filename && arg.data) {
					const buff = buffer.from(arg.data, 'base64');
					fs.writeFile(arg.filename, buff, 'base64', (err) => {
						if (err) { win.main.webContents.send('fromMain', { command: arg.command, success: false, data: err }) }
						else { win.main.webContents.send('fromMain', { command: arg.command, success: true }); }
					});
				}
				break;
			}

			case 'write_file': {
				if (arg.filename) {
					data = '';
					encoding = 'utf-8';
					if (arg.data) { data = arg.data; }
					if (arg.encoding) { encoding = arg.encoding; }
					if (data.length <= 10000) {
						fs.writeFile(arg.filename, data, encoding, (err) => {
							if (err) { win.main.webContents.send('fromMain', { command: arg.command, success: false, data: err }) }
							else { win.main.webContents.send('fromMain', { command: arg.command, success: true }); }
						});
					}
					else {
						const handle = fs.createWriteStream(arg.filename, { encoding: encoding, flags: 'a' });
						await handle.write(data);
						await handle.end();
						handle.close();
						handle.on('error', () => { win.main.webContents.send('fromMain', { command: arg.command, success: false }); });
						handle.on('finish', () => { win.main.webContents.send('fromMain', { command: arg.command, success: true }); });
					}
				}
				break;
			}

			default: { win.main.webContents.send('fromMain', { command: arg.command, success: false, data: undefined }); }

		}
	}
});

///////////////////////////////////////////////////////////////////////////////

ipc.on('toSpawn', async (event, arg) => {
	event.preventDefault();
	if (arg.id) {
		const filtered = spawns.filter((x) => { return x.id === arg.id; });
		if (filtered.length && arg.command) {

			const spawn = filtered[0];
			switch(arg.command) {

				case 'kill_spawn': {
					spawn.kill();
					win.main.webContents.send('fromMain', { command: arg.command, success: true });
					break;
				}

				case 'write_to_spawn': {
					spawn.write(arg.cmd);
					win.main.webContents.send('fromMain', { command: arg.command, success: true });
					break;
				}

			}

		}
	}
});