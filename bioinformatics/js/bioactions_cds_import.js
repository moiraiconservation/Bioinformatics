///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS CDS IMPORT //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_cds_import = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.ncbi_record.refseq.cds_from_genomic_url) {
      this.actions.cds_import.status = "loading";
      this.update();
    } // end if (this.ncbi_record.genome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_cds_import = function(options) {
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
  if (options.callback) { this.actions.cds_import.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { this.actions.cds_import.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { this.actions.cds_import.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const action = options.skin(this.actions.cds_import.id, this);
  this.actions.cds_import.skin = action;
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Import Gene Sequences';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  action.title.innerHTML = title;
  action.text.innerHTML = "The gene sequence file maintained by the National Center for Biotechnology Information (NCBI) contains the complete nucleotide sequences of every currently known gene within this organism.   This files is fairly large, and the process of importing its contents to our local database may take more than an hour depending on your Internet speed.  If the browser tab or window is closed after the importing process has started, any progress will be saved and the process can be resumed from this page.";
  action.button.innerHTML = 'Import <i class="fa fa-angle-right" aria-hidden="true"></i>';
  action.button.style.display = "none";
  if (action.organism_name) { action.organism_name.innerHTML = this.organism_name; }
  if (action.common_name) {
    if (this.common_name) { action.common_name.innerHTML = "(" + this.common_name + ")"; }
  } // end if
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(action.area);
    this.html_element.cds_import = document.getElementById(options.element_id);
    this.html_element.cds_import.style.display = "block";
  } // end if
  else { document.body.appendChild(action.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_cds_import();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  action.button.addEventListener("click", function() {
    action.button.blur();
    this.cds_record.metadata.delta_second = 1;
    let cds_obj = new FileGuard;
    cds_obj.data            = "";
    cds_obj.database        = "cds_db";
    cds_obj.file_state      = "erase";
    cds_obj.filename        = cds_obj.id + ".fna.gz";
    cds_obj.num_records     = this.cds_record.num_records;
    cds_obj.num_uploaded    = this.cds_record.num_uploaded;
    cds_obj.source          = this.ncbi_record.refseq.cds_from_genomic_url;
    cds_obj.table           = this.organism_name.replace(/ /g, "_");
    cds_obj.target          = cds_obj.filename;
    if (this.ncbi_record.proteome_url_refseq) { cds_obj.options.refseq = this.ncbi_record.refseq; }
    else { cds_obj.options.genbank = this.ncbi_record.genbank; }
    //////////////////////////////////////////////////////////////////
    // ON BEFORE UNLOAD //////////////////////////////////////////////
    this.actions.cds_import.cleanup = function(evt) {
      evt.preventDefault();
      evt.returnValue = null;
      cds_obj.filename = cds_obj.id + ".fna.gz";
      erase_file(cds_obj);
      cds_obj.filename = cds_obj.id + ".fna";
      erase_file(cds_obj);
    };
    window.addEventListener('beforeunload', this.actions.cds_import.cleanup);
    //////////////////////////////////////////////////////////////////
    update_metadata(cds_obj)
    .then(import_file)
    .then(decompress_gzip)
    .then(open_file)
    .then(parse_FASTA)
    .then(parse_defline)
    .then(update_metadata)
    .then(d => { this.cds_record.num_records = d.num_records; return d; })
    .then(d => FASTA_to_cds_db(d, function(delta) {
      if (typeof(delta) === 'undefined') { delta = 0; }
      this.cds_record.num_uploaded = this.cds_record.num_uploaded + delta;
      this.cds_record.percent_uploaded = Math.floor((this.cds_record.num_uploaded / this.cds_record.num_records) * 100);
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
      if (this.actions.cds_import.cleanup) {
        window.removeEventListener('beforeunload', this.actions.cds_import.cleanup);
        this.actions.cds_import.cleanup = undefined;
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
