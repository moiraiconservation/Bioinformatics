///////////////////////////////////////////////////////////////////////////////
// terminal.js
//	Requires globals: wrapper.js

function TERMINAL() {

	this.buffer = '';
	this.id = '';
	this.stdout = '';
	this.stderr = '';

	this.activate = async (options) => {
		this.id = await wrapper.create_spawn('cmd', [], options);
		const output = await this.get_output();
		console.log(output);
	}

	this.get_output = () => {
		return new Promise((resolve) => {
			if (this.stdout) {
				const stdout = this.stdout;
				this.stdout = '';
				return resolve(stdout);
			}
			if (this.stderr) {
				const stderr = this.stderr;
				this.stderr = '';
				return resolve(stderr);
			}
			const interval = setInterval(() => {
				if (this.stdout) {
					clearInterval(interval);
					const stdout = this.stdout;
					this.stdout = '';
					return resolve(stdout);
				}
				if (this.stderr) {
					clearInterval(interval);
					const stderr = this.stderr;
					this.stderr = '';
					return resolve(stderr);
				}
			}, 250);
		});
	}

	window.api.receive('fromSpawn', async (arg) => {
		if (arg.id === this.id) {
			if (arg.success) { this.stdout = arg.data }
			else { this.stderr = arg.data; }
			this.buffer += arg.data;
		}
	});

}
