///////////////////////////////////////////////////////////////////////////////
// BIOACTION GENOME_INDEX /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_genome_index = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.records.ncbi_record.genome_url) {
      this.get_genome_record()
      .then(() => {
        if (this.records.genome_record.percent_uploaded >= 100) {
          this.get_genome_index_record()
          .then(() => {
            this.states.genome_index.status = "loading";
            this.update();
          });
        } // end if
      }); // end then
    } // end if (this.records.ncbi_record.genome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_genome_index = function(options) {
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
  const registration = new BioactionRegistration("genome_index", "genome_index_record", "genome_index");
  this.add_registration(registration);
  ////////////////////////////////////////////////////////////////////////
  // CREATE THE STATE ////////////////////////////////////////////////////
  state = new BioactionState("genome index", 300); // 5 minute delay
  if (options.callback) { state.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { state.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { state.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const skin = options.skin(state.id, this);
  state.skin = skin;
  state.update_record = this.get_genome_index_record;
  this.states.genome_index = state;
  state.skin.update(state);
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Index Genome';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  skin.title.innerHTML = title;
  skin.text.innerHTML = "Before genomes can be searched for sequence similarities, each genome must be indexed for ease of use.  This process looks for kmers (short nucleotide sequences) of length 8 and records their place in the genome.  This length is shorter than is often used in bioinformatic techniques (often a length of 11 nucleotides is used).  This shorter length was chosen to keep the total database table creation time acceptably short.  To compensate for the shorter kmer size, the upper half of the kmer distribution (the more frequently-found kmers) is discarded."
  skin.button.innerHTML = 'Index <i class="fa fa-angle-right" aria-hidden="true"></i>';
  skin.button.style.display = "none";
  if (skin.organism_name) { skin.organism_name.innerHTML = this.organism_name; }
  if (skin.common_name) {
    if (this.common_name) { skin.common_name.innerHTML = "(" + this.common_name+ ")"; }
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE THE ELEMENT //////////////////////////////////////////////
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(skin.area);
    this.html_elements.genome_index = document.getElementById(options.element_id);
    this.html_elements.genome_index.style.display = "block";
  } // end if
  else { document.body.appendChild(skin.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_genome_index();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  skin.button.addEventListener("click", function() {
    skin.button.blur();
    this.records.genome_index_record.metadata.delta_second = 1;
    hide_loading_box(true);
    create_loading_box("Updating records", true);
    let obj = { };
    let metaObj = { };
    let bioWorker = new Worker(current_base_url + '/workers/js/genome_index.js?version=' + guid());
    try {
      metaObj.command     = "update_metadata";
      metaObj.database    = "genome_index_db";
      metaObj.table       = this.organism_name.replace(/ /g, "_");
      metaObj.num_records = 65536;
      metaObj.status      = "success";
      update_metadata(metaObj)
      .then(() => {
        this.update();
        hide_loading_box(true);
        create_loading_box("Finding records", true);
        obj = { };
        obj.database   =    "genome_index_db";
        obj.table      =    "table_metadata";
        obj.command    =    "select";
        obj.where      =    [ { key: "id", value: this.organism_name.replace(/ /g, "_") } ];
        let json       =    JSON.stringify(obj);
        db_guard(json)
        .then(responseText => {
          hide_loading_box(true);
          create_loading_box("Finding records", true);
          if (responseText) {
            let record = JSON.parse(responseText);
            this.records.genome_index_record.num_records = record.records;
            obj = { };
            obj.database        =   'genome_db';
            obj.table           =   this.organism_name.replace(/ /g, '_');
            obj.command         =   "count";
            db_guard(JSON.stringify(obj))
            .then(responseText => {
              let response                = JSON.parse(responseText);
              obj.limit                   = parseInt(response['COUNT(*)']);
              obj.database                = 'genome_db';
              obj.table                   = this.organism_name.replace(/ /g, '_');
              obj.command                 = "select_all";
              obj.columns                 = [ { key: "id" }, { key: "sequence" } ];
              obj.block_size              = 50;
              obj.options                 = { };
              obj.options.progress_bar    = true;
              obj.options.delete          = true;
              obj.options.worker          = true;
              obj.options.worker_command  = "count";
              let json = JSON.stringify(obj);
              db_guard(json, bioWorker)
              .then(() => {
                obj.options.worker_command  = "update";
                json = JSON.stringify(obj);
                db_guard(json, bioWorker)
                .then(() => {
                  hide_loading_box(true);
                  hide_progress_bar(true);
                }); // end then
              }); // end then
            }); // end then
          } // end if
        }); // end then
      }); // end then
    } // end try
    catch(err) { hide_loading_box(true); console.log("Error!"); return; }
  }.bind(this)); // end event listener
  //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_genome_index_record = function() {
  return new Promise(function(resolve, reject) {
    let obj1 = { };
    let obj2 = { };
    obj1.database   =   'genome_index_db';
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
        if (this.records.genome_index_record) { delete this.records.genome_index_record; }
        this.records.genome_index_record = new BioactionRecord;
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.records.genome_index_record.metadata.owner  = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.records.genome_index_record.num_records             = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.records.genome_index_record.metadata.year           = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.records.genome_index_record.metadata.day            = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.records.genome_index_record.metadata.hour           = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.records.genome_index_record.metadata.minute         = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.records.genome_index_record.metadata.second         = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.records.genome_index_record.metadata.delta_second   = parseInt(db_record.delta_second); }
        if (db_record.options) { this.records.genome_index_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.records.genome_index_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.records.genome_index_record.num_records) {
            this.records.genome_index_record.percent_uploaded = Math.floor((this.records.genome_index_record.num_uploaded / this.records.genome_index_record.num_records) * 100);
            if (this.records.genome_index_record.percent_uploaded >= 100) { check_bounty("genome_index", "genome_index_db", this.organism_name, this.organism_name.replace(" ", "_")); }
          } // end if
        } // end if
      } // end if
    }) // end then
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////
