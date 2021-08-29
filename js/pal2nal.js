///////////////////////////////////////////////////////////////////////////////
// pal2nal.js
//	Requires globals: pather.js, terminal.js, wrapper.js

function PAL2NAL() {

	this.engine = '';
	this.terminal = new TERMINAL();

	this.install_engine = async (path) => {
		path = path ?? '';
		await this.terminal.activate();
		const path_record = await pather.parse(path);
		await path_record.set_file_name('pal2nal.pl');
		const full_path = await path_record.get_full_path();
		this.engine = full_path;
		return;
	}

	this.kill = () => {
		this.terminal.stdin('exit');
		this.terminal.kill();
	}

	this.create_batch_file = async (source_arr, target, options) => {
		if (typeof (source_arr) === 'undefined' || !Array.isArray(source_arr)) { return; }
		if (typeof (target) !== 'string') { target = ''; }
		if (typeof (options) === 'undefined' || typeof (options) !== 'object') { options = {}; }
		let target_record = await pather.parse(target);
		await target_record.force_path();
		let contents = '';
		for (let i = 0; i < source_arr.length; i++) {
			if (!source_arr[i].cds_fasta || !source_arr[i].protein_aln) { continue; }
			const cds_record = await pather.parse(source_arr[i].cds_fasta);
			const protein_record = await pather.parse(source_arr[i].protein_aln);
			target_record = await this.create_target_filename(source_record, target_record);
			const cds_path = await cds_record.get_full_path();
			const protein_path = await protein_record.get_full_path();
			const target_path = await target_record.get_full_path();
			contents += this.create_cmd(cds_path, protein_path, target_path, options);
		}
		contents += 'echo Hedron batch complete';
		await wrapper.write_file('pal2nal.bat', contents);
	}

	this.create_cmd = (cds_path, protein_path, target_path, options) => {
		let cmd = this.engine + ' ' + protein_path + ' ' + cds_path;
		const keys = Object.keys(options);
		for (let i = 0; i < keys.length; i++) {
			switch (key[i]) {
				case 'blockonly': { if (options[key[i]]) { cmd += ' -blockonly'; } break; }
				case 'codontable': { cmd += ' -codontable ' + options[key[i]]; break; }
				case 'nogap': { if (options[key[i]]) { cmd += ' -nogap'; } break; }
				case 'nomismatch': { if (options[key[i]]) { cmd += ' -nomismatch'; } break; }
				case 'output': { cmd += ' -output ' + options[key[i]]; break; }
			}
		}
		cmd += ' > ' + target_path + '\n';
		return cmd;
	}

	this.create_target_filename = async (source, target) => {
		let ext = '.txt';
		if (typeof (source) === 'string') { source = await pather.parse(source); }
		if (typeof (target) === 'string') { target = await pather.parse(target); }
		await target.set_file_name(source.basename + ext);
		return target;
	}

	this.run_batch_file = async (callback) => {
		await this.terminal.io('pal2nal.bat', 'Hedron batch complete', callback);
	}

}