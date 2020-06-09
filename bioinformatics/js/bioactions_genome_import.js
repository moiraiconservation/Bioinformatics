///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS GENOME IMPORT ///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_genome_import = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.ncbi_record.genome_url) {
      this.get_genome_record()
      .then(() => {
        this.actions.genome_import.status = "loading";
        this.update();
      }); // end then
    } // end if (this.ncbi_record.genome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_genome_import = function(options) {
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
  if (options.callback) { this.actions.genome_import.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { this.actions.genome_import.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { this.actions.genome_import.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const action = options.skin(this.actions.genome_import.id, this);
  this.actions.genome_import.skin = action;
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Import Genome';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  action.title.innerHTML = title;
  action.text.innerHTML = "The genome file maintained by the National Center for Biotechnology Information (NCBI) contains the current most complete total DNA sequence for this organism.  This files is fairly large, and the process of importing its contents to our local database may take up to several hours.  If the browser tab or window is closed after the importing process has started, any progress will be saved and the process can be resumed from this page.";
  action.button.innerHTML = 'Import <i class="fa fa-angle-right" aria-hidden="true"></i>';
  action.button.style.display = "none";
  if (action.organism_name) { action.organism_name.innerHTML = this.organism_name; }
  if (action.common_name) {
    if (this.common_name) { action.common_name.innerHTML = "(" + this.common_name + ")"; }
  } // end if
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(action.area);
    this.html_element.genome_import = document.getElementById(options.element_id);
    this.html_element.genome_import.style.display = "block";
  } // end if
  else { document.body.appendChild(action.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_genome_import();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENER ////////////////////////////////////////////////////
  action.button.addEventListener("click", function() {
    action.button.blur();
    this.get_genome_record()
    .then(() => {
      this.genome_record.metadata.delta_second = 1;
      this.update();
      const fg = new FileGuard();
      const id = guid();
      fg.accession          = "";
      fg.chunk_size         = 50000;
      fg.data               = "";
      fg.database           = "genome_db";
      fg.defline            = "";
      fg.delimiter          = ">";
      fg.end_byte           = this.genome_record.num_uploaded + 50000;
      fg.filename           = id + ".fna.gz";
      fg.id                 = id;
      fg.num_records        = this.genome_record.num_records;
      fg.num_uploaded       = this.genome_record.num_uploaded;
      fg.options            = { };
      fg.requested_records  = 4;
      fg.source             = this.ncbi_record.genome_url;
      fg.start_byte         = this.genome_record.num_uploaded;
      fg.table              = this.organism_name.replace(/ /g, "_");
      fg.target             = fg.filename;
      if (this.genome_record.options) {
        if (this.genome_record.options.accession     ) { fg.accession              = this.genome_record.options.accession; fg.options.accession = this.genome_record.options.accession; }
        if (this.genome_record.options.bytes_read    ) { fg.options.bytes_read     = this.genome_record.options.bytes_read; }
        if (this.genome_record.options.defline       ) { fg.defline                = this.genome_record.options.defline;   fg.options.defline   = this.genome_record.options.defline; }
        if (this.genome_record.options.num_characters) { fg.options.num_characters = this.genome_record.options.num_characters; }
      } // end if
      ////////////////////////////////////////////////////////////////////
      // ON BEFORE UNLOAD ////////////////////////////////////////////////
      this.actions.genome_import.cleanup = function(evt) {
        evt.preventDefault();
        evt.returnValue = null;
        fg.filename = fg.id + ".fna.gz";
        erase_file(fg);
        fg.filename = fg.id + ".fna";
        erase_file(fg);
      }; // end function
      window.addEventListener('beforeunload', this.actions.genome_import.cleanup);
      ////////////////////////////////////////////////////////////////////
      update_metadata(fg)
      .then(import_file)
      .then(decompress_gzip)
      .then(file_size)
      .then(obj => { upload_genome.call(this, obj); })
      .catch(e => {
        if (this.actions.genome_import.cleanup) {
          window.removeEventListener('beforeunload', this.actions.genome_import.cleanup);
          this.actions.genome_import.cleanup = undefined;
        } // end if
        fg.filename = fg.id + ".fna.gz";
        erase_file(fg);
        fg.filename = fg.id + ".fna";
        erase_file(fg);
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
        this.genome_record.num_uploaded = obj.num_uploaded;
        this.genome_record.num_records  = obj.num_records;
        if (obj.num_uploaded) {
          this.genome_record.percent_uploaded = Math.floor((obj.num_uploaded / obj.num_records) * 100);
          action.percent_complete = this.genome_record.percent_uploaded;
          action.update(action);
        } // end if
        let uploaded_MB = (obj.num_uploaded / 1000000).toFixed(2) + "MB";
        let total_MB = (obj.num_records / 1000000).toFixed(2) + "MB";
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
      if (this.actions.genome_import.cleanup) {
        window.removeEventListener('beforeunload', this.actions.genome_import.cleanup);
        this.actions.genome_import.cleanup = undefined;
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
