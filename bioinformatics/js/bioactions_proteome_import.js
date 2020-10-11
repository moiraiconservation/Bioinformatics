///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS PROTEIN IMPORT //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_proteome_import = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.records.ncbi_record.proteome_url) {
      this.get_proteome_record()
      .then(() => {
        this.states.proteome_import.status = "loading";
        this.update();
      }); // end then
    } // end if (this.records.ncbi_record.proteome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_proteome_import = function(options) {
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
  const registration = new BioactionRegistration("proteome_import", "proteome_record", "proteome_import");
  this.add_registration(registration);
  ////////////////////////////////////////////////////////////////////////
  // CREATE THE STATE ////////////////////////////////////////////////////
  state = new BioactionState("proteome import", 300); // 5 minute delay
  if (options.callback) { state.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { state.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { state.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const skin = options.skin(state.id, this);
  state.skin = skin;
  state.update_record = this.get_proteome_record;
  this.states.proteome_import = state;
  state.skin.update(state);
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Import Proteins';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  skin.title.innerHTML = title;
  skin.text.innerHTML = "The protein file maintained by the National Center for Biotechnology Information (NCBI) contains the complete amino acid sequences of every currently known protein made by this organism.   This files is fairly large, and the process of importing its contents to our local database may take more than an hour depending on your Internet speed.  If the browser tab or window is closed after the importing process has started, any progress will be saved and the process can be resumed from this page.";
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
    this.html_elements.proteome_import = document.getElementById(options.element_id);
    this.html_elements.proteome_import.style.display = "block";
  } // end if
  else { document.body.appendChild(skin.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_proteome_import();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  skin.button.addEventListener("click", function() {
    log_user("Task", "Started importing proteome for " + this.organism_name);
    skin.button.blur();
    this.records.proteome_record.metadata.delta_second = 1;
    let proteome_obj = new FileGuard;
    proteome_obj.data          = "";
    proteome_obj.database      = "proteome_db";
    proteome_obj.file_state    = "erase";
    proteome_obj.filename      = proteome_obj.id + ".fa.gz";
    proteome_obj.num_records   = this.records.proteome_record.num_records;
    proteome_obj.num_uploaded  = this.records.proteome_record.num_uploaded;
    proteome_obj.source        = this.records.ncbi_record.proteome_url;
    proteome_obj.table         = this.organism_name.replace(/ /g, "_");
    proteome_obj.target        = proteome_obj.filename;
    if (this.records.ncbi_record.proteome_url_refseq) { proteome_obj.options.refseq = this.records.ncbi_record.refseq; }
    else { proteome_obj.options.genbank = this.records.ncbi_record.genbank; }
    //////////////////////////////////////////////////////////////////
    // ON BEFORE UNLOAD //////////////////////////////////////////////
    this.states.proteome_import.cleanup = function(evt) {
      evt.preventDefault();
      hideSpinner();
      evt.returnValue = null;
      proteome_obj.filename = proteome_obj.id + ".fa.gz";
      erase_file(proteome_obj);
      proteome_obj.filename = proteome_obj.id + ".fa";
      erase_file(proteome_obj);
    };
    window.addEventListener('beforeunload', this.states.proteome_import.cleanup);
    //////////////////////////////////////////////////////////////////
    update_metadata(proteome_obj)
    .then(import_file)
    .then(decompress_gzip)
    .then(open_file)
    .then(parse_FASTA)
    .then(update_metadata)
    .then(d => { this.records.proteome_record.num_records = d.num_records; return d; })
    .then(d => FASTA_to_db(d, function(delta) {
      if (typeof(delta) === 'undefined') { delta = 0; }
      this.records.proteome_record.num_uploaded = this.records.proteome_record.num_uploaded + delta;
      this.records.proteome_record.percent_uploaded = Math.floor((this.records.proteome_record.num_uploaded / this.records.proteome_record.num_records) * 100);
      this.update();
    }.bind(this)))
    .then(() => {
      proteome_obj.filename = proteome_obj.id + ".fa.gz";
      erase_file(proteome_obj);
      proteome_obj.filename = proteome_obj.id + ".fa";
      erase_file(proteome_obj);
      log_user("Task", "Finished importing proteome for " + this.organism_name);
    })
    .catch(e => {
      console.log(e);
      if (this.states.proteome_import.cleanup) {
        window.removeEventListener('beforeunload', this.states.proteome_import.cleanup);
        this.states.proteome_import.cleanup = undefined;
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
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_proteome_record = function() {
  return new Promise(function(resolve, reject) {
    let obj1 = { };
    let obj2 = { };
    obj1.database   =   'proteome_db';
    obj1.table      =   'table_metadata';
    obj1.command    =   'select';
    obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
    obj2.database   =   'proteome_db';
    obj2.table      =   this.organism_name.replace(/ /g, '_');
    obj2.command    =   "count";
    let json1 = JSON.stringify(obj1);
    let json2 = JSON.stringify(obj2);
    db_guard(json1)
    .then(responseText => {
      if (responseText) {
        if (this.records.proteome_record) { delete this.records.proteome_record; }
        this.records.proteome_record = new BioactionRecord;
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.records.proteome_record.metadata.owner         = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.records.proteome_record.num_records            = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.records.proteome_record.metadata.year          = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.records.proteome_record.metadata.day           = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.records.proteome_record.metadata.hour          = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.records.proteome_record.metadata.minute        = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.records.proteome_record.metadata.second        = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.records.proteome_record.metadata.delta_second  = parseInt(db_record.delta_second); }
        if (db_record.options) { this.records.proteome_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.records.proteome_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.records.proteome_record.num_records) {
            this.records.proteome_record.percent_uploaded = Math.floor((this.records.proteome_record.num_uploaded / this.records.proteome_record.num_records) * 100);
            if (this.records.proteome_record.percent_uploaded >= 100) { check_bounty("proteome_import", "proteome_db", this.organism_name, this.organism_name.replace(" ", "_")); }
          } // end if
        } // end if
      } // end if
    })
    .then(() => {
      this.update();
      resolve();
    }); // end then
  }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////
