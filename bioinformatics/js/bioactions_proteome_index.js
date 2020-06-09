///////////////////////////////////////////////////////////////////////////////
// BIOACTION proteome_index ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_proteome_index = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.ncbi_record.proteome_url) {
      this.get_proteome_record()
      .then(() => {
        if (this.proteome_record.percent_uploaded >= 100) {
          this.get_proteome_index_record()
          .then(() => {
            this.actions.proteome_index.status = "loading";
            this.update();
          }); // end then get_proteome_index_record()
        } // end if (this.proteome_record.percent_uploaded >= 100)
      }); // end then get_proteome_record()
    } // end if (this.ncbi_record.proteome_url)
  }); // end then get_ncbi_record()
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_cross_species_proteome_map = function() {
  this.get_cross_species_proteome_map_record()
  .then(() => {
    if (this.actions.cross_species_proteome_map.species1 && this.actions.cross_species_proteome_map.species2) {
      this.actions.cross_species_proteome_map.status = "loading";
    } // end if (this.actions.cross_species_proteome_map.species1 && this.actions.cross_species_proteome_map.species2)
    this.update();
  }) // end then get_cross_species_proteome_map_record()
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_proteome_index = function(options) {
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
  if (options.callback) { this.actions.proteome_index.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { this.actions.proteome_index.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { this.actions.proteome_index.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const action = options.skin(this.actions.proteome_index.id, this);
  this.actions.proteome_index.skin = action;
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Index Proteins';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  action.title.innerHTML = title;
  action.text.innerHTML = "Before protein records can be searched for sequence similarities, the protein records must be indexed for ease of use.  This process looks for kmers (short amino acid sequences) of length 4 and records the ID of the protein sequence in which they were found.  If the browser tab or window is closed after the indexing process has started, any progress will be saved and the process can be resumed from this page.";
  action.button.innerHTML = 'Index <i class="fa fa-angle-right" aria-hidden="true"></i>';
  action.button.style.display = "none";
  if (action.organism_name) { action.organism_name.innerHTML = this.organism_name; }
  if (action.common_name) {
    if (this.common_name) { action.common_name.innerHTML = "(" + this.common_name+ ")"; }
  } // end if
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(action.area);
    this.html_element.proteome_index = document.getElementById(options.element_id);
    this.html_element.proteome_index.style.display = "block";
  } // end if
  else { document.body.appendChild(action.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_proteome_index();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  action.button.addEventListener("click", function() {
    action.button.blur();
    this.proteome_index_record.metadata.delta_second = 1;
    hide_loading_box(true);
    create_loading_box("Updating records", true);
    let obj = { };
    let metaObj = { };
    try {
      metaObj.command     = "update_metadata";
      metaObj.database    = "proteome_index_db";
      metaObj.table       = this.organism_name.replace(/ /g, "_");
      metaObj.num_records = this.proteome_index_record.num_records ? this.proteome_index_record.num_records : 0;
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
            this.proteome_index_record.num_records = record.records;
            obj = { };
            obj.database   =    'proteome_db';
            obj.table      =    this.organism_name.replace(/ /g, '_');
            obj.command    =    "select_all";
            obj.columns    =    [ { key: "id" }, { key: "sequence" } ];
            obj.limit      =    this.proteome_record.num_records;
            let json       =    JSON.stringify(obj);
            db_guard(json)
            .then(responseText => {
              hide_loading_box(true);
              if (responseText) {
                let data = JSON.parse(responseText);
                create_progress_bar("Step 1 of 2: Indexing records", true, data.length);
                let bioWorker = new Worker(current_base_url + '/workers/js/proteome_index.js?version=' + guid());
                let job = { status: 'index', command: 'create', organism_name: this.organism_name, data: data, num_uploaded: this.proteome_index_record.num_uploaded };
                bioWorker.postMessage(job);
                bioWorker.onmessage = function(e) {
                  switch(e.data.status) {
                    case 'step1': {
                      progress_bar_subtitle("Record " + e.data.work + " of " + data.length);
                      update_progress_bar(1);
                      break;
                    } // end case
                    case 'step2': {
                      this.proteome_index_record.num_records = e.data.work;
                      metaObj.num_records = this.proteome_index_record.num_records;
                      update_metadata(metaObj);
                      reset_progress_bar(this.proteome_index_record.num_records);
                      show_progress_bar();
                      progress_bar_text("Step 2 of 2: Saving records");
                      update_progress_bar(this.proteome_index_record.num_uploaded);
                      break;
                    } // end case
                    case 'step3': {
                      update_progress_bar(e.data.work.chunk_size);
                      progress_bar_subtitle("Record " + e.data.work.index + " of " + this.proteome_index_record.num_records);
                      this.proteome_index_record.num_uploaded = this.proteome_index_record.num_uploaded + e.data.work.chunk_size;
                      this.proteome_index_record.percent_uploaded = Math.floor((this.proteome_index_record.num_uploaded / this.proteome_index_record.num_records) * 100);
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
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_cross_species_proteome_map = function(options) {
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
  if (options.callback) { this.actions.cross_species_proteome_map.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { this.actions.cross_species_proteome_map.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { this.actions.cross_species_proteome_map.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const action = options.skin(this.actions.cross_species_proteome_map.id, this);
  this.actions.cross_species_proteome_map.skin = action;
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Cross-species Protein Map';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  action.title.innerHTML = title;
  let description = "<p>This function identifies related proteins between two species (orthologs) using a custom in-house implementation of BLAST<sup>[1]</sup>.  The resulting ortholog relationships are then recorded in our database for future use.</p>";
  description += "<p>Technical information:  The custom gapped BLAST search uses the BLOSUM80 scoring matrix, a word size of 4, a neighborhood word score threshold of 11, and an expect threshold of 0.001.  Low complexity regions of the query sequences are filtered by soft masking using the SEG algorithm<sup>[2, 3]</sup>.  ";
  description += "To increase BLAST search speed for the browser, the pool of subject sequences is reduced prior to each search to contain only proteins with a sequence identity of 80% or higher.  This reduction in search pool size is accomplished by filtering based on the short-word identity score using a word length of 4 and a tolerance of 99%<sup>[4]</sup>.</p>";
  description += "<p>[1] Altschul, S. F., Gish, W., Miller, W., Myers, E. W., & Lipman, D. J. (1990). Basic local alignment search tool. Journal of molecular biology, 215(3), 403-410.</p>";
  description += "<p>[2] Wootton, J. C., & Federhen, S. (1993). Statistics of local complexity in amino acid sequences and sequence databases. Computers & chemistry, 17(2), 149-163.</p>";
  description += "<p>[3] Wootton, J. C., & Federhen, S. (1996). [33] Analysis of compositionally biased regions in sequence databases. In Methods in enzymology (Vol. 266, pp. 554-571). Academic Press.</p>";
  description += "<p>[4] Li, W., Jaroszewski, L., & Godzik, A. (2002). Tolerating some redundancy significantly speeds up clustering of large protein databases. Bioinformatics, 18(1), 77-82.</p>";
  action.text.innerHTML = description;
  action.button.innerHTML = 'Map <i class="fa fa-angle-right" aria-hidden="true"></i>';
  action.button.style.display = "none";
  let tooltip = { };
  let option_area = '';
  option_area += '<div class="horizontal-divider"></div>';
  option_area += '<br>';
  option_area += '<div class="document"><b>Mapping Options</b></div>';
  option_area += '<div class="row">';
  option_area += '<div class="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">';
  option_area += '<div class="document">';
  option_area += 'This is an option to cache the relevant database tables prior to mapping proteins.  When this option is turned on, a sizable amount of information will be downloaded to your computer at the beginning of the process.  Caching sometimes speeds the overall mapping process on computers with a slower Internet connection.  However, caching may cause the browser to crash or become unresponsive if runtime memory is limited.';
  option_area += '</div>'; // end option document
  option_area += '</div>'; // end column
  option_area += '<div class="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12">';
  option_area += '<div id="slider-text">';
  option_area += '<div class="center">';
  option_area += '<div class="document"><b>Cache</b></div>';
  option_area += '</div>'; // end center
  option_area += '</div>'; // end slider-text
  option_area += '<div class="center">';
  option_area += '<label class="switch">';
  option_area += '<input type="checkbox" id="slider-checkbox-' + this.actions.cross_species_proteome_map.id + '-' + this.id + '" value="1">';
  option_area += '<span class="slider slider-on-off round"></span>';
  option_area += '</label>';
  option_area += '</div>'; // end center
  option_area += '<div class="center">';
  option_area += '<div id="slider-subtitle">';
  option_area += '</div>'; // end slider-subtitle
  option_area += '</div>'; // end center
  option_area += '</div>'; // end column
  option_area += '</div>'; // end row
  action.option.innerHTML = option_area;
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(action.area);
    this.html_element.cross_species_proteome_map = document.getElementById(options.element_id);
    this.html_element.cross_species_proteome_map.style.display = "block";
  } // end if
  else { document.body.appendChild(action.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_cross_species_proteome_map();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  action.button.addEventListener("click", function() {
    //////////////////////////////////////////////////////////////////
    // This function finds homologous proteins (orthologs) between  //
    // the two specified species via protein BLAST.                 //
    //////////////////////////////////////////////////////////////////
    // LOCAL VARIABLES ///////////////////////////////////////////////
    action.button.blur();
    this.get_cross_species_proteome_map_record()
    .then(() => {
      this.cross_species_proteome_map_record.species1.metadata.delta_second = 1;
      this.cross_species_proteome_map_record.species2.metadata.delta_second = 1;
      find_MRCA(this.actions.cross_species_proteome_map.species1.organism_name, this.actions.cross_species_proteome_map.species2.organism_name)
      .then(mya => {
        create_loading_box("Finding records", true);
        const CDHIT_percent_identity = mrca_to_blosum_number(mya).toString();
        let id1 = this.cross_species_proteome_map_record.species1.num_uploaded + 1;
        let id2 = this.cross_species_proteome_map_record.species2.num_uploaded + 1;
        let name1 = this.actions.cross_species_proteome_map.species1.organism_name.replace(/ /g, '_');
        let name2 = this.actions.cross_species_proteome_map.species2.organism_name.replace(/ /g, '_');
        let max_id1 = this.actions.cross_species_proteome_map.species1.proteome_record.num_records;
        let max_id2 = this.actions.cross_species_proteome_map.species2.proteome_record.num_records;
        let split_name1 = this.actions.cross_species_proteome_map.species1.organism_name.split(' ');
        let split_name2 = this.actions.cross_species_proteome_map.species2.organism_name.split(' ');
        let sub_name1 = split_name1[0][0] + '_' + split_name1[1];
        let sub_name2 = split_name2[0][0] + '_' + split_name2[1];
        let table_name1 = sub_name1 + '_to_' + sub_name2;
        let table_name2 = sub_name2 + '_to_' + sub_name1;
        //////////////////////////////////////////////////////////////////
        // FUNCTION OPTIONS //////////////////////////////////////////////
        let proteome_index_options = { };
        proteome_index_options.cache = 0;
        let element_check = document.getElementById('slider-checkbox-' + this.actions.cross_species_proteome_map.id + '-' + this.id);
        if (element_check) { proteome_index_options.cache = element_check.checked; }
        //////////////////////////////////////////////////////////////////
        // DB_GUARD INSTRUCTIONS /////////////////////////////////////////
        let obj1a = { };
        let obj1b = { };
        let obj2a = { };
        let obj2b = { };
        // file_guard command for updating the metadata
        obj1a.command       =   'update_metadata';
        obj1a.database      =   'xspecies_db';
        obj1a.table         =   table_name1; // table name
        obj1a.num_records   =   this.cross_species_proteome_map_record.species1.num_records;
        // file_guard command for saving the map record
        obj1b.command       =   'xspecies_to_db';
        obj1b.database      =   'xspecies_db';
        obj1b.table         =   table_name1; // table name
        obj1b.data          =   [];
        // file_guard command for updating the metadata
        obj2a.command       =   'update_metadata';
        obj2a.database      =   'xspecies_db';
        obj2a.table         =   table_name2; // table name
        obj2a.num_records   =   this.cross_species_proteome_map_record.species2.num_records;
        // file_guard command for saving the map record
        obj2b.command       =   'xspecies_to_db';
        obj2b.database      =   'xspecies_db';
        obj2b.table         =   table_name2; // table name
        obj2b.data          =   [];
        //////////////////////////////////////////////////////////////////
        // CREATE ORGANISM OBJECTS ///////////////////////////////////////
        const organism1 = { };
        const organism2 = { };
        // species 1
        organism1.name              = name1;
        organism1.metadata_db       = obj1a;
        organism1.xspecies_db       = obj1b;
        organism1.current_id        = id1;
        organism1.current_defline   = '';
        organism1.current_sequence  = '';
        organism1.max_id            = max_id1;
        organism1.map               = [];
        organism1.map_defline       = '';
        organism1.mrca              = mya;
        organism1.this              = this.actions.cross_species_proteome_map.species1;
        organism1.parent_this       = this;
        // species 2
        organism2.name              = name2;
        organism2.metadata_db       = obj2a;
        organism2.xspecies_db       = obj2b;
        organism2.current_id        = id2;
        organism2.current_defline   = '';
        organism2.current_sequence  = '';
        organism2.max_id            = max_id2;
        organism2.map               = [];
        organism2.map_defline       = '';
        organism2.mrca              = mya;
        organism2.this              = this.actions.cross_species_proteome_map.species2;
        organism2.parent_this       = this;
        // options
        const options                   =   { };
        options.score                   =   { };
        options.score.matrix            =   mrca_to_blosum(mya);
        options.score.gapped            =   true;
        options.score.gap_open          =   options.score.matrix.default_gap_open;
        options.score.gap_extend        =   options.score.matrix.default_gap_extend;
        options.score.rescale_matrix    =   false;
        options.search_space            =   { };
        options.seed                    =   { };
        // create elements for the output terminal
        hide_loading_box(true);
        const dd = organism1.parent_this.create_dropdown_section(guid(), organism1.parent_this);
        const terminal = organism1.parent_this.create_output_terminal();
        create_progress_bar("Cross-species Mapping", true);
        const progress_bar_general = document.getElementById("progress-bar-general");
        const terminal_bttn = document.createElement("div");
        const terminal_section = document.createElement("div");
        const terminal_section_title = document.createElement("div");
        terminal_section_title.innerHTML = '<div class="center"><div class="document"><b>BLAST algorithm raw output</b></div></div>';
        progress_bar_general.appendChild(terminal_bttn);
        progress_bar_general.appendChild(terminal_section);
        terminal_bttn.appendChild(dd.bttn_area);
        terminal_section.appendChild(dd.section_area);
        dd.section_area.appendChild(terminal_section_title);
        dd.section_area.appendChild(terminal.element);
        progress_bar_general.style.display = "none";
        hide_progress_bar(true);
        //////////////////////////////////////////////////////////////////
        // IMPORT TABLES /////////////////////////////////////////////////
        update_xspecies_metadata(organism1).then(() => { this.update(); });
        update_xspecies_metadata(organism2).then(() => { this.update(); });
        xspecies_proteome_index(organism1, organism2)
        .then(() => { xspecies_proteome_index(organism2, organism1); })
        //////////////////////////////////////////////////////////////////
        // METHOD ////////////////////////////////////////////////////////
        function xspecies_proteome_index(organism1, organism2) {
          //////////////////////////////////////////////////////////////
          //  Once the databases are loaded, either on the client-    //
          //  or the server side, this function cycles through the    //
          //  following worker "complete" messages and function(s):   //
          //      organism1.proteome_db-----> select                  //
          //      organism2.index_db--------> select                  //
          //      organism2.proteome_db-----> select                  //
          //      organism1.alignment-------> proteome_index                  //
          //      save_xspecies_map(organism1)                        //
          //  Each of the above message handlers has a fallback       //
          //  option for proceeding to save_xspecies_map and then     //
          //  returning to the start of the cycle if alignment        //
          //  information is lacking at that stage.                   //
          //////////////////////////////////////////////////////////////
          return new Promise(function(resolve, reject) {
            //////////////////////////////////////////////////////////
            // LOCAL VARIABLES ///////////////////////////////////////
            let amount_masked = 0;
            let kmers = [];
            let kmer_size = 4;
            organism1.proteome_db = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
            organism2.proteome_db = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
            organism1.alignment   = new Worker(current_base_url + '/workers/js/alignment.js?version='    + guid());
            organism2.index_db    = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
            if (proteome_index_options.cache) {
              options.seed.filter_low_complexity = false;
              hide_loading_box(true);
              create_loading_box("Loading Proteins", true);
              let job = { command: 'load', database: 'proteome_db', table: organism1.name, limit: organism1.this.proteome_record.num_records };
              organism1.proteome_db.postMessage(job);
            } // end if
            else {
              options.seed.filter_low_complexity = true;
              hide_loading_box(true);
              create_loading_box("Connecting to Databases", true);
              job = { command: 'connect', database: 'proteome_db', table: organism1.name };
              organism1.proteome_db.postMessage(job);
            } // end else
            //////////////////////////////////////////////////////////
            // ORGANISM1 PROTEOME_DB MESSAGES ////////////////////////
            organism1.proteome_db.onmessage = function(e) {
              switch(e.data.status) {
                case 'complete': {
                  switch(e.data.command) {
                    case 'load': {
                      let job = { command: 'structure', type: 'auto_increment', column: 'id' };
                      organism1.proteome_db.postMessage(job);
                      break;
                    } // end case
                    case 'connect': {
                      let job = { command: 'connect', database: 'proteome_db', table: organism2.name };
                      organism2.proteome_db.postMessage(job);
                      break;
                    } // end case
                    case 'transform': {
                      hide_progress_bar();
                      show_loading_box();
                      loading_box_text("Loading Proteins");
                      let job = { command: 'load', database: 'proteome_db', table: organism2.name, limit:  organism2.this.proteome_record.num_records };
                      organism2.proteome_db.postMessage(job);
                      break;
                    } // end case
                    case 'select': {
                      organism1.current_sequence = e.data.record[0].sequence;
                      organism1.current_defline  = organism1.parent_this.clean_defline(e.data.record[0].defline);
                      kmers = [];
                      for (let j = kmer_size; j <= organism1.current_sequence.length; j++) {
                        let kmer = organism1.current_sequence.substring(j - kmer_size, j);
                        if (/[a-z]/.test(kmer)) { kmer = kmer.toUpperCase(); }
                        if (kmers.indexOf(kmer) === -1) { kmers.push(kmer); }
                      } // end for loop
                      let job = { command: 'select', where: [] };
                      for (let j = 0; j < kmers.length; j++) {
                        job.where.push({ key: 'kmer', value: kmers[j] });
                      } // end for loop
                      if (job.where.length) { organism2.index_db.postMessage(job); }
                      else {
                        organism1.map = "0";
                        save_xspecies_map(organism1)
                        .then(() => {
                          organism1.current_id++;
                          if (organism1.current_id > organism1.max_id) {
                            organism1.proteome_db.terminate();
                            organism2.proteome_db.terminate();
                            organism1.alignment.terminate();
                            organism2.index_db.terminate();
                            hide_progress_bar(); hide_loading_box();
                            resolve();
                          } // end if
                          else {
                            job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                            organism1.proteome_db.postMessage(job);
                          } // end else
                        }); // end then
                      } // end else
                      break;
                    } // end case
                    case 'structure': {
                      hide_loading_box();
                      create_progress_bar("Masking Low Complexity Regions", true, organism1.this.proteome_record.num_records);
                      let job = { command: 'transform', column: [{ key: 'sequence' }], transformation: 'seg', options: { w: 10, k2_1: 1.8, k2_2: 2.1 } };
                      organism1.proteome_db.postMessage(job);
                      break;
                    } // end case
                    default: { break; }
                  } // end switch
                  break;
                } // end case
                case 'progress': {
                  switch(e.data.command) {
                    case 'transform': {
                      update_progress_bar(e.data.amount);
                      amount_masked += e.data.amount;
                      progress_bar_subtitle("Sequence " + amount_masked + " of " + organism1.this.proteome_record.num_records);
                      break;
                    } // end case
                    default: { break; }
                  } // end switch
                  break;
                } // end case
                default: { break; }
              } // end switch
            } // end function
            //////////////////////////////////////////////////////////
            // ORGANISM1 ALIGNMENT MESSAGES //////////////////////////
            organism1.alignment.onmessage = function(e) {
              switch(e.data.status) {
                case 'complete': {
                  switch(e.data.command) {
                    case 'blast': {
                      let best_expect = Infinity;
                      let best_score = -Infinity;
                      let best_choice = "";
                      let best_defline = '';
                      let report_array = e.data.result;
                      for (let i = 0; i < report_array.length; i++) {
                        if (report_array[i].significant && (report_array[i].expect < best_expect)) {
                          best_expect  = report_array[i].expect;
                          best_score   = report_array[i].score;
                          best_choice  = report_array[i].data.id;
                          best_defline = report_array[i].data.defline;
                        } // end if
                        else if (report_array[i].significant && (report_array[i].expect === best_expect)) {
                          if (report_array[i].score > best_score) {
                            best_expect  = report_array[i].expect;
                            best_score   = report_array[i].score;
                            best_choice  = report_array[i].data.id;
                            best_defline = report_array[i].data.defline;
                          } // end if
                          else if (report_array[i].score === best_score) {
                            best_choice  = best_choice  + ","  + report_array[i].data.id;
                            best_defline = best_defline + "; " + report_array[i].data.defline;
                          } // end else if
                        } // end else if
                      } // end for loop
                      if (!best_choice) {
                        best_defline = "No matching protein";
                        best_choice = "0";
                      } // end if
                      organism1.map = best_choice;
                      organism1.map_defline = organism1.parent_this.clean_defline(best_defline);
                      save_xspecies_map(organism1)
                      .then(() => {
                        organism1.current_id++;
                        if (organism1.current_id > organism1.max_id) {
                          organism1.proteome_db.terminate();
                          organism2.proteome_db.terminate();
                          organism1.alignment.terminate();
                          organism2.index_db.terminate();
                          hide_progress_bar(); hide_loading_box();
                          resolve();
                        } // end if
                        else {
                          let job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                          organism1.proteome_db.postMessage(job);
                        } // end else
                      }); // end then
                      break;
                    } // end case
                    default: { break; }
                  } // end switch
                  break;
                } // end case
                default: { break; }
              } // end switch
            } // end function
            //////////////////////////////////////////////////////////
            // ORGANISM2 PROTEOME_DB /////////////////////////////////
            organism2.proteome_db.onmessage = function(e) {
              switch(e.data.status) {
                case 'complete': {
                  switch(e.data.command) {
                    case 'load': {
                      let job = { command: 'structure', type: 'auto_increment', column: 'id' };
                      organism2.proteome_db.postMessage(job);
                      break;
                    } // end case
                    case 'connect': {
                      let job = { command: 'connect', database: 'proteome_index_db',  table: organism2.name };
                      organism2.index_db.postMessage(job);
                      break;
                    } // end case
                    case 'select': {
                      options.search_space.num_characters = organism2.this.proteome_record.options.num_characters;
                      options.search_space.num_sequences  = organism2.this.proteome_record.num_records;
                      let choices = [];
                      let lower_size = organism1.current_sequence.length * 0.25;
                      let upper_size = organism1.current_sequence.length * 1.75;
                      for (let i = 0; i < e.data.record.length; i++) {
                        if ((e.data.record[i].sequence.length > lower_size) && (e.data.record[i].sequence.length < upper_size)) {
                          choices.push(e.data.record[i]);
                        } // end if
                      } // end for loop
                      if (choices.length) {
                        let job = { status: 'command', command: 'blast', query: organism1.current_sequence, subject: choices, options: options };
                        organism1.alignment.postMessage(job);
                      } // end if
                      else {
                        organism1.map = "0";
                        save_xspecies_map(organism1)
                        .then(() => {
                          organism1.current_id++;
                          if (organism1.current_id > organism1.max_id) {
                            organism1.proteome_db.terminate();
                            organism2.proteome_db.terminate();
                            organism1.alignment.terminate();
                            organism2.index_db.terminate();
                            hide_progress_bar(); hide_loading_box();
                            resolve();
                          } // end if
                          else {
                            job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                            organism1.proteome_db.postMessage(job);
                          } // end else
                        }); // end then
                      } // end else
                      break;
                    } // end case
                    case 'structure': {
                      hide_progress_bar();
                      show_loading_box();
                      loading_box_text("Loading Protein Indices");
                      let job = { command: 'load', database: 'proteome_index_db',  table: organism2.name, limit: organism2.this.proteome_index_record.num_records };
                      organism2.index_db.postMessage(job);
                      break;
                    } // end case
                    default: { break; }
                  } // end switch
                  break;
                } // end case
                default: { break; }
              } // end switch
            } // end function
            //////////////////////////////////////////////////////////
            // ORGANISM2 INDEX_DB MESSAGES ///////////////////////////
            organism2.index_db.onmessage = function(e) {
              switch(e.data.status) {
                case 'complete': {
                  switch(e.data.command) {
                    case 'load': {
                      hide_loading_box();
                      create_loading_box("Organizing Protein indices", true);
                      let job = { command: 'structure', type: 'tree', column: 'kmer' };
                      organism2.index_db.postMessage(job);
                      break;
                    } // end case
                    case 'connect': {
                      hide_loading_box(true);
                      create_progress_bar("Cross-species Mapping", true, organism1.this.proteome_record.num_records);
                      progress_bar_general.style.display = "";
                      update_progress_bar(organism1.current_id);
                      let job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                      organism1.proteome_db.postMessage(job);
                      break;
                    } // end case
                    case 'select': {
                      let preMap = { };
                      let map = { id: organism1.current_id, sequences: [] };
                      if (e.data.record.length) {
                        for (let h = 0; h < e.data.record.length; h++) {
                          if (e.data.record[h]) {
                            if (e.data.record[h].sequences) {
                              let location = e.data.record[h].sequences.split(',');
                              for (let i = 0; i < location.length; i++) {
                                if (!preMap[location[i]]) { preMap[location[i]] = 1; }
                                else { preMap[location[i]]++; }
                              } // end for loop
                            } // end if
                          } // end if
                        } // end for loop
                      } // end if
                      let keys = Object.keys(preMap);
                      let lower_kmer_ident = Math.round(organism1.current_sequence.length * CDHIT["99"][CDHIT_percent_identity][kmer_size]);
                      for (let i = 0; i < keys.length; i++) {
                        if (preMap[keys[i]] >= lower_kmer_ident) { map.sequences.push(keys[i]); }
                      } // end for loop
                      if (map.sequences.length) {
                        let job = { command: 'select', where: [] };
                        for (let i = 0; i < map.sequences.length; i++) {
                          let obj = { };
                          obj.key = "id";
                          obj.value = map.sequences[i];
                          job.where.push(obj);
                        } // end for loop
                        organism2.proteome_db.postMessage(job);
                      } // end if
                      else {
                        organism1.map = "0";
                        save_xspecies_map(organism1)
                        .then(() => {
                          organism1.current_id++;
                          if (organism1.current_id > organism1.max_id) {
                            organism1.proteome_db.terminate();
                            organism2.proteome_db.terminate();
                            organism1.alignment.terminate();
                            organism2.index_db.terminate();
                            hide_progress_bar(); hide_loading_box();
                            resolve();
                          } // end if
                          else {
                            job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                            organism1.proteome_db.postMessage(job);
                          } // end else
                        }); // end then
                      } // end else
                      break;
                    } // end case
                    case 'structure': {
                      hide_loading_box(true);
                      create_progress_bar("Cross-species Mapping", true, organism1.this.proteome_record.num_records);
                      progress_bar_general.style.display = "";
                      update_progress_bar(organism1.current_id);
                      let job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                      organism1.proteome_db.postMessage(job);
                      break;
                    } // end case
                    default: { break; }
                  } // end switch
                  break;
                } // end case
                default: { break; }
              } // end switch
            } // end function
            //////////////////////////////////////////////////////////
          }.bind(this)); // end Promise
        } // function
        //////////////////////////////////////////////////////////////////
        // METHOD ////////////////////////////////////////////////////////
        function update_xspecies_metadata(organism) {
          return new Promise(function(resolve, reject) {
            if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
            else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
            xmlhttp.onreadystatechange = function() {
              if (this.readyState == 4) {
                if (this.status == 200) { resolve(); }
                else { console.log('Could not update metadata'); }
              } // end if
            }; // end function
            let send_message = "execute=true";
            send_message += "&json=" + JSON.stringify(organism.metadata_db);
            xmlhttp.open("POST", current_base_url + "/api/file_guard", true);
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlhttp.send(send_message);
          }.bind(this)); // end Promise
        } // end function
        //////////////////////////////////////////////////////////////////
        // METHOD ////////////////////////////////////////////////////////
        function save_xspecies_map(organism) {
          return new Promise(function(resolve, reject) {
            let save = false; // a quick way to turn this function off
            if (!organism.map) { organism.map = "0"; }
            if (save) {
              let xmlhttp = new XMLHttpRequest();
              xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4) {
                  if (this.status == 200) {
                    if (this.responseText) { console.log(this.responseText); }
                    terminal.add_line("Protein " + organism.current_id + " out of " + organism.max_id);
                    terminal.add_line(organism.current_defline);
                    terminal.add_line(organism.map_defline);
                    terminal.add_line("&nbsp;");
                    progress_bar_subtitle("Protein " + organism.current_id + " out of " + organism.max_id);
                    update_progress_bar(1);
                    update_xspecies_metadata(organism);
                    resolve();
                  } // end if
                  else { save_xspecies_map(organism).then(() => { resolve(); }); }
                } // end if
              }; // end function
              let obj = { id: organism.current_id, map: organism.map };
              organism.xspecies_db.data = [];
              organism.xspecies_db.data.push(obj);
              let send_message = "execute=true";
              send_message += "&json=" + JSON.stringify(organism.xspecies_db);
              xmlhttp.open("POST", current_base_url + "/api/file_guard", true);
              xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
              xmlhttp.send(send_message);
            } // end if
            else {
              terminal.add_line("Protein " + organism.current_id + " out of " + organism.max_id);
              terminal.add_line(organism.current_defline);
              terminal.add_line(organism.map_defline);
              terminal.add_line("&nbsp;");
              progress_bar_subtitle("Protein " + organism.current_id + " out of " + organism.max_id);
              update_progress_bar(1);
              resolve();
            } // end else
          }); // end Promise
        } // end function
        ////////////////////////////////////////////////////////////////////
      }) // end then
    }) // end then
  }.bind(this)); // end event listener
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  function find_MRCA(name1, name2) {
    return new Promise(function(resolve, reject) {
      create_loading_box("Finding most recent common ancestor", true);
      if(typeof(name1) === 'undefined') { return; }
      if(typeof(name2) === 'undefined') { return; }
      if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
      else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200 && this.responseText) {
            hide_loading_box();
            const json = JSON.parse(this.responseText);
            if (json.time) {
              const time = json.time.toFixed(1);
              resolve(time);
            } // end if (json.time)
            else { return 500.00; }
          } // end if (this.status == 200 && this.responseText)
        } // end if (this.readyState == 4)
      }; // end function xmlhttp.onreadystatechange
      let send_message = "name1=" + name1;
      send_message += "&name2=" + name2;
      xmlhttp.open("POST", current_base_url + "/api/MRCA_finder", true);
      xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xmlhttp.send(send_message);
    }); // end Promise
  } // end function
  ////////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
