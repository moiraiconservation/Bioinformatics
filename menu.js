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
						id: 'open_blast',
						label: 'Open BLAST Output Files...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'Text', extensions: ['txt'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['multiSelections', 'openFile']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('fromMain', { command: 'open_blast', success: true, data: response });
									}
								});
						}
					},

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
										win.main.webContents.send('fromMain', { command: 'open_cds', success: true, data: response });
									}
								});
						}
					},

					{
						id: 'open_compact_isoforms',
						label: 'Open Isoform Files...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'Isoforms', extensions: ['isoforms'] },
									{ name: 'Text', extensions: ['txt'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['multiSelections', 'openFile']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('fromMain', { command: 'open_compact_isoforms', success: true, data: response });
									}
								});
						}
					},

					{
						id: 'open_orthologs',
						label: 'Open Orthologs File...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'Orthologs', extensions: ['ortho'] },
									{ name: 'Text', extensions: ['txt'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['openFile']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('fromMain', { command: 'open_orthologs', success: true, data: response });
									}
								});
						}
					},

					{
						id: 'open_project_folder',
						label: 'Open Project Folder...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								properties: ['openDirectory']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('fromMain', { command: 'open_project_folder', success: true, data: response });
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
									win.main.webContents.send('fromMain', { command: 'open_protein', success: true, data: response });
								}
							});
						}
					},

					{
						id: 'open_rbh',
						label: 'Open RBH Files...',
						enabled: true,
						click() {
							dialog.showOpenDialog({
								filters: [
									{ name: 'RBH', extensions: ['rbh'] },
									{ name: 'Text', extensions: ['txt'] },
									{ name: 'All Files', extensions: ['*'] }
								],
								properties: ['multiSelections', 'openFile']
							})
								.then((response) => {
									if (!response.canceled) {
										win.main.webContents.send('fromMain', { command: 'open_rbh', success: true, data: response });
									}
								});
						}
					},

					{ type: 'separator' },

					{ label: 'Exit', click() { app.quit() } }

				]
			},

			{
				label: 'Actions',
				submenu: [

					{
						id: 't_coffee',
						label: 'T-Coffee',
						enabled: true,
						click() { win.main.webContents.send('fromMain', { command: 't_coffee' }); 	}
					},

					{
						id: 'verify_t_coffee',
						label: 'Verify T-Coffee',
						enabled: true,
						click() { win.main.webContents.send('fromMain', { command: 'verify_t_coffee' }); }
					}

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