///////////////////////////////////////////////////////////////////////////////
// terminal.js
//	Requires globals: wrapper.js

function TERMINAL() {

	this.buffer = '';
	this.id = '';
	this.out = '';
	this.error = '';

	this.activate = async (options) => {
		if (this.id) { await this.kill(); }
		this.id = await wrapper.create_spawn('cmd', [], options);
		return await this.get_output();
	}

	this.get_output = () => {
		return new Promise((resolve) => {
			if (this.buffer) { return resolve(this.flush_buffer()); }
			const interval = setInterval(() => {
				if (this.buffer) {
					clearInterval(interval);
					return resolve(this.flush_buffer());
				}
			}, 250);
		});
	}

	this.flush_buffer = () => {
		const buff = this.buffer;
		this.buffer = '';
		this.error = '';
		this.out = '';
		return buff;
	}

	this.flush_error = () => {
		const error = this.error;
		this.error = '';
		return error;
	}

	this.flush_out = () => {
		const out = this.out;
		this.out = '';
		return out;
	}

	this.io = async (cmd) => {
		await this.stdin(cmd);
		return await this.get_output();
	}

	this.kill = async () => {
		await wrapper.kill_spawn(this.id);
	}

	this.stdin = async (cmd) => {
		await wrapper.write_to_spawn(this.id, cmd);
	}

	////////////////////////////////////////////////////////////////////////

	window.api.receive('fromSpawn', async (arg) => {
		if (arg.id === this.id) {
			if (arg.success) { this.out = arg.data }
			else { this.error = arg.data; }
			this.buffer += arg.data;
		}
	});

}
