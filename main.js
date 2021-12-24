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
const qs = require('qs');
const seq = require('./js/sequences.js');

///////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////

const store = new eStore();
const spawns = [];
const win = { main: null, icon: 'assets/icons/icon.png' };

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
			icon: win.icon,
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

		this.handle.stdout.setEncoding('utf8');
		this.handle.stderr.setEncoding('utf8');
		this.handle.stdout.on('data', (data) => {
			const cleaned = data + '\r\n';
			win.main.webContents.send('fromSpawn', { id: this.id, data: cleaned, success: true });
		});

		this.handle.stderr.on('data', (data) => {
			const cleaned = data + '\r\n';
			win.main.webContents.send('fromSpawn', { id: this.id, data: cleaned, success: false });
		});

		this.handle.on('error', (error) => { console.log(error); });
		this.handle.on('close', () => { this.handle = undefined; });

		return this.id;

	}

	this.kill = () => {
		this.handle.stdin.pause();
		this.handle.kill();
	}

	this.write = (cmd) => {
		if (!cmd.includes('\n')) { cmd += '\n'; }
		this.handle.stdin.cork();
		this.handle.stdin.write(cmd);
		this.handle.stdin.uncork();
	}

}

///////////////////////////////////////////////////////////////////////////////
// FUNCTIONS //////////////////////////////////////////////////////////////////

async function append_file(filename, data) {
	if (filename && data) { fs.appendFile(filename, data, () => { return true; }); }
}

async function axios_get(url) {
	if (url) {
		axios.get(url)
			.then(result => { return result.data })
			.catch(() => { return ''; });
	}
}

async function axios_post(url, data, config) {
	if (url && data && config) {
		data = qs.stringify(arg.data);
		axios.post(url, data, config)
			.then(result => { return result.data })
			.catch(() => { return {} });
	}
}

async function create_directory(dir_name) {
	if (dir_name) {
		if (!fs.existsSync(dir_name)) { fs.mkdirSync(dir_name); }
		return true;
	}
}

async function create_spawn() {
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
	return id;
}

async function delete_file(filename) {
	if (filename) { fs.unlink(filename, () => { return true; }); }
}

async function get_app_data_directory() { return app.getPath('userData'); }

async function get_app_directory() { return __dirname; }

async function get_operating_system() {
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

async function open_file_dialog(filters) {
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

async function read_file(filename, encoding) {
	if (!filename) { return ''; }
	let data = '';
	encoding = enconding ?? 'utf-8';
	const handle = fs.createReadStream(filename, { encoding: encoding, flags: 'r' });
	handle.on('close', () => { return data; });
	handle.on('data', (chunk) => { data += chunk; });
	handle.on('end', () => { handle.close(); });
	handle.on('error', () => { return ''; });
}

async function update_menu_item(item, state) {
	if (item) {
		const menu_item = menu.getMenuItemById(item);
		if (state) {
			switch (state) {
				case 'disable': { menu_item.enabled = false; break; }
				case 'enable': { menu_item.enabled = true; break; }
			}
		}
	}
	return true;
}

async function update_menu_item_batch(batch, state) {
	if (batch && state) {
		for (let i = 0; i < batch.length; i++) {
			let menu_item = menu.getMenuItemById(arg.batch[i]);
			if (menu_item) {
				switch (state) {
					case 'disable': { menu_item.enabled = false; break; }
					case 'enable': { menu_item.enabled = true; break; }
				}
			}
		}
	}
	return true;
}

async function url_exists(url) {
	if (url) {
		axios.head(url)
			.then(() => { return true; })
			.catch(() => { return false; });
	}
	return false;
}

async function write_canvas_to_png(filename, data) {
	if (filename && data) {
		const buff = buffer.from(data, 'base64');
		fs.writeFile(filename, buff, 'base64', (err) => {
			if (err) { return err; }
			else { return true; }
		});
	}
	return false;
}

async function write_file(filename, data, encoding) {
	if (filename) {
		data = data || '';
		encoding = encoding || 'utf-8';
		if (data.length <= 10000) {
			fs.writeFile(filename, data, encoding, (err) => {
				if (err) { return err; }
				else { return true; }
			});
		}
		else {
			const handle = fs.createWriteStream(filename, { encoding: encoding, flags: 'w' });
			await handle.write(data);
			await handle.end();
			handle.close();
			handle.on('error', () => { return false; });
			handle.on('finish', () => { return true; });
		}
	}
	return false;
}

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

///////////////////////////////////////////////////////////////////////////////
// IPC COMMUNICATION //////////////////////////////////////////////////////////

ipc.on('toMain', async (event, arg) => {
	event.preventDefault();
	if (arg.command) {
		
		switch (arg.command) {

			case 'open_cds': {
				const sequences = new seq.SEQUENCES();
				await sequences.load_fasta_file(arg.data.filePaths[0]);
				console.log(sequences.cargo[0]);
				break;
			}
		
		}

	}
});

///////////////////////////////////////////////////////////////////////////////