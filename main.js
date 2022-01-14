///////////////////////////////////////////////////////////////////////////////
// main.js

///////////////////////////////////////////////////////////////////////////////
// REQUIRED COMPONENTS ////////////////////////////////////////////////////////

const { app, BrowserWindow, Menu } = require('electron');
const app_menu = require ('./menu.js');
const child_process = require('child_process');
const eStore = require('electron-store');
const ipc = require('electron').ipcMain;
const path = require('path');

const { SEQUENCES } = require('./js/sequences.js');
const { DATA } = require('./js/data.js');
const sequences = new SEQUENCES();
const data = new DATA();

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

function create_spawn() {
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

function update_menu_item(item, state) {
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

function update_menu_item_batch(batch, state) {
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
				//const sequences = new seq.SEQUENCES();
				//await sequences.load_fasta_file(arg.data.filePaths[0]);
				//console.log(sequences.cargo[0]);
				await data.load_xlsx_file(arg.data.filePaths[0]);
				win.main.webContents.send('toRender', { command: 'console.log', data: data.cargo });
				break;
			}
		
		}

	}
});

///////////////////////////////////////////////////////////////////////////////