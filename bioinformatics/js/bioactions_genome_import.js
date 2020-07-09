///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS GENOME_IMPORT ///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_genome_import = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.records.ncbi_record.genome_url) {
      this.get_genome_record()
      .then(() => {
        this.states.genome_import.status = "loading";
        this.update();
      }); // end then
    } // end if (this.records.ncbi_record.genome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_genome_import = function(options) {
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
  const registration = new BioactionRegistration("genome_import", "genome_record", "genome_import");
  this.add_registration(registration);
  ////////////////////////////////////////////////////////////////////////
  // CREATE THE STATE ////////////////////////////////////////////////////
  state = new BioactionState("genome import", 300); // 5 minute delay
  if (options.callback) { state.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { state.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { state.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const skin = options.skin(state.id, this);
  state.skin = skin;
  state.update_record = this.get_genome_record;
  this.states.genome_import = state;
  state.skin.update(state);
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Import Genome';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  skin.title.innerHTML = title;
  skin.text.innerHTML = "The genome file maintained by the National Center for Biotechnology Information (NCBI) contains the current most complete total DNA sequence for this organism.  This files is fairly large, and the process of importing its contents to our local database may take up to several hours.  If the browser tab or window is closed after the importing process has started, any progress will be saved and the process can be resumed from this page.";
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
    this.html_elements.genome_import = document.getElementById(options.element_id);
    this.html_elements.genome_import.style.display = "block";
  } // end if
  else { document.body.appendChild(skin.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_genome_import();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENER ////////////////////////////////////////////////////
  skin.button.addEventListener("click", function() {
    skin.button.blur();
    this.get_genome_record()
    .then(() => {
      this.records.genome_record.metadata.delta_second = 1;
      this.update();
      const fg = new FileGuard();
      const id = guid();
      fg.accession          = "";
      fg.chunk_size         = 50000;
      fg.data               = "";
      fg.database           = "genome_db";
      fg.defline            = "";
      fg.delimiter          = ">";
      fg.end_byte           = this.records.genome_record.num_uploaded + 50000;
      fg.filename           = id + ".fna.gz";
      fg.ftp                = "ftp.ncbi.nlm.nih.gov";
      fg.id                 = id;
      fg.num_records        = this.records.genome_record.num_records;
      fg.num_uploaded       = this.records.genome_record.num_uploaded;
      fg.options            = { };
      fg.requested_records  = 4;
      fg.source             = this.records.ncbi_record.genome_url;
      fg.start_byte         = this.records.genome_record.num_uploaded;
      fg.table              = this.organism_name.replace(/ /g, "_");
      fg.target             = fg.filename;
      if (this.records.genome_record.options) {
        if (this.records.genome_record.options.accession     ) { fg.accession              = this.records.genome_record.options.accession; fg.options.accession = this.records.genome_record.options.accession; }
        if (this.records.genome_record.options.bytes_read    ) { fg.options.bytes_read     = this.records.genome_record.options.bytes_read; }
        if (this.records.genome_record.options.defline       ) { fg.defline                = this.records.genome_record.options.defline;   fg.options.defline   = this.records.genome_record.options.defline; }
        if (this.records.genome_record.options.num_characters) { fg.options.num_characters = this.records.genome_record.options.num_characters; }
      } // end if
      ////////////////////////////////////////////////////////////////////
      // ON BEFORE UNLOAD ////////////////////////////////////////////////
      this.states.genome_import.cleanup = function(evt) {
        evt.preventDefault();
        evt.returnValue = null;
        fg.filename = fg.id + ".fna.gz";
        erase_file(fg);
        fg.filename = fg.id + ".fna";
        erase_file(fg);
      }; // end function
      window.addEventListener('beforeunload', this.states.genome_import.cleanup);
      ////////////////////////////////////////////////////////////////////
      update_metadata(fg)
      .then(import_file)
      .then(decompress_gzip)
      .then(file_size)
      .then(obj => { upload_genome.call(this, obj); })
      .catch(e => {
        if (this.states.genome_import.cleanup) {
          window.removeEventListener('beforeunload', this.states.genome_import.cleanup);
          this.states.genome_import.cleanup = undefined;
        } // end if
        fg.filename = fg.id + ".fna.gz";
        //erase_file(fg);
        fg.filename = fg.id + ".fna";
        //erase_file(fg);
        hide_loading_box(true);
        create_modal('<div class="center"><h4>Could not import file</h4></div>');
      }); // end catch
    }); // end then
  }.bind(this));
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  function upload_genome(obj) {
    const chunk_size = 50000;
    if (typeof(obj) === "undefined") { resolve(obj); }
    if (typeof(obj.start_byte) === "undefined") { obj.start_byte = obj.num_uploaded; }
    if (typeof(obj.end_byte  ) === "undefined") { obj.end_byte = obj.start_byte + chunk_size; }
    if (obj.end_byte > obj.file_size) { obj.end_byte = obj.file_size; }
    obj.num_records = obj.file_size;
    if (obj.start_byte < obj.file_size) {
      read_file(obj)
      .then(parse_FASTA_fragment)
      .then(FASTA_to_db_lite)
      .then(obj => {
        obj.num_uploaded = obj.end_byte;
        this.records.genome_record.num_uploaded = obj.num_uploaded;
        this.records.genome_record.num_records  = obj.num_records;
        if (obj.num_uploaded) {
          this.records.genome_record.percent_uploaded = Math.floor((obj.num_uploaded / obj.num_records) * 100);
          state.percent_complete = this.records.genome_record.percent_uploaded;
          state.skin.update(state);
        } // end if
        let uploaded_MB = (obj.num_uploaded / 1048576).toFixed(2) + "MB";
        let total_MB = (obj.num_records / 1048576).toFixed(2) + "MB";
        uploaded_MB = uploaded_MB.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        total_MB = total_MB.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        create_progress_bar("Uploading genome to database", true, obj.num_records);
        update_progress_bar(obj.num_uploaded);
        progress_bar_subtitle(uploaded_MB + " out of " + total_MB);
        // set options values to save in table metadata
        obj.options.accession  = obj.accession;
        obj.options.bytes_read = obj.start_byte;
        obj.options.defline    = obj.defline;
        this.update();
        upload_genome.call(this, obj);
      }); // end then
    } // end if
    else {
      // clean up
      if (this.states.genome_import.cleanup) {
        window.removeEventListener('beforeunload', this.states.genome_import.cleanup);
        this.states.genome_import.cleanup = undefined;
      } // end if
      erase_file(obj);
      hideSpinner();
      hide_loading_box(true);
      hide_progress_bar(true);
    } // end else
  }; // end function
  ////////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_genome_record = function() {
  return new Promise(function(resolve, reject) {
    let obj1 = { };
    let obj2 = { };
    obj1.database   =   'genome_db';
    obj1.table      =   'table_metadata';
    obj1.command    =   'select';
    obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
    obj2.database   =   'genome_index_db';
    obj2.table      =   this.organism_name.replace(/ /g, '_');
    obj2.command    =   "count";
    let json1 = JSON.stringify(obj1);
    let json2 = JSON.stringify(obj2);
    db_guard(json1)
    .then(responseText => {
      if (responseText) {
        if (this.records.genome_record) { delete this.records.genome_record; }
        this.records.genome_record = new BioactionRecord;
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.records.genome_record.metadata.owner         = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.records.genome_record.num_records            = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.records.genome_record.metadata.year          = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.records.genome_record.metadata.day           = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.records.genome_record.metadata.hour          = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.records.genome_record.metadata.minute        = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.records.genome_record.metadata.second        = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.records.genome_record.metadata.delta_second  = parseInt(db_record.delta_second); }
        if (db_record.options) {
          this.records.genome_record.options = JSON.parse(db_record.options);
          if (this.records.genome_record.options.bytes_read) { this.records.genome_record.num_uploaded = this.records.genome_record.options.bytes_read; }
        } // end if
        if (this.records.genome_record.num_records) {
          this.records.genome_record.percent_uploaded = Math.floor((this.records.genome_record.num_uploaded / this.records.genome_record.num_records) * 100);
          if (this.records.genome_record.percent_uploaded >= 100) { check_bounty("genome_import", "genome_db", this.organism_name, this.organism_name.replace(" ", "_")); }
        } // end if
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.records.genome_record.options.num_records = parseInt(db_record['COUNT(*)']);
        } // end if
      } // end if
    }) // end then
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
