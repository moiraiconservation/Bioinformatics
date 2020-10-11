///////////////////////////////////////////////////////////////////////////////
// BIOACTION CDS_INDEX ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_cds_index = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.records.ncbi_record.cds_from_genomic_url) {
      this.get_cds_record()
      .then(() => {
        if (this.records.cds_record.percent_uploaded >= 100) {
          this.get_cds_index_record()
          .then(() => {
            this.states.cds_index.status = "loading";
            this.update();
          }); // end then get_cds_index_record()
        } // end if (this.records.cds_record.percent_uploaded >= 100)
      }); // end then get_cds_record()
    } // end if (this.records.ncbi_record.cds_url)
  }); // end then get_ncbi_record()
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_cds_index = function(options) {
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
  const registration = new BioactionRegistration("cds_index", "cds_index_record", "cds_index");
  this.add_registration(registration);
  ////////////////////////////////////////////////////////////////////////
  // CREATE THE STATE ////////////////////////////////////////////////////
  state = new BioactionState("CDS index", 300); // 5 minute delay
  if (options.callback) { state.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { state.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { state.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const skin = options.skin(state.id, this);
  state.skin = skin;
  state.update_record = this.get_cds_index_record;
  this.states.cds_index = state;
  state.skin.update(state);
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Index Genes';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  skin.title.innerHTML = title;
  skin.text.innerHTML = "Before genes records can be searched for sequence similarities, the gene records must be indexed for ease of use.  This process looks for kmers (short amino nucleotide) of length 8 and records the ID of the gene sequence in which they were found.  If the browser tab or window is closed after the indexing process has started, any progress will be saved and the process can be resumed from this page.";
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
    this.html_elements.cds_index = document.getElementById(options.element_id);
    this.html_elements.cds_index.style.display = "block";
  } // end if
  else { document.body.appendChild(skin.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_cds_index();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  skin.button.addEventListener("click", function() {
    log_user("Task", "Started indexing genes for " + this.organism_name);
    skin.button.blur();
    this.records.cds_index_record.metadata.delta_second = 1;
    hide_loading_box(true);
    create_loading_box("Updating records", true);
    let obj = { };
    let metaObj = { };
    try {
      metaObj.command     = "update_metadata";
      metaObj.database    = "cds_index_db";
      metaObj.table       = this.organism_name.replace(/ /g, "_");
      metaObj.num_records = this.records.cds_index_record.num_records ? this.records.cds_index_record.num_records : 0;
      metaObj.status      = "success";
      update_metadata(metaObj)
      .then(() => {
        this.update();
        hide_loading_box(true);
        create_loading_box("Finding records", true);
        obj = { };
        obj.database   =    "cds_index_db";
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
            this.records.cds_index_record.num_records = record.records;
            obj = { };
            obj.database   =    'cds_db';
            obj.table      =    this.organism_name.replace(/ /g, '_');
            obj.command    =    "select_all";
            obj.columns    =    [ { key: "id" }, { key: "sequence" } ];
            obj.limit      =    this.records.cds_record.num_records;
            let json       =    JSON.stringify(obj);
            db_guard(json)
            .then(responseText => {
              hide_loading_box(true);
              if (responseText) {
                let data = JSON.parse(responseText);
                create_progress_bar("Step 1 of 2: Indexing records", true, data.length);
                let bioWorker = new Worker(current_base_url + '/workers/js/cds_index.js?version=' + guid());
                let job = { status: 'index', command: 'create', organism_name: this.organism_name, data: data, num_uploaded: this.records.cds_index_record.num_uploaded };
                bioWorker.postMessage(job);
                bioWorker.onmessage = function(e) {
                  switch(e.data.status) {
                    case 'step1': {
                      let index_text = e.data.work.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
                      let limit_text = data.length.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
                      progress_bar_subtitle("Record " + index_text + " of " + limit_text);
                      update_progress_bar(1);
                      break;
                    } // end case
                    case 'step2': {
                      this.records.cds_index_record.num_records = e.data.work;
                      metaObj.num_records = this.records.cds_index_record.num_records;
                      update_metadata(metaObj);
                      reset_progress_bar(this.records.cds_index_record.num_records);
                      show_progress_bar();
                      progress_bar_text("Step 2 of 2: Saving records");
                      update_progress_bar(this.records.cds_index_record.num_uploaded);
                      break;
                    } // end case
                    case 'step3': {
                      update_progress_bar(e.data.work.chunk_size);
                      let index_text = e.data.work.index.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
                      let limit_text = this.records.cds_index_record.num_records.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
                      progress_bar_subtitle("Record " + index_text + " of " + limit_text);
                      this.records.cds_index_record.num_uploaded = this.records.cds_index_record.num_uploaded + e.data.work.chunk_size;
                      this.records.cds_index_record.percent_uploaded = Math.floor((this.records.cds_index_record.num_uploaded / this.records.cds_index_record.num_records) * 100);
                      update_metadata(metaObj);
                      this.update();
                      break;
                    } // end case
                    case 'step4': {
                      hide_progress_bar();
                      this.update();
                      bioWorker.terminate();
                      if (this.records.cds_index_record.percent_uploaded >= 100) {
                        log_user("Task", "Finished indexing genes for " + this.organism_name);
                      } // end if
                      break;
                    } // end case
                    case 'error': {
                      hide_progress_bar();
                      create_modal(e.data.work);
                      break;
                    } // end case
                  } // end switch
                }.bind(this) // end onmessage
              } // end if
            }) // end then
          } // end if
        }) // end then
      }); // end then
    } // end try
    catch(err) { hide_loading_box(true); console.log("Error!"); return; }
  }.bind(this)); // end event listener
  //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_cds_index_record = function() {
  return new Promise(function(resolve, reject) {
    let obj1 = { };
    let obj2 = { };
    obj1.database   =   'cds_index_db';
    obj1.table      =   'table_metadata';
    obj1.command    =   'select';
    obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
    obj2.database   =   'cds_index_db';
    obj2.table      =   this.organism_name.replace(/ /g, '_');
    obj2.command    =   "count";
    let json1 = JSON.stringify(obj1);
    let json2 = JSON.stringify(obj2);
    db_guard(json1)
    .then(responseText => {
      if (responseText) {
        if (this.records.cds_index_record) { delete this.records.cds_index_record; }
        this.records.cds_index_record = new BioactionRecord;
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.records.cds_index_record.metadata.owner  = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.records.cds_index_record.num_records             = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.records.cds_index_record.metadata.year           = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.records.cds_index_record.metadata.day            = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.records.cds_index_record.metadata.hour           = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.records.cds_index_record.metadata.minute         = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.records.cds_index_record.metadata.second         = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.records.cds_index_record.metadata.delta_second   = parseInt(db_record.delta_second); }
        if (db_record.options) { this.records.cds_index_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.records.cds_index_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.records.cds_index_record.num_records) {
            this.records.cds_index_record.percent_uploaded = Math.floor((this.records.cds_index_record.num_uploaded / this.records.cds_index_record.num_records) * 100);
            if (this.records.cds_index_record.percent_uploaded >= 100) { check_bounty("cds_index", "cds_index_db", this.organism_name, this.organism_name.replace(" ", "_")); }
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
