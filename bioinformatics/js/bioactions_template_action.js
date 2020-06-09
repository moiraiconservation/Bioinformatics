///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS TEMPLATE ACTION /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_TEMPLATE = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.ncbi_record.proteome_url) {
      this.get_proteome_record()
      .then(() => {
        this.actions.TEMPLATE.status = "loading";
        this.update();
      }); // end then
    } // end if (this.ncbi_record.proteome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_TEMPLATE = function(options) {
  if (typeof(options) === "undefined") { options = new BioactionOptions; }
  if (options.element_id) {
    let element_check = document.getElementById(options.element_id);
    if (element_check) {
      while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
      element_check.innerHTML = '';
    } // end if
    else { return; }
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // REGISTER VARIABLES WITH PARENT OBJECT ///////////////////////////////
  if (options.callback) { this.actions.TEMPLATE.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { this.actions.TEMPLATE.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { this.actions.TEMPLATE.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const action = options.skin(this.actions.TEMPLATE.id, this);
  this.actions.TEMPLATE.skin = action;
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'TITLE';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  action.title.innerHTML = title;
  action.text.innerHTML = "DESCRIPTION";
  action.button.innerHTML = 'ACTION <i class="fa fa-angle-right" aria-hidden="true"></i>';
  action.button.style.display = "none";
  if (action.organism_name) { action.organism_name.innerHTML = this.organism_name; }
  if (action.common_name) {
    if (this.common_name) { action.common_name.innerHTML = "(" + this.common_name + ")"; }
  } // end if
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(action.area);
    this.html_element.TEMPLATE = document.getElementById(options.element_id);
    this.html_element.TEMPLATE.style.display = "block";
  } // end if
  else { document.body.appendChild(action.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_TEMPLATE();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  action.button.addEventListener("click", function() {
    action.button.blur();

  }.bind(this));
  //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
