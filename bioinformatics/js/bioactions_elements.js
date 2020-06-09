///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS ELEMENTS ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_dropdown_section = function(id, self) {
  if (typeof(id) === "undefined") { id = guid(); }
  if (typeof(self) === "undefined") { self = this; }
  ////////////////////////////////////////////////////////////////////////
  // VARIABLES ///////////////////////////////////////////////////////////
  const obj = { };
  obj.diameter = 54;
  obj.stroke_width = 1;
  obj.radius = (obj.diameter / 2) - (obj.stroke_width * 2);
  obj.circumference = obj.radius * 2 * Math.PI;
  const icon_start_x = 0;
  const icon_start_y = 7.33;
  const icon_width = 24;
  const icon_offset_x = (obj.diameter - icon_width) / 2;
  const icon_offset_y = (obj.diameter - icon_width) / 2;
  ////////////////////////////////////////////////////////////////////////
  // CREATE ELEMENTS /////////////////////////////////////////////////////
  const bttn          = document.createElement("div");
  const bttn_area     = document.createElement("div");
  const bttn_icon     = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const circle        = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  const section       = document.createElement("div");
  const section_area  = document.createElement("div");
  const svg           = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  ////////////////////////////////////////////////////////////////////////
  // SET THE IDs /////////////////////////////////////////////////////////
  bttn.id         = "bttn-" + self.id + "-" + id;
  bttn_area.id    = "bttn-area-" + self.id + "-" + id;
  section.id      = "section-" + self.id + "-" + id;
  section_area.id = "section-area-" + self.id + "-" + id;
  ////////////////////////////////////////////////////////////////////////
  // SET CLASSES /////////////////////////////////////////////////////////
  bttn.classList.add("dd_section__bttn");
  bttn_area.classList.add("dd_section__bttn_area");
  section.classList.add("dd_section__section");
  section_area.classList.add("dd_section__section_area");
  ///////////////////////////////////////////////////////
  // ADD ATTRIBUTES /////////////////////////////////////
  bttn_icon.setAttribute("fill", theme["text"]["base"]["light"]);
  bttn_icon.setAttribute("stroke", theme["text"]["base"]["light"]);
  bttn_icon.setAttribute("d", "M " + (icon_start_x + icon_offset_x) + " " + (icon_start_y + icon_offset_y) + " l 2.829 -2.83 9.175 9.339 9.167 -9.339 2.829 2.83 -11.996 12.17 z");
  bttn_icon.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
  circle.setAttribute("stroke", theme['base']['foundation']);
  circle.setAttribute("stroke-width", obj.stroke_width);
  circle.setAttribute("fill", theme["base"]["foundation"]);
  circle.setAttribute("r", obj.radius);
  circle.setAttribute("cx", (obj.diameter / 2));
  circle.setAttribute("cy", (obj.diameter / 2));
  circle.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
  svg.setAttribute("height", obj.diameter);
  svg.setAttribute("width", obj.diameter);
  svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
  ////////////////////////////////////////////////////////////////////////
  // ASSEMBLE ELEMENTS ///////////////////////////////////////////////////
  bttn.appendChild(svg);
  bttn_area.appendChild(bttn);
  section_area.appendChild(section);
  svg.appendChild(circle);
  svg.appendChild(bttn_icon);
  ////////////////////////////////////////////////////////////////////////
  // CREATE RETURN OBJECT ////////////////////////////////////////////////
  obj.bttn = bttn;
  obj.bttn_area = bttn_area;
  obj.bttn_icon = bttn_icon;
  obj.bttn_state = "down arrow";
  obj.id = id;
  obj.section = section;
  obj.section_area = section_area;
  obj.section_max_height = "500px";
  obj.self_id = self.id;
  ////////////////////////////////////////////////////////////////////////
  // EVENT LISTENER | BUTTON CLICK ///////////////////////////////////////
  obj.bttn.addEventListener("click", () => {
    if (obj.bttn_state === "down arrow") {
      bttn_icon.setAttribute("transform", "rotate(180 " + (obj.diameter / 2) + " " + (obj.diameter / 2)  + ")");
      obj.bttn_state = "up arrow";
      obj.section_area.style.maxHeight = obj.section_max_height;
    } // end if
    else {
      bttn_icon.setAttribute("transform", "rotate(0 " + (obj.diameter / 2) + " " + (obj.diameter / 2)  + ")");
      obj.bttn_state = "down arrow";
      obj.section_area.style.maxHeight = "0px";
    } // end else
  }); // end event listener
  ////////////////////////////////////////////////////////////////////////
  return obj;
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_organism_input = function(callback) {
  let id                  =   guid();
  let area                =   document.createElement("div");
  let card                =   document.createElement("div");
  let input               =   document.createElement("input");
  let card_center         =   document.createElement("div");
  let common_center       =   document.createElement("div");
  let w100                =   document.createElement("div");
  let br1                 =   document.createElement("br");
  let br2                 =   document.createElement("br");
  let common              =   document.createElement("div");
  let bttn_center         =   document.createElement("div");
  let bttn                =   document.createElement("button");
  area.id                 =   "area-"  + this.id + "-" + id;
  card.id                 =   "card-"  + this.id + "-" + id;
  input.id                =   "input-" + this.id + "-" + id;
  bttn.id                 =   "bttn-"  + this.id + "-" + id;
  area.style.width        =   "100%";
  w100.style.width        =   "100%";
  input.style.lineHeight  =   "default";
  input.style.textAlign   =   "center";
  bttn.style.position     =   "relative";
  bttn.style.top          =   "6px";
  bttn.style.left         =   "181px";
  bttn.style.marginBottom =   "-46px";
  bttn.classList.add("bttn");
  bttn.classList.add("bttn-bottom-right-corner");
  area.classList.add("autocomplete");
  card_center.classList.add("center");
  bttn_center.classList.add("center");
  common_center.classList.add("center");
  card.classList.add("dashed-card");
  input.classList.add("input-invisible");
  input.classList.add("input-centered");
  common.classList.add("document");
  w100.classList.add("document");
  input.setAttribute("placeholder", "Type organism name");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", "false");
  bttn.innerHTML = '<i class="fa fa-search" aria-hidden="true"></i>';
  area.appendChild(card_center);
  card_center.appendChild(card);
  card.appendChild(br1);
  card.appendChild(br2);
  card.appendChild(w100);
  w100.appendChild(input);
  card.appendChild(bttn_center);
  bttn_center.appendChild(bttn);
  card.appendChild(common_center);
  common_center.appendChild(common);
  let obj         =   { };
  obj.id          =   id;
  obj.area        =   area;
  obj.card        =   card;
  obj.input       =   input;
  obj.common_name =   common;
  obj.bttn        =   bttn;
  obj.callback    =   callback;
  ////////////////////////////////////////////////////////////////////////
  // EVENT LISTENER //////////////////////////////////////////////////////
  card.addEventListener("click", function() { input.focus(); });
  ////////////////////////////////////////////////////////////////////////
  // EVENT LISTENER //////////////////////////////////////////////////////
  input.addEventListener("focus", function() {
    card.style.border = "1px solid " + theme['primary']['light'];
    card.style.boxShadow = "0 0 3px " + theme['primary']['light'];
    card.style.mozBoxShadow = "0 0 3px " + theme['primary']['light'];
    card.style.webkitBoxShadow = "0 0 3px " + theme['primary']['light'];
    bttn.style.border = "1px solid " + theme['primary']['light'];
    bttn.style.boxShadow = "0 0 3px " + theme['primary']['light'];
    bttn.style.mozBoxShadow = "0 0 3px " + theme['primary']['light'];
    bttn.style.webkitBoxShadow = "0 0 3px " + theme['primary']['light'];
    this.last_focus = this.id + "-" + id;
  }); // end event listener
  ////////////////////////////////////////////////////////////////////////
  // EVENT LISTENER //////////////////////////////////////////////////////
  input.addEventListener("blur", function() {
    if (input.value == "") { card.style.border = ""; }
    else { card.style.border = "2px solid " + theme['base']['dark']; }
    card.style.boxShadow = "";
    card.style.mozBoxShadow = "";
    card.style.webkitBoxShadow = "";
    bttn.style.border = "";
    bttn.style.boxShadow = "";
    bttn.style.mozBoxShadow = "";
    bttn.style.webkitBoxShadow = "";
  }); // end event listener
  ////////////////////////////////////////////////////////////////////////
  // EVENT LISTENER //////////////////////////////////////////////////////
  input.addEventListener("keydown", function(event) {
    if ((event.key === "Enter") || (event.key === "Tab")) {
      setTimeout(() => {
        this.resolve_organism_name(input.value)
        .then(resolved => {
          this.reset();
          if (resolved.scientific) { input.value = this.format_organism_name(resolved.scientific); }
          if (resolved.common_name) { common.innerHTML = '(' + resolved.common_name+ ')'; }
          else { common.innerHTML = ''; }
          if (bttn.style.display !== "none") { bttn.focus(); }
        }, 100);
      }); //end then
    } // end if ((event.key === "Enter") || (event.key === "Tab"))
    if ((event.key === "Backspace") || (event.key === "Delete")) {
        common.innerHTML = "";
    } // end if
  }.bind(this)); // end event listener
  ////////////////////////////////////////////////////////////////////////
  // EVENT LISTENER //////////////////////////////////////////////////////
  input.addEventListener("blur", function(event) {
    this.resolve_organism_name(input.value)
    .then(resolved => {
      if (resolved.scientific) { input.value = this.format_organism_name(resolved.scientific); }
      if (resolved.common_name) { common.innerHTML = '(' + resolved.common_name+ ')'; }
      else { common.innerHTML = ''; }
    }); //end then
  }.bind(this)); // end event listener
  ////////////////////////////////////////////////////////////////////////
  // EVENT LISTENER //////////////////////////////////////////////////////
  bttn.addEventListener("click", function() {
    showSpinner();
    input.blur();
    bttn.blur();
    this.reset_last_focus();
    this.resolve_organism_name(input.value)
    .then(resolved => {
      this.reset();
      if (resolved.scientific) { input.value = this.format_organism_name(resolved.scientific); }
      if (resolved.common_name) {
        common.innerHTML = '(' + resolved.common_name+ ')';
      } // end if
      else { common.innerHTML = ''; }
      if (callback) { hideSpinner(); callback(input.value, resolved.common_name, obj); }
    }); //end then
  }.bind(this)); // end event listener
  ////////////////////////////////////////////////////////////////////////
  return obj;
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_output_terminal = function(id) {
  if (typeof(id) === 'undefined') { id = guid(); }
  const terminal = document.createElement("div");
  terminal.classList.add("output_terminal");
  terminal.id = "output_terminal-" + id;
  const obj = { };
  obj.id = id;
  obj.element = terminal;
  obj.line_limit = 400;
  obj.add_line = (line) => {
    const is_at_bottom = obj.element.scrollHeight - obj.element.clientHeight <= obj.element.scrollTop + 1;
    let output = obj.element.innerHTML;
    output += "<p>" + line + "</p>";
    obj.element.innerHTML = output;
    while (obj.element.getElementsByTagName("p").length > obj.line_limit) {
      let children = obj.element.getElementsByTagName("p");
      obj.element.removeChild(children[0]);
    } // end while
    if (is_at_bottom) { obj.element.scrollTop = obj.element.scrollHeight; }
  } // end method
  return obj;
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_tile = function(id) {
  if (typeof(id) === 'undefined') { id = guid(); }
  let area    =   document.createElement("div");
  let tile    =   document.createElement("div");
  area.id     =   "area-" + this.id + "-" + id;
  tile.id     =   "tile-" + this.id + "-" + id;
  tile.style.minHeight = "150px";
  tile.classList.add("tile");
  area.appendChild(tile);
  let obj = { };
  obj.id = id;
  obj.area = area;
  obj.tile = tile;
  return obj;
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.default_skin = function(id, self) {
  ////////////////////////////////////////////////////////////////////////
  // This function creates a standard action tile.  An id variable can
  // be supplied to differentiate this action tile if more than one
  // action tile is needed per page.
  // An object with the following elements is returned:
  //  obj.area        <-- the HTML element of the action
  //  obj.tile        <-- the HTML element of the action tile
  //  obj.title       <-- set innerHTML to change the title
  //  obj.text        <-- set innerHTML to change the expandable text
  //  obj.metadata    <-- set the innerHTML to change the displayed metadata
  //  obj.button      <-- the HTML element of the button.  Set innerHTML to change the button text.  Add an event listener to create a behavior
  //  obj.status      <-- the HTML element of the status text (shown below the button)
  //  obj.update      <-- a function for updating the HTML elements based on changing states (takes a BioactionState object)
  ////////////////////////////////////////////////////////////////////////
  if (typeof(id) === 'undefined') { id = guid(); }
  if (typeof(self) === "undefined") { self = this; }
  const area          = document.createElement("div");
  const tile          = document.createElement("div");
  const text_area     = document.createElement("div");
  const action_area   = document.createElement("div");
  const left_column   = document.createElement("div");
  const middle_column = document.createElement("div");
  const right_column  = document.createElement("div");
  const title_area    = document.createElement("div");
  const title         = document.createElement("b");
  const expand        = document.createElement("div");
  const details       = document.createElement("details");
  const summary       = document.createElement("summary");
  const blockquote    = document.createElement("blockquote");
  const button_area   = document.createElement("div");
  const button        = document.createElement("button");
  const status        = document.createElement("div");
  const row           = document.createElement("div");
  const h4            = document.createElement("h4");
  const text          = document.createElement("p");
  const metadata      = document.createElement("p");
  const option        = document.createElement("div");
  const center        = document.createElement("div");
  const button_center = document.createElement("div");
  area.id             = "area-"         + self.id + "-" + id;
  tile.id             = "tile-"         + self.id + "-" + id;
  title.id            = "title-"        + self.id + "-" + id;
  expand.id           = "expand-"       + self.id + "-" + id;
  button_area.id      = "button-area-"  + self.id + "-" + id;
  status.id           = "status-"       + self.id + "-" + id;
  button.id           = "button-"       + self.id + "-" + id;
  text.id             = "text-"         + self.id + "-" + id;
  text_area.id        = "text-area-"    + self.id + "-" + id;
  metadata.id         = "metadata-"     + self.id + "-" + id;
  option.id           = "option-"       + self.id + "-" + id;
  tile.style.minHeight = "150px";
  button.style.marginBottom = "10px";
  metadata.style.color = "gray";
  tile.classList.add("tile");
  button.classList.add("bttn");
  button.classList.add("bttn-primary");
  row.classList.add("row");
  left_column.classList.add("col-xl-6");
  left_column.classList.add("col-lg-6");
  left_column.classList.add("col-md-6");
  left_column.classList.add("col-sm-12");
  left_column.classList.add("col-xs-12");
  middle_column.classList.add("col-xl-3");
  middle_column.classList.add("col-lg-3");
  middle_column.classList.add("col-md-3");
  middle_column.classList.add("col-sm-12");
  middle_column.classList.add("col-xs-12");
  right_column.classList.add("col-xl-3");
  right_column.classList.add("col-lg-3");
  right_column.classList.add("col-md-3");
  right_column.classList.add("col-sm-12");
  right_column.classList.add("col-xs-12");
  center.classList.add("center");
  button_center.classList.add("center");
  title.innerHTML   = "Title";
  text.innerHTML    = "text";
  button.innerHTML  = "button";
  area.appendChild(tile);
  tile.appendChild(row);
  row.appendChild(left_column);
  row.appendChild(middle_column);
  row.appendChild(right_column);
  left_column.appendChild(text_area);
  text_area.appendChild(title_area);
  title_area.appendChild(h4);
  h4.appendChild(title);
  text_area.appendChild(expand);
  expand.appendChild(details);
  details.appendChild(summary);
  details.appendChild(blockquote);
  blockquote.appendChild(text);
  blockquote.appendChild(metadata);
  middle_column.appendChild(option);
  right_column.appendChild(button_area);
  button_area.appendChild(button_center);
  button_center.appendChild(button);
  button_area.appendChild(center);
  center.appendChild(status);
  const obj = { };
  obj.id = id;
  obj.area = area;
  obj.tile = tile;
  obj.title = title;
  obj.text = text;
  obj.metadata = metadata;
  obj.option = option;
  obj.button = button;
  obj.status = status;
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  obj.update = function(action) {
    switch(action.status) {
      case "button": {
        button.style.display = "block";
        option.style.display = "block";
        status.innerHTML = '<p class="standard-text" style="color: gray;">' + action.percent_complete + '% complete</p>';
        status.style.display = "";
        tile.style.color = "";
        break;
      } // end case "button"
      case "inactive": {
        button.style.display = "none";
        status.style.display = "none";
        tile.style.color = theme["base"]["dark"];
        break;
      } // end case "inactive"
      case "locked": {
        button.style.display = "none";
        let lock_text  =  '<br><div class="document ellipsis"><i class="fa fa-lock" aria-hidden="true"></i> ';
        lock_text     +=  'Locked <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + this.locked_tooltip + '"></span></div>';
        lock_text     +=  '<p class="standard-text" style="color: gray;">' + action.percent_complete + '% complete</p>';
        option.style.display = "none";
        status.innerHTML = lock_text;
        tile.style.color = "";
        $('[data-toggle="tooltip"]').tooltip();
        break;
      } // end case "locked"
      case "complete": {
        button.style.display = "none";
        metadata.innerHTML = "Completed: " + action.date;
        status.innerHTML = '<p class="color-primary-foundation standard-text"><b>100% complete</b></p>';
        status.style.display = "";
        tile.style.color = "";
        break;
      } // end case "complete"
      default: { break; }
    } // end switch
  } // end function
  ////////////////////////////////////////////////////////////////////////
  return obj;
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.slim_skin = (id, self) => {
  if (typeof(id) === 'undefined') { id = guid(); }
  if (typeof(self) === "undefined") { self = this; }
  ////////////////////////////////////////////////////////////////////////
  // CREATE ELEMENTS /////////////////////////////////////////////////////
  const area          = document.createElement("div");
  const button        = document.createElement("div");
  const column_1      = document.createElement("div");
  const column_2      = document.createElement("div");
  const column_3      = document.createElement("div");
  const column_4      = document.createElement("div");
  const common_name   = document.createElement("p");
  const dd            = self.create_dropdown_section(id, self);
  const lock          = document.createElement("div");
  const lock_bar      = document.createElement("span");
  const lock_text     = document.createElement("p");
  const metadata      = document.createElement("p");
  const option        = document.createElement("div");
  const option_toggle = document.createElement("div");
  const organism_name = document.createElement("p");
  const row           = document.createElement("div");
  const status        = document.createElement("div");
  const text          = document.createElement("p");
  const tile          = document.createElement("div");
  const title         = document.createElement("p");
  const progress_ring = create_status_progress_ring();
  ////////////////////////////////////////////////////////////////////////
  // SET THE IDs /////////////////////////////////////////////////////////
  area.id           = "area-"           + self.id + "-" + id;
  button.id         = "button-"         + self.id + "-" + id;
  lock.id           = "lock-"           + self.id + "-" + id;
  lock_bar.id       = "lock-bar-"       + self.id + "-" + id;
  lock_text.id      = "lock-text-"      + self.id + "-" + id;
  metadata.id       = "metadata-"       + self.id + "-" + id;
  option.id         = "option-"         + self.id + "-" + id;
  option_toggle.id  = "option-toggle-"  + self.id + "-" + id;
  status.id         = "status-"         + self.id + "-" + id;
  text.id           = "text-"           + self.id + "-" + id;
  tile.id           = "tile-"           + self.id + "-" + id;
  title.id          = "title-"          + self.id + "-" + id;
  ////////////////////////////////////////////////////////////////////////
  // SET CLASSES /////////////////////////////////////////////////////////
  button.classList.add("bttn");
  button.classList.add("bttn-primary");
  column_1.classList.add("col-xl-1");
  column_1.classList.add("col-lg-1");
  column_1.classList.add("col-md-1");
  column_1.classList.add("col-sm-2");
  column_1.classList.add("col-xs-2");
  column_2.classList.add("col-xl-7");
  column_2.classList.add("col-lg-7");
  column_2.classList.add("col-md-6");
  column_2.classList.add("col-sm-5");
  column_2.classList.add("col-xs-4");
  column_3.classList.add("col-xl-2");
  column_3.classList.add("col-lg-2");
  column_3.classList.add("col-md-2");
  column_3.classList.add("col-sm-2");
  column_3.classList.add("col-xs-2");
  column_4.classList.add("col-xl-2");
  column_4.classList.add("col-lg-2");
  column_4.classList.add("col-md-3");
  column_4.classList.add("col-sm-3");
  column_4.classList.add("col-xs-4");
  common_name.classList.add("slim_skin__common_name");
  lock.classList.add("slim_skin__lock");
  lock_bar.classList.add("slim_skin__lock_bar");
  metadata.classList.add("slim_skin__metadata");
  option.classList.add("slim_skin__option");
  option_toggle.classList.add("slim_skin__option_toggle");
  organism_name.classList.add("slim_skin__organism_name");
  row.classList.add("row");
  tile.classList.add("slim_skin__tile");
  title.classList.add("slim_skin__title");
  ////////////////////////////////////////////////////////////////////////
  // CREATE INNER HTML CONTENT ///////////////////////////////////////////
  lock_text.innerHTML = '<div class="center"><p><i class="fa fa-lock" aria-hidden="true"></i> Locked <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="This record is either in the process of being updated by another user, or this record was last updated recently and needs a few minutes to reset.  Unlocking will occur automatically when the proper records are available.  You do not need to reload the page."></span></p></div>';
  $('[data-toggle="tooltip"]').tooltip();
  ////////////////////////////////////////////////////////////////////////
  // ASSEMBLE ELEMENTS ///////////////////////////////////////////////////
  area.appendChild(tile);
  dd.section_area.appendChild(option);
  tile.appendChild(row);
  tile.appendChild(dd.section_area);
  row.appendChild(column_1);
  row.appendChild(column_2);
  row.appendChild(column_3);
  row.appendChild(column_4);
  column_1.appendChild(status);
  column_2.appendChild(title);
  column_2.appendChild(organism_name);
  column_2.appendChild(common_name);
  column_2.appendChild(metadata);
  column_3.appendChild(option_toggle);
  column_4.appendChild(button);
  column_4.appendChild(lock_text);
  column_4.appendChild(lock);
  lock.appendChild(lock_bar);
  status.appendChild(progress_ring.svg);
  ////////////////////////////////////////////////////////////////////////
  // CREATE RETURN OBJECT ////////////////////////////////////////////////
  const obj = { };
  obj.area = area;
  obj.button = button;
  obj.common_name = common_name;
  obj.dd = dd;
  obj.id = id;
  obj.lock = lock;
  obj.lock_bar = lock_bar;
  obj.lock_text = lock_text;
  obj.metadata = metadata;
  obj.option = option;
  obj.option_toggle = option_toggle;
  obj.organism_name = organism_name;
  obj.status = status;
  obj.text = text;
  obj.self_id = self.id;
  obj.tile = tile;
  obj.title = title;
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  obj.update = function(action) {
    set_status_progress_ring(progress_ring, action.percent_complete);
    switch(action.status) {
      case "button": {
        this.button.style.display = "";
        this.lock.style.display = "none";
        this.lock_text.style.display = "none";
        this.metadata.style.display = "";
        this.option.style.display = "";
        this.option_toggle.style.display = "";
        this.status.style.display = "";
        this.tile.style.color = "";
        break;
      } // end case
      case "complete": {
        this.button.style.display = "none";
        this.lock.style.display = "none";
        this.lock_text.style.display = "none";
        this.metadata.style.display = "";
        this.option.style.display = "none";
        this.option_toggle.style.display = "none";
        this.status.style.display = "";
        this.tile.style.color = "";
        this.metadata.innerHTML = "Completed: " + action.date;
        break;
      } // end case
      case "inactive": {
        this.button.style.display = "none";
        this.lock.style.display = "none";
        this.lock_text.style.display = "none";
        this.metadata.style.display = "";
        this.option.style.display = "none";
        this.option_toggle.style.display = "none";
        this.status.style.display = "none";
        this.tile.style.color = theme["base"]["dark"];
        break;
      } // end case
      case "loading": {
        this.button.style.display = "none";
        this.lock.style.display = "none";
        this.lock_text.style.display = "none";
        this.metadata.style.display = "none";
        this.option.style.display = "none";
        this.option_toggle.style.display = "none";
        this.status.style.display = "none";
        this.tile.style.color = "";
        break;
      } // end case "loading"
      case "locked": {
        this.button.style.display = "none";
        this.lock.style.display = "";
        this.lock_bar.style.width = (((action.lock_delay - action.delta_second) / action.lock_delay) * 100) + "%";
        this.lock_text.style.display = "";
        this.metadata.style.display = "";
        this.option.style.display = "";
        this.option_toggle.style.display = "none";
        this.status.style.display = "";
        this.tile.style.color = "";
        break;
      } // end case
      default: {break; }
    } // end switch
  } // end function
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  function create_status_progress_ring() {
    ///////////////////////////////////////////////////////
    // VARIABLES //////////////////////////////////////////
    const obj = { };
    obj.diameter = 54;
    obj.stroke_width = 4;
    obj.radius = (obj.diameter / 2) - (obj.stroke_width * 2);
    obj.circumference = obj.radius * 2 * Math.PI;
    ///////////////////////////////////////////////////////
    // CREATE ELEMENTS ////////////////////////////////////
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ///////////////////////////////////////////////////////
    // ADD CLASSES ////////////////////////////////////////
    circle.classList.add("slim_skin__progress_ring__circle");
    svg.classList.add("slim_skin__progress_ring");
    ///////////////////////////////////////////////////////
    // ADD STYLES /////////////////////////////////////////
    circle.style.strokeDasharray = obj.circumference + " " + obj.circumference;
    circle.style.strokeDashoffset = obj.circumference;
    text.classList.add("noselect");
    ///////////////////////////////////////////////////////
    // ADD ATTRIBUTES /////////////////////////////////////
    circle.setAttribute("stroke", theme['primary']['foundation']);
    circle.setAttribute("stroke-width", obj.stroke_width);
    circle.setAttribute("fill", "transparent");
    circle.setAttribute("r", obj.radius);
    circle.setAttribute("cx", (obj.diameter / 2));
    circle.setAttribute("cy", (obj.diameter / 2));
    circle.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute("height", obj.diameter);
    svg.setAttribute("width", obj.diameter);
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    text.setAttribute("x", "50%");
    text.setAttribute("y", "50%");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("alignment-baseline", "middle");
    text.setAttribute("font-size", "smaller");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("fill", "black");
    text.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    track.setAttribute("stroke", theme['base']['dark']);
    track.setAttribute("stroke-width", obj.stroke_width);
    track.setAttribute("fill", "transparent");
    track.setAttribute("r", obj.radius);
    track.setAttribute("cx", (obj.diameter / 2));
    track.setAttribute("cy", (obj.diameter / 2));
    track.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    ///////////////////////////////////////////////////////
    // CONSTRUCT DOM ELEMENT //////////////////////////////
    svg.appendChild(track);
    svg.appendChild(circle);
    svg.appendChild(text);
    obj.circle = circle;
    obj.svg = svg;
    obj.text = text;
    return obj;
  } // end function
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  function set_status_progress_ring(obj, percent) {
    if (!obj.checkmark) {
      const offset = obj.circumference - percent / 100 * obj.circumference;
      obj.circle.style.strokeDashoffset = offset;
      obj.text.innerHTML = Math.round(percent) + "%";
      if (percent >= 100) {
        obj.circle.setAttribute("fill", theme['primary']['foundation']);
        obj.text.innerHTML = "";
        const check = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const check_start_x = 20.285;
        const check_start_y = 2;
        const check_width = 24;
        const check_offset = (obj.diameter - check_width) / 2;
        check.setAttribute("fill", "white");
        check.setAttribute("stroke", "white");
        check.setAttribute("d", "M " + (check_start_x + check_offset) + " " + (check_start_y + check_offset) + " l -11.285 11.567 -5.286 -5.011 -3.714 3.716 9 8.728 15 -15.285 z");
        check.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        obj.svg.appendChild(check);
        obj.checkmark = check;
      } // end if
    } // end if (!obj.checkmark)
  } // end function
  ////////////////////////////////////////////////////////////////////////
  // EVENT LISTENER //////////////////////////////////////////////////////
  obj.option.addEventListener('DOMSubtreeModified', () => {
    obj.option_toggle.appendChild(obj.dd.bttn);
  }); // end event listener
  return obj;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
