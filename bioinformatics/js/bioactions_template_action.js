///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS TEMPLATE ACTION /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_TEMPLATE = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.records.ncbi_record.proteome_url) {
      this.get_proteome_record()
      .then(() => {
        this.states.TEMPLATE.status = "loading";
        this.update();
      }); // end then
    } // end if (this.records.ncbi_record.proteome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_TEMPLATE = function(options) {
  if (typeof(options) === "undefined") { options = new BioactionOptions; }
  ////////////////////////////////////////////////////////////////////////
  // REMOVE ANY PRE-EXISTING ELEMENTS ////////////////////////////////////
  if (options.element_id) {
    let element_check = document.getElementById(options.element_id);
    if (element_check) {
      while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
      element_check.innerHTML = '';
    } // end if
    else { return; }
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // REGISTER the BIOACTION WITH PARENT OBJECT ///////////////////////////
  const registration = new BioactionRegistration("TEMPLATE", "TEMPLATE_record", "TEMPLATE");
  this.add_registration(registration);
  ////////////////////////////////////////////////////////////////////////
  // CREATE THE STATE ////////////////////////////////////////////////////
  state = new BioactionState("TEMPLATE", 300); // 5 minute delay
  if (options.callback) { state.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { state.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { state.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const skin = options.skin(state.id, this);
  state.skin = skin;
  state.update_record = this.get_TEMPLATE_record;
  this.states.TEMPLATE = state;
  state.skin.update(state);
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'TEMPLATE';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  skin.title.innerHTML = title;
  skin.text.innerHTML = "TEMPLATE DESCRIPTION.";
  skin.button.innerHTML = 'Import <i class="fa fa-angle-right" aria-hidden="true"></i>';
  skin.button.style.display = "none";
  if (skin.organism_name) { skin.organism_name.innerHTML = this.organism_name; }
  if (skin.common_name) {
    if (this.common_name) { skin.common_name.innerHTML = "(" + this.common_name + ")"; }
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE THE ELEMENT //////////////////////////////////////////////
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(skin.area);
    this.html_elements.TEMPLATE = document.getElementById(options.element_id);
    this.html_elements.TEMPLATE.style.display = "block";
  } // end if
  else { document.body.appendChild(skin.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_TEMPLATE();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  skin.button.addEventListener("click", function() {
    skin.button.blur();

  }.bind(this));
  //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
