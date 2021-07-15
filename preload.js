///////////////////////////////////////////////////////////////////////////////
// PRELOAD.js /////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// REQUIRED COMPONENTS ////////////////////////////////////////////////////////
const { contextBridge, ipcRenderer } = require('electron');
///////////////////////////////////////////////////////////////////////////////
// CONTEXT BRIDGE /////////////////////////////////////////////////////////////
// SOURCE: https://stackoverflow.com/a/59888788
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
	'api', {
		send: (channel, data) => {
			// whitelist channels
			const validChannels = ['toMain'];
			if (validChannels.includes(channel)) { ipcRenderer.send(channel, data); }
		},
		receive: (channel, func) => {
			const validChannels = ['fromMain'];
			// Deliberately strip event as it includes sender
			if (validChannels.includes(channel)) { ipcRenderer.on(channel, (event, ...args) => func(...args)); }
		},
		receive_once: (channel, func) => {
			const validChannels = ['fromMain'];
			// Deliberately strip event as it includes sender
			if (validChannels.includes(channel)) { ipcRenderer.once(channel, (event, ...args) => func(...args)); }
		}
	}
);
///////////////////////////////////////////////////////////////////////////////