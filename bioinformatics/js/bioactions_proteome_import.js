///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS PROTEIN IMPORT //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_proteome_import = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.ncbi_record.proteome_url) {
      this.get_proteome_record()
      .then(() => {
        this.actions.proteome_import.status = "loading";
        this.update();
      }); // end then
    } // end if (this.ncbi_record.proteome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_proteome_import = function(options) {
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
  if (options.callback) { this.actions.proteome_import.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { this.actions.proteome_import.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { this.actions.proteome_import.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const action = options.skin(this.actions.proteome_import.id, this);
  this.actions.proteome_import.skin = action;
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Import Proteins';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  action.title.innerHTML = title;
  action.text.innerHTML = "The protein file maintained by the National Center for Biotechnology Information (NCBI) contains the complete amino acid sequences of every currently known protein made by this organism.   This files is fairly large, and the process of importing its contents to our local database may take more than an hour depending on your Internet speed.  If the browser tab or window is closed after the importing process has started, any progress will be saved and the process can be resumed from this page.";
  action.button.innerHTML = 'Import <i class="fa fa-angle-right" aria-hidden="true"></i>';
  action.button.style.display = "none";
  if (action.organism_name) { action.organism_name.innerHTML = this.organism_name; }
  if (action.common_name) {
    if (this.common_name) { action.common_name.innerHTML = "(" + this.common_name + ")"; }
  } // end if
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(action.area);
    this.html_element.proteome_import = document.getElementById(options.element_id);
    this.html_element.proteome_import.style.display = "block";
  } // end if
  else { document.body.appendChild(action.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_proteome_import();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  action.button.addEventListener("click", function() {
    action.button.blur();
    this.proteome_record.metadata.delta_second = 1;
    let proteome_obj = new FileGuard;
    proteome_obj.data          = "";
    proteome_obj.database      = "proteome_db";
    proteome_obj.file_state    = "erase";
    proteome_obj.filename      = proteome_obj.id + ".fa.gz";
    proteome_obj.num_records   = this.proteome_record.num_records;
    proteome_obj.num_uploaded  = this.proteome_record.num_uploaded;
    proteome_obj.source        = this.ncbi_record.proteome_url;
    proteome_obj.table         = this.organism_name.replace(/ /g, "_");
    proteome_obj.target        = proteome_obj.filename;
    if (this.ncbi_record.proteome_url_refseq) { proteome_obj.options.refseq = this.ncbi_record.refseq; }
    else { proteome_obj.options.genbank = this.ncbi_record.genbank; }
    //////////////////////////////////////////////////////////////////
    // ON BEFORE UNLOAD //////////////////////////////////////////////
    this.actions.proteome_import.cleanup = function(evt) {
      evt.preventDefault();
      hideSpinner();
      evt.returnValue = null;
      proteome_obj.filename = proteome_obj.id + ".fa.gz";
      erase_file(proteome_obj);
      proteome_obj.filename = proteome_obj.id + ".fa";
      erase_file(proteome_obj);
    };
    window.addEventListener('beforeunload', this.actions.proteome_import.cleanup);
    //////////////////////////////////////////////////////////////////
    update_metadata(proteome_obj)
    .then(import_file)
    .then(decompress_gzip)
    .then(open_file)
    .then(parse_FASTA)
    .then(update_metadata)
    .then(d => { this.proteome_record.num_records = d.num_records; return d; })
    .then(d => FASTA_to_db(d, function(delta) {
      if (typeof(delta) === 'undefined') { delta = 0; }
      this.proteome_record.num_uploaded = this.proteome_record.num_uploaded + delta;
      this.proteome_record.percent_uploaded = Math.floor((this.proteome_record.num_uploaded / this.proteome_record.num_records) * 100);
      this.update();
    }.bind(this)))
    .then(() => {
      proteome_obj.filename = proteome_obj.id + ".fa.gz";
      erase_file(proteome_obj);
      proteome_obj.filename = proteome_obj.id + ".fa";
      erase_file(proteome_obj);
    })
    .catch(e => {
      console.log(e);
      if (this.actions.proteome_import.cleanup) {
        window.removeEventListener('beforeunload', this.actions.proteome_import.cleanup);
        this.actions.proteome_import.cleanup = undefined;
      } // end if
      proteome_obj.filename = proteome_obj.id + ".fa.gz";
      erase_file(proteome_obj);
      proteome_obj.filename = proteome_obj.id + ".fa";
      erase_file(proteome_obj);
      hide_loading_box(true);
      create_modal('<div class="center"><h4>Could not import file</h4></div>');
    }); // end catch
  }.bind(this));
  //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
