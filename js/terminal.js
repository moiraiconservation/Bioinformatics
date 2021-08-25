///////////////////////////////////////////////////////////////////////////////
// terminal.js
//	Requires globals: wrapper.js

function TERMINAL() {

	this.buffer = '';
	this.id = '';
	this.out = '';
	this.error = '';

	this._trigger = '';
	this._callback = undefined;

	this.activate = async (options) => {
		if (this.id) { await this.kill(); }
		this.id = await wrapper.create_spawn('cmd', [], options);
		return await this.get_output();
	}

	this.get_output = () => {
		return new Promise((resolve) => {
			let timeout = 0;
			if (this.buffer) { return resolve(this.flush_buffer()); }
			const interval = setInterval(() => {
				if (this.buffer || timeout >= 30000) {
					clearInterval(interval);
					return resolve(this.flush_buffer());
				}
				timeout += 250;
			}, 250);
		});
	}

	this.flush_buffer = () => {
		const buff = this.buffer;
		this.buffer = '';
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

	this.io = async (cmd, trigger, callback) => {
		this.flush_buffer();
		await this.stdin(cmd, trigger, callback);
		return await this.get_output();
	}

	this.kill = async () => {
		await wrapper.kill_spawn(this.id);
	}

	this.stdin = async (cmd, trigger, callback) => {
		this._trigger = trigger ?? '';
		this._callback = callback;
		if (this._trigger && !this._callback) { this._trigger = ''; }
		await wrapper.write_to_spawn(this.id, cmd);
	}

	////////////////////////////////////////////////////////////////////////

	window.api.receive('fromSpawn', async (arg) => {
		if (arg.id === this.id) {
			if (arg.success) { this.out = arg.data }
			else { this.error = arg.data; }
			this.buffer += arg.data;
			console.log(arg.data);
			if (this._trigger && this._callback) {
				if (arg.data.includes(this._trigger)) { this._callback(); }
			}
		}
	});

}
