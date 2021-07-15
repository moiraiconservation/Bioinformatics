///////////////////////////////////////////////////////////////////////////////
// menu.js ////////////////////////////////////////////////////////////////////

const { app, dialog } = require('electron');

///////////////////////////////////////////////////////////////////////////////
// MODULE /////////////////////////////////////////////////////////////////////

module.exports = {

	create_menu(win) {
		return [
			{
				label: 'File',
				submenu: [
					{
						id: 'open_fasta',
						label: 'Open FASTA File...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'FASTA', extensions: ['fasta', 'faa', 'fna'] },
									{ name: 'Text', extensions: ['txt'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['openFile']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('fromMain', { command: 'open_fasta', success: true, data: response });
									}
								});
						}
					},
					{ type: 'separator' },
					{ label: 'Exit', click() { app.quit() } }
				]
			},
			{
				label: 'Debug',
				submenu: [
					{ label: 'Developer Console', click() { win.main.webContents.openDevTools({ mode: 'detach' }) } }
				]
			}
		]
	}

}