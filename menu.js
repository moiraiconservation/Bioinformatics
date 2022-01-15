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
						id: 'open_cds',
						label: 'Open CDS Files...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'FASTA', extensions: ['fna', 'fasta'] },
									{ name: 'Text', extensions: ['txt'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['multiSelections', 'openFile']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('toRender', { command: 'bounce', subcommand: 'open_cds', success: true, data: response });
									}
								});
						}
					},

					{
						id: 'open_drugbank',
						label: 'Open DrugBank File...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'XML', extensions: ['xml'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['multiSelections', 'openFile']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('toRender', { command: 'bounce', subcommand: 'open_drugbank', success: true, data: response });
									}
								});
						}
					},

					{
						id: 'open_protein',
						label: 'Open Protein Files...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'FASTA', extensions: ['fasta', 'faa'] },
									{ name: 'Text', extensions: ['txt'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['multiSelections', 'openFile']
							})
							.then((response) => {
								if (!response.canceled) {
									win.main.webContents.send('toRender', { command: 'bounce', subcommand: 'open_cds', success: true, data: response });
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