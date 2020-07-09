///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTEOME_INDEX ///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_proteome_index = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.records.ncbi_record.proteome_url) {
      this.get_proteome_record()
      .then(() => {
        if (this.records.proteome_record.percent_uploaded >= 100) {
          this.get_proteome_index_record()
          .then(() => {
            this.states.proteome_index.status = "loading";
            this.update();
          }); // end then get_proteome_index_record()
        } // end if (this.records.proteome_record.percent_uploaded >= 100)
      }); // end then get_proteome_record()
    } // end if (this.records.ncbi_record.proteome_url)
  }); // end then get_ncbi_record()
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_proteome_index = function(options) {
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
  const registration = new BioactionRegistration("proteome_index", "proteome_index_record", "proteome_index");
  this.add_registration(registration);
  ////////////////////////////////////////////////////////////////////////
  // CREATE THE STATE ////////////////////////////////////////////////////
  state = new BioactionState("proteome index", 300); // 5 minute delay
  if (options.callback) { state.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { state.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { state.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const skin = options.skin(state.id, this);
  state.skin = skin;
  state.update_record = this.get_proteome_index_record;
  this.states.proteome_index = state;
  state.skin.update(state);
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Index Proteins';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  skin.title.innerHTML = title;
  skin.text.innerHTML = "Before protein records can be searched for sequence similarities, the protein records must be indexed for ease of use.  This process looks for kmers (short amino acid sequences) of length 4 and records the ID of the protein sequence in which they were found.  If the browser tab or window is closed after the indexing process has started, any progress will be saved and the process can be resumed from this page.";
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
    this.html_elements.proteome_index = document.getElementById(options.element_id);
    this.html_elements.proteome_index.style.display = "block";
  } // end if
  else { document.body.appendChild(skin.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_proteome_index();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  skin.button.addEventListener("click", function() {
    skin.button.blur();
    this.records.proteome_index_record.metadata.delta_second = 1;
    hide_loading_box(true);
    create_loading_box("Updating records", true);
    let obj = { };
    let metaObj = { };
    try {
      metaObj.command     = "update_metadata";
      metaObj.database    = "proteome_index_db";
      metaObj.table       = this.organism_name.replace(/ /g, "_");
      metaObj.num_records = this.records.proteome_index_record.num_records ? this.records.proteome_index_record.num_records : 0;
      metaObj.status      = "success";
      update_metadata(metaObj)
      .then(() => {
        this.update();
        hide_loading_box(true);
        create_loading_box("Finding records", true);
        obj = { };
        obj.database   =    "proteome_index_db";
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
            this.records.proteome_index_record.num_records = record.records;
            obj = { };
            obj.database   =    'proteome_db';
            obj.table      =    this.organism_name.replace(/ /g, '_');
            obj.command    =    "select_all";
            obj.columns    =    [ { key: "id" }, { key: "sequence" } ];
            obj.limit      =    this.records.proteome_record.num_records;
            let json       =    JSON.stringify(obj);
            db_guard(json)
            .then(responseText => {
              hide_loading_box(true);
              if (responseText) {
                let data = JSON.parse(responseText);
                create_progress_bar("Step 1 of 2: Indexing records", true, data.length);
                let bioWorker = new Worker(current_base_url + '/workers/js/proteome_index.js?version=' + guid());
                let job = { status: 'index', command: 'create', organism_name: this.organism_name, data: data, num_uploaded: this.records.proteome_index_record.num_uploaded };
                bioWorker.postMessage(job);
                bioWorker.onmessage = function(e) {
                  switch(e.data.status) {
                    case 'step1': {
                      progress_bar_subtitle("Record " + e.data.work + " of " + data.length);
                      update_progress_bar(1);
                      break;
                    } // end case
                    case 'step2': {
                      this.records.proteome_index_record.num_records = e.data.work;
                      metaObj.num_records = this.records.proteome_index_record.num_records;
                      update_metadata(metaObj);
                      reset_progress_bar(this.records.proteome_index_record.num_records);
                      show_progress_bar();
                      progress_bar_text("Step 2 of 2: Saving records");
                      update_progress_bar(this.records.proteome_index_record.num_uploaded);
                      break;
                    } // end case
                    case 'step3': {
                      update_progress_bar(e.data.work.chunk_size);
                      progress_bar_subtitle("Record " + e.data.work.index + " of " + this.records.proteome_index_record.num_records);
                      this.records.proteome_index_record.num_uploaded = this.records.proteome_index_record.num_uploaded + e.data.work.chunk_size;
                      this.records.proteome_index_record.percent_uploaded = Math.floor((this.records.proteome_index_record.num_uploaded / this.records.proteome_index_record.num_records) * 100);
                      update_metadata(metaObj);
                      this.update();
                      break;
                    } // end case
                    case 'step4': {
                      hide_progress_bar();
                      this.update();
                      bioWorker.terminate();
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
Bioaction.prototype.get_proteome_index_record = function() {
  return new Promise(function(resolve, reject) {
    let obj1 = { };
    let obj2 = { };
    obj1.database   =   'proteome_index_db';
    obj1.table      =   'table_metadata';
    obj1.command    =   'select';
    obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
    obj2.database   =   'proteome_index_db';
    obj2.table      =   this.organism_name.replace(/ /g, '_');
    obj2.command    =   "count";
    let json1 = JSON.stringify(obj1);
    let json2 = JSON.stringify(obj2);
    db_guard(json1)
    .then(responseText => {
      if (responseText) {
        if (this.records.proteome_index_record) { delete this.records.proteome_index_record; }
        this.records.proteome_index_record = new BioactionRecord;
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.records.proteome_index_record.metadata.owner  = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.records.proteome_index_record.num_records             = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.records.proteome_index_record.metadata.year           = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.records.proteome_index_record.metadata.day            = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.records.proteome_index_record.metadata.hour           = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.records.proteome_index_record.metadata.minute         = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.records.proteome_index_record.metadata.second         = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.records.proteome_index_record.metadata.delta_second   = parseInt(db_record.delta_second); }
        if (db_record.options) { this.records.proteome_index_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.records.proteome_index_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.records.proteome_index_record.num_records) {
            this.records.proteome_index_record.percent_uploaded = Math.floor((this.records.proteome_index_record.num_uploaded / this.records.proteome_index_record.num_records) * 100);
            if (this.records.proteome_index_record.percent_uploaded >= 100) { check_bounty("proteome_index", "proteome_index_db", this.organism_name, this.organism_name.replace(" ", "_")); }
          } // end if
        } // end if
      } // end if
    })
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////
