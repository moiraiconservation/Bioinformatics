///////////////////////////////////////////////////////////////////////////////
// t_coffee.js
//	Requires globals: pather.js and wrapper.js

function T_COFFEE() {

	this.engine = '';

	this.install_engine = async (path) => {
		const path_record = await pather.parse(path);
		const full_path = await path_record.get_full_path();
		this.engine = full_path;
		// If no path supplied, we're gonna have to look for it in the $PATH.
		//  Use this command: echo "${PATH//:/$'\n'}"
	}

	this.align = async (path) => {
		//const path_record = await pather.parse(path);
		//const full_path = await path_record.get_full_path();
		const stdout = await wrapper.execute();
		console.log(stdout);
		
	}

}