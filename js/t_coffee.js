///////////////////////////////////////////////////////////////////////////////
// t_coffee.js
//	Requires globals: pather.js, terminal.js, wrapper.js

function T_COFFEE() {

	this.engine = '';
	this.terminal = new TERMINAL();

	this.install_engine = async (path) => {
		await this.terminal.activate();
		if (path) {
			const path_record = await pather.parse(path);
			await path_record.set_file_name('t_coffee');
			const full_path = await path_record.get_full_path();
			this.engine = full_path;
			return;
		}
		const os = await wrapper.get_operating_system();
		if (os === 'Windows') {
			await this.terminal.io('wsl.exe');
			let whoami = await this.terminal.io('whoami');
			whoami = whoami.replace(/(\r|\n)/g, '');
			const wsl_path = '/home/' + whoami + '/.t_coffee/bin/linux/t_coffee';
			const check = await this.terminal.io(wsl_path + ' -version');
			console.log(check);
			if (check.includes('PROGRAM: T-COFFEE Version')) { this.engine = wsl_path; }
			else { await this.terminal.io('exit'); }
			return;
		}

	}

	this.run = async (source, target, options) => {
		if (!source || typeof (source) === 'undefined') { return; }
		if (typeof (target) !== 'string') { target = ''; }
		if (typeof (options) === 'undefined' || typeof (options) !== 'object') { options = {}; }
		const source_record = await pather.parse(source);
		const target_record = await pather.parse(target);
		await target_record.force_path();
		if (!target_record.basename) {
			let ext = '.fasta_aln';
			if (options.output) {
				if (options.output.includes(',')) {
					const ext_parts = options.output.split(',');
					ext = '.' + ext_parts[0];
				}
				else { ext += '.' + options.output; }
			}
			await target_record.set_file_name(source_record.basename + ext);
		}
		const source_path = await source_record.get_full_path({ os: 'Linux' });
		const target_path = await target_record.get_full_path({ os: 'Linux' });
		let cmd = this.engine + ' ' + source_path + ' -run_name=' + target_path;
		const keys = Object.keys(options);
		for (let i = 0; i < keys.length; i++) {
			if (keys[i] !== 'run_name') {
				cmd += ' -' + keys[i] + ' ' + options[keys[i]];
			}
		}
		const output = await this.terminal.io(cmd);
		console.log(output);
		return await target_record.get_full_path();
	}

}