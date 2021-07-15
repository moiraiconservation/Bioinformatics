///////////////////////////////////////////////////////////////////////////////
// elements.js ////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function ELEMENT() {
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.create_dropdown_section = () => {
		//////////////////////////////////////////////////////////////////////
		// VARIABLES /////////////////////////////////////////////////////////
		const obj = {};
		obj.diameter = 54;
		obj.stroke_width = 1;
		obj.radius = (obj.diameter / 2) - (obj.stroke_width * 2);
		obj.circumference = obj.radius * 2 * Math.PI;
		const icon_start_x = 0;
		const icon_start_y = 7.33;
		const icon_width = 24;
		const icon_offset_x = (obj.diameter - icon_width) / 2;
		const icon_offset_y = (obj.diameter - icon_width) / 2;
		const id = this.guid();
		//////////////////////////////////////////////////////////////////////
		// CREATE ELEMENTS ///////////////////////////////////////////////////
		const bttn = document.createElement("div");
		const bttn_area = document.createElement("div");
		const bttn_icon = document.createElementNS("http://www.w3.org/2000/svg", "path");
		const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		const section = document.createElement("div");
		const section_area = document.createElement("div");
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		//////////////////////////////////////////////////////////////////////
		// SET THE IDs ///////////////////////////////////////////////////////
		bttn.id = "bttn-" + id;
		bttn_area.id = "bttn-area-" + id;
		section.id = "section-" + id;
		section_area.id = "section-area-" + id;
		//////////////////////////////////////////////////////////////////////
		// SET CLASSES ///////////////////////////////////////////////////////
		bttn.classList.add("dd_section__bttn");
		bttn_area.classList.add("dd_section__bttn_area");
		section.classList.add("dd_section__section");
		section_area.classList.add("dd_section__section_area");
		//////////////////////////////////////////////////////////////////////
		// ADD ATTRIBUTES ////////////////////////////////////////////////////
		bttn.setAttribute('data-state', 'down arrow');
		bttn_icon.setAttribute("fill", '#1B1B1B');
		bttn_icon.setAttribute("stroke", '#1B1B1B');
		bttn_icon.setAttribute("d", "M " + (icon_start_x + icon_offset_x) + " " + (icon_start_y + icon_offset_y) + " l 2.829 -2.83 9.175 9.339 9.167 -9.339 2.829 2.83 -11.996 12.17 z");
		bttn_icon.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
		circle.setAttribute("stroke", '#9496ff');
		circle.setAttribute("stroke-width", obj.stroke_width);
		circle.setAttribute("fill", '#9496ff');
		circle.setAttribute("r", obj.radius);
		circle.setAttribute("cx", (obj.diameter / 2));
		circle.setAttribute("cy", (obj.diameter / 2));
		circle.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
		svg.setAttribute("height", obj.diameter);
		svg.setAttribute("width", obj.diameter);
		svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
		//////////////////////////////////////////////////////////////////////
		// ASSEMBLE ELEMENTS /////////////////////////////////////////////////
		bttn.appendChild(svg);
		bttn_area.appendChild(bttn);
		section_area.appendChild(section);
		svg.appendChild(circle);
		svg.appendChild(bttn_icon);
		//////////////////////////////////////////////////////////////////////
		// CREATE RETURN OBJECT //////////////////////////////////////////////
		obj.bttn = bttn;
		obj.bttn_area = bttn_area;
		obj.bttn_icon = bttn_icon;
		obj.bttn_state = "down arrow";
		obj.id = id;
		obj.section = section;
		obj.section_area = section_area;
		obj.section_max_height = "500px";
		//////////////////////////////////////////////////////////////////////
		// EVENT LISTENER | BUTTON CLICK /////////////////////////////////////
		obj.bttn.addEventListener("click", () => {
			if (obj.bttn_state === "down arrow") {
				bttn_icon.setAttribute("transform", "rotate(180 " + (obj.diameter / 2) + " " + (obj.diameter / 2) + ")");
				obj.bttn_state = "up arrow";
				obj.bttn.setAttribute('data-state', 'up arrow');
				obj.section_area.style.maxHeight = obj.section_max_height;
			}
			else {
				bttn_icon.setAttribute("transform", "rotate(0 " + (obj.diameter / 2) + " " + (obj.diameter / 2) + ")");
				obj.bttn_state = "down arrow";
				obj.bttn.setAttribute('data-state', 'down arrow');
				obj.section_area.style.maxHeight = "0px";
			}
		});
		//////////////////////////////////////////////////////////////////////
		return obj;
	}
  ////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.create_output_terminal = () => {
		const id = this.guid();
		const terminal = document.createElement('div');
		terminal.classList.add('output_terminal');
		terminal.id = 'output_terminal-' + id;
		const obj = {};
		obj.id = id;
		obj.element = terminal;
		obj.line_limit = 400;
		obj.add_line = (line) => {
			const is_at_bottom = obj.element.scrollHeight - obj.element.clientHeight <= obj.element.scrollTop + 1;
			let output = obj.element.innerHTML;
			output += '<p>' + line + '</p>';
			obj.element.innerHTML = output;
			while (obj.element.getElementsByTagName('p').length > obj.line_limit) {
				let children = obj.element.getElementsByTagName('p');
				obj.element.removeChild(children[0]);
			}
			if (is_at_bottom) { obj.element.scrollTop = obj.element.scrollHeight; }
		}
		return obj;
	}
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.guid = () => {
		function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
		return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
	}
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.hide_progress_bar = () => {
		return new Promise((resolve) => {
			if (document.getElementById('progress_bar_area')) {
				document.getElementById('progress_bar_area').style.display = 'none';
			}
			this.wait().then(() => { return resolve(); });
		});
	}
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.hide_spinner = () => {
		return new Promise((resolve) => {
			if (document.getElementById('spinner')) { document.getElementById('spinner').style.display = 'none'; }
			this.wait().then(() => { return resolve(); });
		});
	}
	////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.init = (element) => {
    if (element) {
      const role = element.getAttribute("data-role");
      if (role) {
        switch(role) {
          case "password-toggle": {
            const target_id = element.getAttribute('data-target-id');
            const password = document.getElementById(target_id);
            element.innerHTML = '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
            element.addEventListener('mousedown', () => {
              let password_toggle = parseInt(element.getAttribute("data-toggle"));
              if (password_toggle) {
                password.setAttribute('type', 'password');
                element.setAttribute('data-toggle', "0");
                element.innerHTML = '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
              } // end if
              else {
                password.setAttribute('type', 'text');
                element.setAttribute('data-toggle', "1");
                element.innerHTML = '<i class="fa fa-eye" aria-hidden="true"></i>';
              } // end else
            }); // end event listener
            break;
          } // end case
          default: { console.log("Unrecognized Element Role: " + role); break; }
        } // end switch
      } // end if
    } // end if
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.init_all = () => {
    const elements = document.querySelectorAll('[data-type="element"]');
    for (let i = 0; i < elements.length; i++) {
      this.init(elements[i]);
    } // end for loop
  } // end method
  ////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.progress_bar_is_visible = () => {
		let state = true;
		if (document.getElementById('progress_bar_area').style.display === 'none') { state = false; }
		return state;
	}
	// METHOD //////////////////////////////////////////////////////////////
	this.show_progress_bar = (text, value_now, value_max) => {
		return new Promise((resolve) => {
			if (typeof (text) === 'undefined') { text = ''; }
			if (typeof (value_max) === 'undefined') { value_max = 100; }
			if (typeof (value_now) === 'undefined') { value_now = 0; }
			if (document.getElementById('progress_bar_area')) {
				document.getElementById('progress_bar').setAttribute('aria-valuenow', value_now.toString());
				document.getElementById('progress_bar').setAttribute('aria-valuemax', value_max.toString());
				let width = Math.floor(value_now / value_max);
				document.getElementById('progress_bar').style.width = width.toString() + '%';
				document.getElementById('progress_bar_text').innerHTML = text;
				document.getElementById('progress_bar_area').style.display = 'block';
				document.getElementById('progress_bar_subtitle').innerHTML = '<div class="document document-medium"><div class="center"><p id="progress_bar_subtitle">' + value_now.toLocaleString() + ' out of ' + value_max.toLocaleString() + '</p></div></div>';
				this.wait().then(() => { return resolve(); });
			} // end if
			else {
				const progress = document.createElement('div');
				const progress_bar = document.createElement('div');
				const progress_bar_area = document.createElement('div');
				const progress_bar_close_bttn = document.createElement('button');
				const progress_bar_general = document.createElement('div');
				const progress_bar_subtitle = document.createElement('div');
				const progress_bar_text = document.createElement('div');
				const progress_bar_tile = document.createElement('div');
				progress.id = 'progress';
				progress_bar.id = 'progress_bar';
				progress_bar_area.id = 'progress_bar_area';
				progress_bar_close_bttn.id = 'progress_bar_close_bttn';
				progress_bar_general.id = 'progress_bar_general';
				progress_bar_tile.id = 'progress_bar_tile';
				progress.classList.add('progress');
				progress_bar.classList.add('progress-bar');
				progress_bar_area.classList.add('modal');
				progress_bar_close_bttn.classList.add('close');
				progress_bar_close_bttn.classList.add('close-primary');
				progress_bar_tile.classList.add('modal-tile');
				progress_bar_tile.classList.add('noselect');
				progress_bar.setAttribute('role', 'progressbar');
				progress_bar.setAttribute('aria-valuenow', value_now.toString());
				progress_bar.setAttribute('aria-valuemin', '0');
				progress_bar.setAttribute('aria-valuemax', value_max.toString());
				progress_bar_close_bttn.setAttribute('aria-label', 'close');
				let width = Math.floor((value_now / value_max) * 100);
				progress_bar.style.width = width.toString() + '%';
				progress_bar_area.style.display = 'block';
				progress_bar_close_bttn.innerHTML = '<span aria-hidden="true">&times;</span>';
				progress_bar_text.innerHTML = '<div class="document document-medium"><div class="center"><label id="progress_bar_text">' + text + '</label></div></div>';
				progress_bar_subtitle.innerHTML = '<div class="document document-medium"><div class="center"><p id="progress_bar_subtitle">' + value_now.toLocaleString() + ' out of ' + value_max.toLocaleString() + '</p></div></div>';
				progress.appendChild(progress_bar);
				progress_bar_tile.appendChild(progress_bar_close_bttn);
				progress_bar_tile.appendChild(progress_bar_text);
				progress_bar_tile.appendChild(progress);
				progress_bar_tile.appendChild(progress_bar_subtitle);
				progress_bar_tile.appendChild(progress_bar_general);
				progress_bar_area.appendChild(progress_bar_tile);
				document.body.appendChild(progress_bar_area);
				progress_bar_close_bttn.addEventListener('click', () => { this.hide_progress_bar(); });
			}
			this.wait().then(() => { return resolve(); });
		});
	}
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.show_spinner = () => {
		return new Promise((resolve) => {
			if (document.getElementById('spinner')) { document.getElementById('spinner').style.display = 'block'; }
			else {
				const spinner = document.createElement('div');
				spinner.id = 'spinner';
				spinner.style.display = 'block';
				spinner.innerHTML = '<div class="center"></div><span></span>';
				document.body.appendChild(spinner);
			}
			this.wait().then(() => { return resolve(); });
		});
	}
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.spinner_text = (text) => {
		return new Promise((resolve) => {
			if (document.getElementById('spinner')) {
				document.getElementById("spinner").innerHTML = '<div class="center">' + text + '</div><span></span>';
			}
			else {
				const spinner = document.createElement('div');
				spinner.id = 'spinner';
				spinner.innerHTML = '<div class="center">' + text + '</div><span></span>';
				document.appendChild(spinner);
			}
			this.wait().then(() => { return resolve(); });
		});
	}
	////////////////////////////////////////////////////////////////////////
	// METHOD //////////////////////////////////////////////////////////////
	this.update_progress_bar = (value_update) => {
		return new Promise((resolve) => {
			if (typeof (value_update) === 'undefined') { value_update = 1; }
			if (document.getElementById('progress_bar_area')) {
				const progress_bar = document.getElementById('progress_bar');
				const progress_bar_subtitle = document.getElementById('progress_bar_subtitle');
				let value_max = parseInt(progress_bar.getAttribute('aria-valuemax'));
				let value_now = parseInt(progress_bar.getAttribute('aria-valuenow'));
				value_now = value_now + value_update;
				let width = Math.floor((value_now / value_max) * 100);
				progress_bar.setAttribute('aria-valuenow', value_now);
				progress_bar.style.width = width.toString() + '%';
				progress_bar_subtitle.innerHTML = value_now.toLocaleString() + ' out of ' + value_max.toLocaleString();
			}
			else { this.show_progress_bar('', 100, value_update); }
			this.wait().then(() => { return resolve(); });
		});
	}
	////////////////////////////////////////////////////////////////////////
	this.wait = () => {
		return new Promise((resolve) => {
			setTimeout(() => { return resolve(); }, 10);
		});
	}
//////////////////////////////////////////////////////////////////////////
} // end object
//////////////////////////////////////////////////////////////////////////