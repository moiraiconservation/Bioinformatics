///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS CDS_IMPORT //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_cds_import = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.records.ncbi_record) {
      if (this.records.ncbi_record.cds_from_genomic_url) {
        this.states.cds_import.status = "loading";
        this.update();
      } // end if (this.records.ncbi_record.cds_from_genomic_url)
    } // end if (this.records.ncbi_record)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_cds_import = function(options) {
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
  const registration = new BioactionRegistration("cds_import", "cds_record", "cds_import");
  this.add_registration(registration);
  ////////////////////////////////////////////////////////////////////////
  // CREATE THE STATE ////////////////////////////////////////////////////
  state = new BioactionState("CDS import", 300); // 5 minute delay
  if (options.callback) { state.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { state.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { state.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const skin = options.skin(state.id, this);
  state.skin = skin;
  state.update_record = this.get_cds_record;
  this.states.cds_import = state;
  state.skin.update(state);
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Import Gene Sequences';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  skin.title.innerHTML = title;
  skin.text.innerHTML = "The gene sequence file maintained by the National Center for Biotechnology Information (NCBI) contains the complete nucleotide sequences of every currently known gene within this organism.   This files is fairly large, and the process of importing its contents to our local database may take more than an hour depending on your Internet speed.  If the browser tab or window is closed after the importing process has started, any progress will be saved and the process can be resumed from this page.";
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
    this.html_elements.cds_import = document.getElementById(options.element_id);
    this.html_elements.cds_import.style.display = "block";
  } // end if
  else { document.body.appendChild(skin.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_cds_import();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  skin.button.addEventListener("click", function() {
    skin.button.blur();
    this.records.cds_record.metadata.delta_second = 1;
    let cds_obj = new FileGuard;
    cds_obj.data            = "";
    cds_obj.database        = "cds_db";
    cds_obj.file_state      = "erase";
    cds_obj.filename        = cds_obj.id + ".fna.gz";
    cds_obj.num_records     = this.records.cds_record.num_records;
    cds_obj.num_uploaded    = this.records.cds_record.num_uploaded;
    cds_obj.source          = this.records.ncbi_record.refseq.cds_from_genomic_url;
    cds_obj.table           = this.organism_name.replace(/ /g, "_");
    cds_obj.target          = cds_obj.filename;
    if (this.records.ncbi_record.proteome_url_refseq) { cds_obj.options.refseq = this.records.ncbi_record.refseq; }
    else { cds_obj.options.genbank = this.records.ncbi_record.genbank; }
    //////////////////////////////////////////////////////////////////
    // ON BEFORE UNLOAD //////////////////////////////////////////////
    this.states.cds_import.cleanup = function(evt) {
      evt.preventDefault();
      evt.returnValue = null;
      cds_obj.filename = cds_obj.id + ".fna.gz";
      erase_file(cds_obj);
      cds_obj.filename = cds_obj.id + ".fna";
      erase_file(cds_obj);
    };
    window.addEventListener('beforeunload', this.states.cds_import.cleanup);
    //////////////////////////////////////////////////////////////////
    update_metadata(cds_obj)
    .then(import_file)
    .then(decompress_gzip)
    .then(open_file)
    .then(parse_FASTA)
    .then(parse_defline)
    .then(update_metadata)
    .then(d => { this.records.cds_record.num_records = d.num_records; return d; })
    .then(d => FASTA_to_cds_db(d, function(delta) {
      if (typeof(delta) === 'undefined') { delta = 0; }
      this.records.cds_record.num_uploaded = this.records.cds_record.num_uploaded + delta;
      this.records.cds_record.percent_uploaded = Math.floor((this.records.cds_record.num_uploaded / this.records.cds_record.num_records) * 100);
      this.update();
    }.bind(this)))
    .then(() => {
      cds_obj.filename = cds_obj.id + ".fna.gz";
      erase_file(cds_obj);
      cds_obj.filename = cds_obj.id + ".fna";
      erase_file(cds_obj);
    })
    .catch(e => {
      console.log(e);
      if (this.states.cds_import.cleanup) {
        window.removeEventListener('beforeunload', this.states.cds_import.cleanup);
        this.states.cds_import.cleanup = undefined;
      } // end if
      cds_obj.filename = cds_obj.id + ".fna.gz";
      erase_file(cds_obj);
      cds_obj.filename = cds_obj.id + ".fna";
      erase_file(cds_obj);
      hide_loading_box(true);
      create_modal('<div class="center"><h4>Could not import file</h4></div>');
    }); // end catch
  }.bind(this));
  //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_cds_record = function() {
  return new Promise(function(resolve, reject) {
    let obj1 = { };
    let obj2 = { };
    obj1.database   =   'cds_db';
    obj1.table      =   'table_metadata';
    obj1.command    =   'select';
    obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
    obj2.database   =   'cds_db';
    obj2.table      =   this.organism_name.replace(/ /g, '_');
    obj2.command    =   "count";
    let json1 = JSON.stringify(obj1);
    let json2 = JSON.stringify(obj2);
    db_guard(json1)
    .then(responseText => {
      if (responseText) {
        if (this.records.cds_record) { delete this.records.cds_record; }
        this.records.cds_record = new BioactionRecord;
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.records.cds_record.metadata.owner  = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.records.cds_record.num_records             = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.records.cds_record.metadata.year           = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.records.cds_record.metadata.day            = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.records.cds_record.metadata.hour           = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.records.cds_record.metadata.minute         = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.records.cds_record.metadata.second         = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.records.cds_record.metadata.delta_second   = parseInt(db_record.delta_second); }
        if (db_record.options) { this.records.cds_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.records.cds_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.records.cds_record.num_records) {
            this.records.cds_record.percent_uploaded = Math.floor((this.records.cds_record.num_uploaded / this.records.cds_record.num_records) * 100);
            if (this.records.cds_record.percent_uploaded >= 100) { check_bounty("cds_import", "cds_db", this.organism_name, this.organism_name.replace(" ", "_")); }
          } // end if
        } // end if
      } // end if
    })
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////
