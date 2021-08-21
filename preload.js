///////////////////////////////////////////////////////////////////////////////
// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Source: https://stackoverflow.com/a/59888788
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
	'api', {
		send: (channel, data) => {
			// whitelist channels
			const validChannels = ['toMain', 'toSpawn'];
			if (validChannels.includes(channel)) {
				try { ipcRenderer.send(channel, data); }
				catch(e) { console.log(e); }
			}
		},
		receive: (channel, func) => {
			const validChannels = ['fromMain', 'fromSpawn'];
			// Deliberately strip event as it includes sender
			if (validChannels.includes(channel)) {
				try { ipcRenderer.on(channel, (event, ...args) => func(...args)); }
				catch(e) { console.log(e); }
			}
		},
		receive_once: (channel, func) => {
			const validChannels = ['fromMain', 'fromSpawn'];
			// Deliberately strip event as it includes sender
			if (validChannels.includes(channel)) {
				try { ipcRenderer.once(channel, (event, ...args) => func(...args)); }
				catch(e) { console.log(e); }
			}
		}
	}
);
