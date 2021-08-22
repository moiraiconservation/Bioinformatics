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


}