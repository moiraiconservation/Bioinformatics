///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS /////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function AlignmentRecord() {
  ////////////////////////////////////////////////////////////////////////
  // This object is the data structure that gets stored in our databases//
  // when storing a raw feature of a sequence.  For example, discovered //
  // cis-regulatory DNA elements, such as promoters will be stored as   //
  // table entries as a "stringified" Alignment object.  The idea       //
  // behind the chosen elements of this object is to provide adequate   //
  // background information behind how the location of the feature was  //
  // discovered.  These elements will include Report objects returned   //
  // from BLAST searches, query sequence sources, and AlignmentOptions  //
  // used to provide alignment settings.                                //
  //====================================================================//
  // NOTE: Some (or all) elements may be left blank before storing this //
  // object into a database.                                            //
  ////////////////////////////////////////////////////////////////////////
  this.method                   = ""; // global, local, semiglobal, blast, etc.
  this.options                  = undefined;
  this.query_accession          = "";
  this.query_db                 = "";
  this.query_defline            = "";
  this.query_id                 = "";
  this.query_id_range           = "";
  this.query_source_organism    = "";
  this.report                   = undefined;
  this.subject_accession        = "";
  this.subject_db               = "";
  this.subject_defline          = "";
  this.subject_id               = "";
  this.subject_id_range         = "";
  this.subject_source_organism  = "";
} // end function
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function AlignmentOptions(matrix, record) {
  ////////////////////////////////////////////////////////////////////////
  //  This object represents the "options" data structure needed for    //
  //  the Alignment.js worker, and provides settings for pairwise       //
  //  alignments and BLAST searches.  If a scoring matrix is supplied   //
  //  on creation, the object sets the proper default values for either //
  //  a nucleotide BLAST or a protein BLAST depending on the type of    //
  //  matrix supplied.  (See the scoring_matrices.js file for examples  //
  //  of properly-formatted scoring matrices.)  The proper search space //
  //  statistice can be set automatically as well if a bioaction        //
  //  record is supplied as an argument.  (See the BioactionRecord      //
  //  object below for more detailes.)                                  //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(matrix) === "undefined") { matrix = BLOSUM62; }
  if (typeof(record) === "undefined") { record = new BioactionRecord; }
  if (typeof(record.options) === "undefined") { record.options = { num_characters: 0 }; }
  if (typeof(record.num_records) == "undefined") { record.num_records = 0; }
  if (typeof(record.options.num_characters) == "undefined") { record.options.num_characters = 0; }
  ////////////////////////////////////////////////////////////////////////
  // ESTABLISH THE INTERNAL OBJECTS //////////////////////////////////////
  this.score        = { };
  this.seed         = { };
  this.search_space = { };
  this.x_drop       = { };
  ////////////////////////////////////////////////////////////////////////
  // SET CUSTOM OPTIONS //////////////////////////////////////////////////
  if (matrix.type === "amino acids") {
    //  Option                        Value       NCBI command-line equivalent
    //=========================================================================
    this.batch                        = 0;
    this.evaluation_method            = "standard";
    this.expect_threshold_1           = 10.0;     //  -e  (NCBI BLAST)
    this.expect_threshold_2           = 0.001;    //  -e  (NCBI BLAST)
    this.multithreading               = true;     //
    this.record                       = record;   //
    this.score.gap_extend             = matrix.default_gap_extend;  //  -E  (NCBI BLAST)
    this.score.gap_open               = matrix.default_gap_open;    //  -G  (NCBI BLAST)
    this.score.gapped                 = true;     //  -g  (NCBI BLAST)
    this.score.matrix                 = matrix;   //  -M  (NCBI BLAST)
    this.score.rescale_matrix         = false;    //
    this.search_space.num_characters  = record.options.num_characters;
    this.search_space.num_sequences   = record.num_records;
    this.seed.exact_match             = false;    //
    this.seed.max_number              = 10000;    //
    this.seed.filter_low_complexity   = true;     //  -F  (NCBI BLAST)
    this.seed.score_threshold         = 11;       //  -f  (NCBI BLAST)
    this.seed.word_size               = 4;        //  -W  (NCBI BLAST)
    this.single_hit_algorithm         = false;    //  -P  (NCBI BLAST)
    this.two_hit_window_size          = 40;       //  -A  (NCBI BLAST)
    this.x_drop.X1                    = 7;        //  -y  (NCBI BLAST)
    this.x_drop.X2                    = 15;       //  -X  (NCBI BLAST)
    this.x_drop.X2_trigger            = 22;       //  -N  (NCBI PSI-BLAST)
  } // end if
  if (matrix.type === "nucleotides") {
    //  Option                        Value       NCBI command-line equivalent
    //=========================================================================
    this.batch                        = 0;
    this.evaluation_method            = "standard"; // "genblasta";
    this.expect_threshold_1           = 10.0;     //  -e  (NCBI BLAST)
    this.expect_threshold_2           = 0.001;    //  -e  (NCBI BLAST)
    this.multithreading               = true;       //
    this.record                       = record;     //
    this.score.gap_extend             = matrix.default_gap_extend;  //  -E  (NCBI BLAST)
    this.score.gap_open               = matrix.default_gap_open;    //  -G  (NCBI BLAST)
    this.score.gapped                 = true;       //  -g  (NCBI BLAST)
    this.score.matrix                 = matrix;     //  -M  (NCBI BLAST)
    this.score.rescale_matrix         = false;      //
    this.search_space.num_characters  = record.options.num_characters;
    this.search_space.num_sequences   = record.num_records;
    this.seed.exact_match             = true;       //
    this.seed.filter_low_complexity   = true;       //  -F  (NCBI BLAST)
    this.seed.max_number              = Infinity;   //
    this.seed.score_threshold         = 11;         //  -f  (NCBI BLAST)
    this.seed.word_size               = 11;         //  -W  (NCBI BLAST)
    this.single_hit_algorithm         = true;       //  -P  (NCBI BLAST)
    this.two_hit_window_size          = 40;         //  -A  (NCBI BLAST)
    this.x_drop.X1                    = 20;         //  -y  (NCBI BLAST)
    this.x_drop.X2                    = 30;         //  -X  (NCBI BLAST)
    this.x_drop.X2_trigger            = 22;         //  -N  (NCBI PSI-BLAST)
  } // end if
} // end function
///////////////////////////////////////////////////////////////////////////////
// ALIGNMENTOPTIONS PROTOTYPES GETTERS / SETTERS //////////////////////////////
AlignmentOptions.prototype = {
  get matrix() {
    return this.score.matrix;
  }, // end get
  get record() {
    return this.record;
  },
  set matrix(matrix) {
    if (typeof(matrix) === "undefined") { matrix = BLOSUM62; }
    this.score.matrix     = matrix;
    this.score.gap_open   = matrix.default_gap_open;
    this.score.gap_extend = matrix.default_gap_extend;
  }, // end set
  set record(record) {
    if (typeof(record) === "undefined") { record = new BioactionRecord; }
    if (typeof(record.options) === "undefined") { record.options = { num_characters: 0 }; }
    if (typeof(record.num_records) == "undefined") { record.num_records = 0; }
    if (typeof(record.options.num_characters) == "undefined") { record.options.num_characters = 0; }
    this.search_space.num_characters = record.options.num_characters;
    this.search_space.num_sequences = record.num_records;
  } // end set
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function BioactionRecord() {
  this.metadata              = { };
  this.metadata.day          = 0;
  this.metadata.delta_second = 0;
  this.metadata.hour         = 0;
  this.metadata.minute       = 0;
  this.metadata.owner        = false;
  this.metadata.second       = 0;
  this.metadata.year         = 0;
  this.num_records           = 0;
  this.num_uploaded          = 0;
  this.options               = undefined;
  this.percent_uploaded      = 0;
} // end object
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function BioactionState(description, lock_delay) {
  if (typeof(description) === "undefined") { description = "generic"; }
  if (typeof(lock_delay ) === "undefined") { lock_delay = 300; /* 5 min */ }
  this.callback           = undefined;
  this.callback_arguments = [];
  this.cleanup            = undefined;
  this.date               = undefined;
  this.delta_second       = 0;
  this.description        = description;
  this.id                 = guid();
  this.lock_delay         = lock_delay;
  this.percent_complete   = 0;
  this.skin               = undefined;
  this.status             = "loading";
  this.timer              = undefined;
} // end object
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function BioactionOptions() {
  this.callback = undefined;
  this.callback_arguments = [];
  this.element_id = undefined;
  this.initial_status = "loading";
  this.note = undefined;
  this.skin = undefined;
} // end function
///////////////////////////////////////////////////////////////////////////////
// BIOACTION OBJECT ///////////////////////////////////////////////////////////
function Bioaction() {
  //////////////////////////////////////////////////////////////////////
  // INITIALIZE VARIABLES //////////////////////////////////////////////
  this.common_name      = "";
  this.genus            = "";
  this.id               = guid();
  this.scientific_name  = "";
  this.species          = "";
  // loading box text
  this.loading_box_text           =  { };
  this.loading_box_text.working   =   [];
  this.loading_box_text.working.push('Working');
  this.loading_box_text.working.push('Still working');
  this.loading_box_text.working.push("Calculating");
  this.loading_box_text.working.push("Still calculating");
  // universal tooltips
  this.locked_tooltip = 'This record is either in the process of being updated by another user, or this record was last updated recently and needs a few minutes to reset.  Unlocking will occur automatically when the proper records are available.  You do not need to reload the page.';
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset = function() {
    this.reset_actions();
    this.reset_cds_index_record();
    this.reset_cds_record();
    this.reset_cross_species_proteome_map_record();
    this.reset_gene_map_record();
    this.reset_genome_index_record();
    this.reset_genome_record();
    this.reset_html_elements();
    this.reset_last_focus();
    this.reset_lifespan_estimator_record();
    this.reset_mrca();
    this.reset_ncbi_record();
    this.reset_proteome_index_record();
    this.reset_proteome_record();
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_actions = function() {
    // protein import
    this.actions = { };
    this.actions.cds_import = new BioactionState("cds import", 300); // 5 minute delay
    this.actions.cds_index = new BioactionState("cds index", 300); // 5 minute delay
    this.actions.cross_species_proteome_map = new BioactionState("cross-species protein map", 300); // 5 minute delay
    this.actions.cross_species_proteome_map.species1 = undefined;
    this.actions.cross_species_proteome_map.species2 = undefined;
    this.actions.gene_map = new BioactionState("gene map", 300); // 5 minute delay
    this.actions.genome_import = new BioactionState("genome import", 300); // 5 minute delay
    this.actions.genome_index = new BioactionState("genome index", 1800); // 30 minute delay
    this.actions.lifespan_estimator = new BioactionState("lifespan estimator", 1800); // 30 minute delay
    this.actions.proteome_import = new BioactionState("proteome import", 300); // 5 minute delay
    this.actions.proteome_index = new BioactionState("proteome index", 300); // 5 minute delay
    this.actions.proteome_statistics = new BioactionState("statistics", 0);
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_cds_index_record = function() {
    if (this.cds_index_record) { delete this.cds_index_record; }
    this.cds_index_record = new BioactionRecord;
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_cds_record = function() {
    if (this.cds_record) { delete this.cds_record; }
    this.cds_record = new BioactionRecord;
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_cross_species_proteome_map_record = function() {
    if (this.cross_species_proteome_map_record) { delete this.cross_species_proteome_map_record; }
    this.cross_species_proteome_map_record = new BioactionRecord;
    this.cross_species_proteome_map_record.species1 = new BioactionRecord;
    this.cross_species_proteome_map_record.species2 = new BioactionRecord;
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_gene_map_record = function() {
    if (this.gene_map_record) { delete this.gene_map_record; }
    this.gene_map_record = new BioactionRecord;
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_genome_index_record = function() {
    if (this.genome_index_record) { delete this.genome_index_record; }
    this.genome_index_record = new BioactionRecord;
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_genome_record = function() {
    if (this.genome_record) { delete this.genome_record; }
    this.genome_record = new BioactionRecord;
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_html_elements = function() {
    if (this.html_element) {
      Object.values(this.html_element).forEach(element => {
        while (element.firstChild) { element.removeChild(element.firstChild); }
        element.innerHTML = '';
      }); // end forEach
    } // end if
    this.html_element = { };
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_last_focus = function() {
    this.last_focus = '';
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_lifespan_estimator_record = function() {
    if (this.lifespan_estimator_record) { delete this.lifespan_estimator_record; }
    this.lifespan_estimator_record = new BioactionRecord;
    this.lifespan_estimator_record.estimate = 0.00;
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_mrca = function() {
    this.mrca = { };
    this.mrca.maximum_longevity = 0;
    this.mrca.organism_name = '';
    this.mrca.time = Infinity;
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_ncbi_record = function() {
    this.ncbi_record = { };
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_proteome_index_record = function() {
    if (this.proteome_index_record) { delete this.proteome_index_record; }
    this.proteome_index_record = new BioactionRecord;
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.reset_proteome_record = function() {
    if (this.proteome_record) { delete this.proteome_record; }
    this.proteome_record = new BioactionRecord;
  } // end function
  //////////////////////////////////////////////////////////////////////
  // ACTIONS ///////////////////////////////////////////////////////////
  this.reset();
  //////////////////////////////////////////////////////////////////////
}; // end constructor
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPES GETTERS / SETTERS /////////////////////////////////////
Bioaction.prototype = {
  get organism_name() {
    if (this.genus && this.species) {
      this.scientific_name = this.genus + ' ' + this.species;
      return this.scientific_name;
    } // end if
    else if (this.genus) { return this.genus; }
    else if (this.species) { return this.species; }
    else { return ''; }
  }, // end get
  set organism_name(name) {
    if (name) {
      this.reset();
      name = this.format_organism_name(name);
      let split_name = name.split(" ");
      this.genus   = split_name[0];
      this.species = split_name[1];
    } // end if
    else {
      this.genus   = "";
      this.species = "";
      this.scientific_name = "";
      this.common_name = "";
      this.reset();
    } // end else
  } // end set
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.clean_defline = function(defline, no_name) {
  if (typeof(no_name) === "undefined") { no_name = false; }
  defline = defline.replace(/PREDICTED: /ig, '');
  defline = defline.replace(/LOW QUALITY PROTEIN: /ig, '');
  if (no_name) { defline = defline.replace("[" + this.organism_name + "]", ''); }
  defline = defline.trim();
  return defline;
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.evaluate_lock = function(action, record) {
  if (typeof(action) == 'undefined') { return; }
  if (typeof(record) == 'undefined') { return; }
  ////////////////////////////////////////////////////////////////////////
  // ADJUST THE LOCK BAR WIDTH  //////////////////////////////////////////
  action.delta_second = record.metadata.delta_second || 0;
  if (action.skin.lock_bar && action.status == 'locked') {
    if ((action.lock_delay - action.delta_second) > 0) {
      const lock_bar_width = ((action.lock_delay - action.delta_second) / action.lock_delay) * 100;
      action.skin.lock_bar.style.width = lock_bar_width.toFixed(2) + "%";
    } // end if
    else { action.skin.lock_bar.style.width = "0%"; }
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // EVALUATE THE ACTION STATUS //////////////////////////////////////////
  if (action.status === "inactive") { action.skin.update(action); }
  else {
    if ((record.metadata.delta_second !== 0) || (record.metadata.year == 0)) {
      if (action.skin.button && action.skin.status) {
        // the action has not started, or the action has started and it's not locked
        if ((!record.num_uploaded && !record.metadata.delta_second) || (isFinite(record.percent_uploaded) && (record.percent_uploaded < 100) && (record.metadata.delta_second >= action.lock_delay))) {
          if ((action.status !== 'button') || (record.percent_uploaded > action.percent_complete)) {
            action.status = 'button';
            action.percent_complete = record.percent_uploaded;
            action.skin.update(action);
          } // end if
          if (typeof(action.timer) === 'undefined') {
            if (action.id === this.actions.cds_import.id                ) { action.timer = setInterval(function() { this.get_cds_record();                        }.bind(this), 5000); }
            if (action.id === this.actions.cds_index.id                 ) { action.timer = setInterval(function() { this.get_cds_index_record();                  }.bind(this), 5000); }
            if (action.id === this.actions.cross_species_proteome_map.id) { action.timer = setInterval(function() { this.get_cross_species_proteome_map_record(); }.bind(this), 5000); }
            if (action.id === this.actions.gene_map.id                  ) { action.timer = setInterval(function() { this.get_gene_map_record();                   }.bind(this), 5000); }
            if (action.id === this.actions.genome_import.id             ) { action.timer = setInterval(function() { this.get_genome_record();                     }.bind(this), 5000); }
            if (action.id === this.actions.genome_index.id              ) { action.timer = setInterval(function() { this.get_genome_index_record();               }.bind(this), 5000); }
            if (action.id === this.actions.lifespan_estimator.id        ) { action.timer = setInterval(function() { this.get_lifespan_estimator_record();         }.bind(this), 5000); }
            if (action.id === this.actions.proteome_import.id           ) { action.timer = setInterval(function() { this.get_proteome_record();                   }.bind(this), 5000); }
            if (action.id === this.actions.proteome_index.id            ) { action.timer = setInterval(function() { this.get_proteome_index_record();             }.bind(this), 5000); }
          } // end if
        } // end if
        // the action is running and it's locked
        else if (isFinite(record.percent_uploaded) && (record.percent_uploaded < 100) && (record.metadata.delta_second < action.lock_delay)) {
          if ((action.status !== 'locked') || (record.percent_uploaded > action.percent_complete)) {
            action.status = 'locked';
            action.percent_complete = record.percent_uploaded;
            action.skin.update(action);
          } // end if
          if (typeof(action.timer) === 'undefined') {
            if (action.id === this.actions.cds_import.id                ) { action.timer = setInterval(function() { this.get_cds_record();                        }.bind(this), 5000); }
            if (action.id === this.actions.cds_index.id                 ) { action.timer = setInterval(function() { this.get_cds_index_record();                  }.bind(this), 5000); }
            if (action.id === this.actions.cross_species_proteome_map.id) { action.timer = setInterval(function() { this.get_cross_species_proteome_map_record(); }.bind(this), 5000); }
            if (action.id === this.actions.gene_map.id                  ) { action.timer = setInterval(function() { this.get_gene_map_record();                   }.bind(this), 5000); }
            if (action.id === this.actions.genome_import.id             ) { action.timer = setInterval(function() { this.get_genome_record();                     }.bind(this), 5000); }
            if (action.id === this.actions.genome_index.id              ) { action.timer = setInterval(function() { this.get_genome_index_record();               }.bind(this), 5000); }
            if (action.id === this.actions.lifespan_estimator.id        ) { action.timer = setInterval(function() { this.get_lifespan_estimator_record();         }.bind(this), 5000); }
            if (action.id === this.actions.proteome_import.id           ) { action.timer = setInterval(function() { this.get_proteome_record();                   }.bind(this), 5000); }
            if (action.id === this.actions.proteome_index.id            ) { action.timer = setInterval(function() { this.get_proteome_index_record();             }.bind(this), 5000); }
          } // end if
        } // end else if
        // the action has completed
        else if (isFinite(record.percent_uploaded) && (record.percent_uploaded >= 100)) {
          if (action.status !== 'complete') {
            action.status = 'complete';
            action.percent_complete = 100;
            action.date = getDateFromDayNum(record.metadata.day, record.metadata.year);
            action.skin.update(action);
          } // end if
          if (typeof(action.timer) !== 'undefined') {
            clearInterval(action.timer);
            action.timer = undefined;
          } // end if
          if (action.cleanup) {
            window.removeEventListener('beforeunload', action.cleanup);
            action.cleanup = undefined;
          } // end if
          if (action.callback) {
            if (action.callback_arguments.length) {
              action.callback(...action.callback_arguments);
              action.callback = undefined;
              action.callBack_arguments = [];
            } // end if
            else {
              action.callback();
              action.callback = undefined;
            } // end else (action.callback_arguments.length)
          } // end if (action.callback)
        } // end else if (isFinite(record.percent_uploaded) && (record.percent_uploaded >= 100))
      } // end if (action.skin.button && action.skin.status)
    } // end if if ((record.metadata.delta_second !== 0) || (record.metadata.year == 0))
  } // end else (action.status === "inactive")
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.format_organism_name = function(str) {
  str = str.trim();
  str = str.replace(/_/g, ' ');
  str = str.replace(/ +(?= )/g,'');
  str = str.toLowerCase();
  str = str.charAt(0).toUpperCase() + str.slice(1);
  return str;
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
        this.reset_cds_index_record();
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.cds_index_record.metadata.owner  = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.cds_index_record.num_records             = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.cds_index_record.metadata.year           = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.cds_index_record.metadata.day            = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.cds_index_record.metadata.hour           = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.cds_index_record.metadata.minute         = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.cds_index_record.metadata.second         = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.cds_index_record.metadata.delta_second   = parseInt(db_record.delta_second); }
        if (db_record.options) { this.cds_index_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.cds_index_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.cds_index_record.num_records) {
            this.cds_index_record.percent_uploaded = Math.floor((this.cds_index_record.num_uploaded / this.cds_index_record.num_records) * 100);
            if (this.cds_index_record.percent_uploaded >= 100) { check_bounty("cds_index", "cds_index_db", this.organism_name, this.organism_name.replace(" ", "_")); }
          } // end if
        } // end if
      } // end if
    })
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
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
        this.reset_cds_record();
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.cds_record.metadata.owner  = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.cds_record.num_records             = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.cds_record.metadata.year           = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.cds_record.metadata.day            = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.cds_record.metadata.hour           = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.cds_record.metadata.minute         = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.cds_record.metadata.second         = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.cds_record.metadata.delta_second   = parseInt(db_record.delta_second); }
        if (db_record.options) { this.cds_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.cds_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.cds_record.num_records) {
            this.cds_record.percent_uploaded = Math.floor((this.cds_record.num_uploaded / this.cds_record.num_records) * 100);
            if (this.cds_record.percent_uploaded >= 100) { check_bounty("cds_import", "cds_db", this.organism_name, this.organism_name.replace(" ", "_")); }
          } // end if
        } // end if
      } // end if
    })
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_cross_species_proteome_map_record = function() {
  return new Promise(function(resolve, reject) {
    if (this.actions.cross_species_proteome_map.species1 && this.actions.cross_species_proteome_map.species2) {
      let split_name1 = this.actions.cross_species_proteome_map.species1.organism_name.split(' ');
      let split_name2 = this.actions.cross_species_proteome_map.species2.organism_name.split(' ');
      let name1 = split_name1[0][0] + '_' + split_name1[1];
      let name2 = split_name2[0][0] + '_' + split_name2[1];
      let table_name1 = name1 + '_to_' + name2;
      let table_name2 = name2 + '_to_' + name1;
      let obj1 = { };
      let obj2 = { };
      let obj3 = { };
      let obj4 = { };
      obj1.database   =   'xspecies_db';
      obj1.table      =   'table_metadata';
      obj1.command    =   'select';
      obj1.where      =   [ { "key": "id", "value": table_name1 } ];
      obj2.database   =   'xspecies_db';
      obj2.table      =   table_name1;
      obj2.command    =   "count";
      obj3.database   =   'xspecies_db';
      obj3.table      =   'table_metadata';
      obj3.command    =   'select';
      obj3.where      =   [ { "key": "id", "value": table_name2 } ];
      obj4.database   =   'xspecies_db';
      obj4.table      =   table_name2;
      obj4.command    =   "count";
      let json1 = JSON.stringify(obj1);
      let json2 = JSON.stringify(obj2);
      let json3 = JSON.stringify(obj3);
      let json4 = JSON.stringify(obj4);
      db_guard(json1)
      .then(responseText => {
        if (responseText) {
          this.reset_cross_species_proteome_map_record();
          let db_record = JSON.parse(responseText);
          if (typeof(db_record.owner       ) !== 'undefined') { this.cross_species_proteome_map_record.species1.metadata.owner          = db_record.owner; }
          if (typeof(db_record.records     ) !== 'undefined') { this.cross_species_proteome_map_record.species1.num_records             = parseInt(db_record.records     ); }
          if (typeof(db_record.year        ) !== 'undefined') { this.cross_species_proteome_map_record.species1.metadata.year           = parseInt(db_record.year        ); }
          if (typeof(db_record.day         ) !== 'undefined') { this.cross_species_proteome_map_record.species1.metadata.day            = parseInt(db_record.day         ); }
          if (typeof(db_record.hour        ) !== 'undefined') { this.cross_species_proteome_map_record.species1.metadata.hour           = parseInt(db_record.hour        ); }
          if (typeof(db_record.minute      ) !== 'undefined') { this.cross_species_proteome_map_record.species1.metadata.minute         = parseInt(db_record.minute      ); }
          if (typeof(db_record.second      ) !== 'undefined') { this.cross_species_proteome_map_record.species1.metadata.second         = parseInt(db_record.second      ); }
          if (typeof(db_record.delta_second) !== 'undefined') { this.cross_species_proteome_map_record.species1.metadata.delta_second   = parseInt(db_record.delta_second); }
          if (db_record.options) { this.cross_species_proteome_map_record.species1.options = JSON.parse(db_record.options); }
        } // end if
      }) // end then
      .then(() => db_guard(json2))
      .then(responseText => {
        if (responseText) {
          let db_record = JSON.parse(responseText);
          if (db_record['COUNT(*)']) {
            this.cross_species_proteome_map_record.species1.num_uploaded = parseInt(db_record['COUNT(*)']);
            if (this.cross_species_proteome_map_record.species1.num_records) {
              this.cross_species_proteome_map_record.species1.percent_uploaded = Math.floor((this.cross_species_proteome_map_record.species1.num_uploaded / this.cross_species_proteome_map_record.species1.num_records) * 100);
            } // end if
          } // end if
        } // end if
      }) // end then
      .then(() => db_guard(json3))
      .then(responseText => {
        if (responseText) {
          let db_record = JSON.parse(responseText);
          if (typeof(db_record.owner       ) !== 'undefined') { this.cross_species_proteome_map_record.species2.metadata.owner          = db_record.owner; }
          if (typeof(db_record.records     ) !== 'undefined') { this.cross_species_proteome_map_record.species2.num_records             = parseInt(db_record.records     ); }
          if (typeof(db_record.year        ) !== 'undefined') { this.cross_species_proteome_map_record.species2.metadata.year           = parseInt(db_record.year        ); }
          if (typeof(db_record.day         ) !== 'undefined') { this.cross_species_proteome_map_record.species2.metadata.day            = parseInt(db_record.day         ); }
          if (typeof(db_record.hour        ) !== 'undefined') { this.cross_species_proteome_map_record.species2.metadata.hour           = parseInt(db_record.hour        ); }
          if (typeof(db_record.minute      ) !== 'undefined') { this.cross_species_proteome_map_record.species2.metadata.minute         = parseInt(db_record.minute      ); }
          if (typeof(db_record.second      ) !== 'undefined') { this.cross_species_proteome_map_record.species2.metadata.second         = parseInt(db_record.second      ); }
          if (typeof(db_record.delta_second) !== 'undefined') { this.cross_species_proteome_map_record.species2.metadata.delta_second   = parseInt(db_record.delta_second); }
          if (db_record.options) { this.cross_species_proteome_map_record.species2.options = JSON.parse(db_record.options); }
        } // end if
      }) // end then
      .then(() => db_guard(json4))
      .then(responseText => {
        if (responseText) {
          let db_record = JSON.parse(responseText);
          if (db_record['COUNT(*)']) {
            this.cross_species_proteome_map_record.species2.num_uploaded = parseInt(db_record['COUNT(*)']);
            if (this.cross_species_proteome_map_record.species2.num_records) {
              this.cross_species_proteome_map_record.species2.percent_uploaded = Math.floor((this.cross_species_proteome_map_record.species2.num_uploaded / this.cross_species_proteome_map_record.species2.num_records) * 100);
            } // end if
          } // end if
        } // end if
      }) // end then
      .then(() => {
        this.cross_species_proteome_map_record.num_records = this.cross_species_proteome_map_record.species1.num_records + this.cross_species_proteome_map_record.species2.num_records;
        this.cross_species_proteome_map_record.num_uploaded = this.cross_species_proteome_map_record.species1.num_uploaded + this.cross_species_proteome_map_record.species2.num_uploaded;
        if (this.cross_species_proteome_map_record.num_records) {
          if (this.cross_species_proteome_map_record.num_records) {
            this.cross_species_proteome_map_record.percent_uploaded = Math.floor((this.cross_species_proteome_map_record.num_uploaded / this.cross_species_proteome_map_record.num_records) * 100);
          } // end if
        } // end if
        this.update();
        resolve();
      }); // end then
    } // end if
    else { resolve(); }
  }.bind(this)); // end promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_gene_map_record = function() {
  return new Promise(function(resolve, reject) {
    let obj1 = { };
    let obj2 = { };
    obj1.database   =   'gene_map_db';
    obj1.table      =   'table_metadata';
    obj1.command    =   'select';
    obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
    obj2.database   =   'gene_map_db';
    obj2.table      =   this.organism_name.replace(/ /g, '_');
    obj2.command    =   "count";
    let json1 = JSON.stringify(obj1);
    let json2 = JSON.stringify(obj2);
    db_guard(json1)
    .then(responseText => {
      if (responseText) {
        this.reset_gene_map_record();
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.gene_map_record.metadata.owner         = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.gene_map_record.num_records            = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.gene_map_record.metadata.year          = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.gene_map_record.metadata.day           = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.gene_map_record.metadata.hour          = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.gene_map_record.metadata.minute        = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.gene_map_record.metadata.second        = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.gene_map_record.metadata.delta_second  = parseInt(db_record.delta_second); }
        if (db_record.options) { this.gene_map_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.gene_map_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.gene_map_record.num_records) {
            this.gene_map_record.percent_uploaded = Math.floor((this.gene_map_record.num_uploaded / this.gene_map_record.num_records) * 100);
          } // end if
        } // end if
      } // end if
    }) // end then
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
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
        this.reset_genome_index_record();
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.genome_index_record.metadata.owner  = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.genome_index_record.num_records             = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.genome_index_record.metadata.year           = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.genome_index_record.metadata.day            = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.genome_index_record.metadata.hour           = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.genome_index_record.metadata.minute         = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.genome_index_record.metadata.second         = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.genome_index_record.metadata.delta_second   = parseInt(db_record.delta_second); }
        if (db_record.options) { this.genome_index_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.genome_index_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.genome_index_record.num_records) {
            this.genome_index_record.percent_uploaded = Math.floor((this.genome_index_record.num_uploaded / this.genome_index_record.num_records) * 100);
            if (this.genome_index_record.percent_uploaded >= 100) { check_bounty("genome_index", "genome_index_db", this.organism_name, this.organism_name.replace(" ", "_")); }
          } // end if
        } // end if
      } // end if
    }) // end then
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
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
        this.reset_genome_record();
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.genome_record.metadata.owner         = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.genome_record.num_records            = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.genome_record.metadata.year          = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.genome_record.metadata.day           = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.genome_record.metadata.hour          = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.genome_record.metadata.minute        = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.genome_record.metadata.second        = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.genome_record.metadata.delta_second  = parseInt(db_record.delta_second); }
        if (db_record.options) {
          this.genome_record.options = JSON.parse(db_record.options);
          if (this.genome_record.options.bytes_read) { this.genome_record.num_uploaded = this.genome_record.options.bytes_read; }
        } // end if
        if (this.genome_record.num_records) {
          this.genome_record.percent_uploaded = Math.floor((this.genome_record.num_uploaded / this.genome_record.num_records) * 100);
          if (this.genome_record.percent_uploaded >= 100) { check_bounty("genome_import", "genome_db", this.organism_name, this.organism_name.replace(" ", "_")); }
        } // end if
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.genome_record.options.num_records = parseInt(db_record['COUNT(*)']);
        } // end if
      } // end if
    }) // end then
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_lifespan_estimator_record = function() {
  return new Promise(function(resolve, reject) {
    let obj = { };
    obj.database   =   'moirai_db';
    obj.table      =   'mayne';
    obj.command    =   'select';
    obj.where      =   [ { key: "organism_name", value: this.organism_name } ];
    let json = JSON.stringify(obj);
    db_guard(json)
    .then(responseText => {
      if (responseText) {
        this.reset_lifespan_estimator_record();
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.estimate    ) !== 'undefined') { this.lifespan_estimator_record.estimate               = parseFloat(db_record.estimate); }
        if (typeof(db_record.owner       ) !== 'undefined') { this.lifespan_estimator_record.metadata.owner         = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.lifespan_estimator_record.num_records            = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.lifespan_estimator_record.metadata.year          = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.lifespan_estimator_record.metadata.day           = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.lifespan_estimator_record.metadata.hour          = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.lifespan_estimator_record.metadata.minute        = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.lifespan_estimator_record.metadata.second        = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.lifespan_estimator_record.metadata.delta_second  = parseInt(db_record.delta_second); }
        if (db_record.options) { this.lifespan_estimator_record.options = JSON.parse(db_record.options); }
        if (this.lifespan_estimator_record.num_records) {
          this.lifespan_estimator_record.num_uploaded = this.lifespan_estimator_record.num_records;
          this.lifespan_estimator_record.percent_uploaded = 100;
        } // end if
      } // end if
    })
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_ncbi_record = function() {
  return new Promise(function(resolve, reject) {
    let obj    = { };
    obj.database   =   'moirai_db';
    obj.table      =   'ncbi_genome';
    obj.command    =   'select';
    obj.where      =   [ { "key": "organism_name", "value": this.organism_name } ];
    let json = JSON.stringify(obj);
    db_guard(json)
    .then(responseText => {
      if (responseText && (responseText !== '{ }')) {
        this.ncbi_record = JSON.parse(responseText);
        if (this.ncbi_record.genbank) {
          this.ncbi_record.genbank = this.ncbi_record.genbank.replace("&", "and");
          this.ncbi_record.genbank = JSON.parse(this.ncbi_record.genbank);
        } // end if
        if (this.ncbi_record.refseq) {
          this.ncbi_record.refseq = this.ncbi_record.refseq.replace("&", "and");
          this.ncbi_record.refseq = JSON.parse(this.ncbi_record.refseq);
        } // end if
      } // end if
    }) // end then
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
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
        this.reset_proteome_index_record();
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.proteome_index_record.metadata.owner  = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.proteome_index_record.num_records             = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.proteome_index_record.metadata.year           = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.proteome_index_record.metadata.day            = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.proteome_index_record.metadata.hour           = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.proteome_index_record.metadata.minute         = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.proteome_index_record.metadata.second         = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.proteome_index_record.metadata.delta_second   = parseInt(db_record.delta_second); }
        if (db_record.options) { this.proteome_index_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.proteome_index_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.proteome_index_record.num_records) {
            this.proteome_index_record.percent_uploaded = Math.floor((this.proteome_index_record.num_uploaded / this.proteome_index_record.num_records) * 100);
            if (this.proteome_index_record.percent_uploaded >= 100) { check_bounty("proteome_index", "proteome_index_db", this.organism_name, this.organism_name.replace(" ", "_")); }
          } // end if
        } // end if
      } // end if
    })
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
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
        this.reset_proteome_record();
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.proteome_record.metadata.owner         = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.proteome_record.num_records            = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.proteome_record.metadata.year          = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.proteome_record.metadata.day           = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.proteome_record.metadata.hour          = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.proteome_record.metadata.minute        = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.proteome_record.metadata.second        = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.proteome_record.metadata.delta_second  = parseInt(db_record.delta_second); }
        if (db_record.options) { this.proteome_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.proteome_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.proteome_record.num_records) {
            this.proteome_record.percent_uploaded = Math.floor((this.proteome_record.num_uploaded / this.proteome_record.num_records) * 100);
            if (this.proteome_record.percent_uploaded >= 100) { check_bounty("proteome_import", "proteome_db", this.organism_name, this.organism_name.replace(" ", "_")); }
          } // end if
        } // end if
      } // end if
    })
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.resolve_organism_name = function(name) {
  return new Promise(function(resolve, reject) {
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        if (this.responseText) {
          let json = JSON.parse(this.responseText);
          resolve(json);
        } // end if
      } // end if
    }; // end function
    let send_message = "execute=true";
    send_message += "&name=" + name.replace(/_/g, ' ');
    xmlhttp.open("POST", current_base_url + "/api/name_resolver", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }.bind(this)); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.update = function() {
  //////////////////////////////////////////////////////////////////////
  // CLEAR ANY UNUSED TIMERS ///////////////////////////////////////////
  if (!document.getElementById(this.html_element.cds_import                ) && (typeof(this.actions.cds_import.timer                ) !== 'undefined')) { clearInterval(this.actions.cds_import.timer                ); this.actions.cds_import.timer                 = undefined; }
  if (!document.getElementById(this.html_element.cds_index                 ) && (typeof(this.actions.cds_index.timer                 ) !== 'undefined')) { clearInterval(this.actions.cds_import.timer                ); this.actions.cds_import.timer                 = undefined; }
  if (!document.getElementById(this.html_element.cross_species_proteome_map) && (typeof(this.actions.cross_species_proteome_map.timer) !== 'undefined')) { clearInterval(this.actions.cross_species_proteome_map.timer); this.actions.cross_species_proteome_map.timer = undefined; }
  if (!document.getElementById(this.html_element.gene_map                  ) && (typeof(this.actions.gene_map.timer                  ) !== 'undefined')) { clearInterval(this.actions.gene_map.timer                  ); this.actions.gene_map.timer                   = undefined; }
  if (!document.getElementById(this.html_element.genome_index              ) && (typeof(this.actions.genome_index.timer              ) !== 'undefined')) { clearInterval(this.actions.genome_index.timer              ); this.actions.genome_index.timer               = undefined; }
  if (!document.getElementById(this.html_element.genome_import             ) && (typeof(this.actions.genome_import.timer             ) !== 'undefined')) { clearInterval(this.actions.genome_import.timer             ); this.actions.genome_import.timer              = undefined; }
  if (!document.getElementById(this.html_element.lifespan_estimator        ) && (typeof(this.actions.lifespan_estimator.timer        ) !== 'undefined')) { clearInterval(this.actions.lifespan_estimator.timer        ); this.actions.lifespan_estimator.timer         = undefined; }
  if (!document.getElementById(this.html_element.proteome_import           ) && (typeof(this.actions.proteome_import.timer           ) !== 'undefined')) { clearInterval(this.actions.proteome_import.timer           ); this.actions.proteome_import.timer            = undefined; }
  if (!document.getElementById(this.html_element.proteome_index            ) && (typeof(this.actions.proteome_index.timer            ) !== 'undefined')) { clearInterval(this.actions.proteome_index.timer            ); this.actions.proteome_index.timer             = undefined; }
  //////////////////////////////////////////////////////////////////////
  // EVALUATE THE SIMPLE ACTION LOCKS //////////////////////////////////
  if (this.html_element.cds_import         && (this.actions.cds_import.status         !== 'complete')) { this.evaluate_lock(this.actions.cds_import,         this.cds_record               ); }
  if (this.html_element.cds_index          && (this.actions.cds_index.status          !== 'complete')) { this.evaluate_lock(this.actions.cds_index,          this.cds_index_record         ); }
  if (this.html_element.gene_map           && (this.actions.gene_map.status           !== 'complete')) { this.evaluate_lock(this.actions.gene_map,           this.gene_map_record          ); }
  if (this.html_element.genome_import      && (this.actions.genome_import.status      !== 'complete')) { this.evaluate_lock(this.actions.genome_import,      this.genome_record            ); }
  if (this.html_element.genome_index       && (this.actions.genome_index.status       !== 'complete')) { this.evaluate_lock(this.actions.genome_index,       this.genome_index_record      ); }
  if (this.html_element.lifespan_estimator && (this.actions.lifespan_estimator.status !== 'complete')) { this.evaluate_lock(this.actions.lifespan_estimator, this.lifespan_estimator_record); }
  if (this.html_element.proteome_import    && (this.actions.proteome_import.status    !== 'complete')) { this.evaluate_lock(this.actions.proteome_import,    this.proteome_record          ); }
  if (this.html_element.proteome_index     && (this.actions.proteome_index.status     !== 'complete')) { this.evaluate_lock(this.actions.proteome_index,     this.proteome_index_record    ); }
  //////////////////////////////////////////////////////////////////////
  // EVALUATE THE COMPLEX ACTION LOCKS /////////////////////////////////
  let newObj = { };
  newObj.metadata = { };
  newObj.num_records           = this.cross_species_proteome_map_record.species1.num_records + this.cross_species_proteome_map_record.species2.num_records;
  newObj.num_uploaded          = this.cross_species_proteome_map_record.species1.num_uploaded + this.cross_species_proteome_map_record.species2.num_uploaded;
  newObj.percent_uploaded      = this.cross_species_proteome_map_record.species1.percent_uploaded + this.cross_species_proteome_map_record.species2.percent_uploaded;
  newObj.metadata.year         = this.cross_species_proteome_map_record.species2.metadata.year ? this.cross_species_proteome_map_record.species2.metadata.year : this.cross_species_proteome_map_record.species1.metadata.year;
  newObj.metadata.day          = this.cross_species_proteome_map_record.species2.metadata.day ? this.cross_species_proteome_map_record.species2.metadata.day : this.cross_species_proteome_map_record.species1.metadata.day;
  newObj.metadata.delta_second = this.cross_species_proteome_map_record.species2.metadata.delta_second ? this.cross_species_proteome_map_record.species2.metadata.delta_second : this.cross_species_proteome_map_record.species1.metadata.delta_second;
  if (this.html_element.cross_species_proteome_map && (this.actions.cross_species_proteome_map.status !== 'complete')) { this.evaluate_lock(this.actions.cross_species_proteome_map, newObj); }
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function ElementRecord() {  // for use when inserting records into element_db
  this.alignment_record = "";
  this.defline          = "";
  this.element_type     = "";
  this.elementID        = "";
  this.gene_name        = "";
  this.geneID           = "";
  this.organism_name    = "";
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function age_estimate_to_db(obj) {
  //////////////////////////////////////////////////////////////////////
  // This function updates the Mayne lifespan estimate in the         //
  // mayne table of the moirai_db.                                    //
  //////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(obj) === 'undefined') { obj = { status: 'failure' }; }
    if (typeof(obj.filename) === 'undefined') { obj.status = 'failure'; }
    if (!obj.status) { obj.status = 'success'; }
    if (obj.status === 'failure') { reject(Error(obj.status)); }
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          resolve(obj);
        } // end if
        else { age_estimate_to_db(obj).then(resolve); }
      } // end if
    } // end function
    obj.command = "age_estimate_to_db";
    let send_message = "execute=true";
    send_message += "&json=" + JSON.stringify(obj);
    xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end new Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function check_bounty(bounty, database, organism_name, table) {
  return new Promise(function(resolve, reject) {
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          if (this.responseText) { console.log(this.responseText); }
          resolve();
        } // end if
        else { resolve(); }
      } // end if
    } // end function
    let send_message = "execute=true";
    send_message += "&direct_command=check_bounty";
    send_message += "&bounty=" + bounty;
    send_message += "&database=" + database;
    send_message += "&organism_name=" + organism_name;
    send_message += "&table=" + table;
    xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end new Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function FASTA_to_db(obj, progress_callback, callback, index, firstTime) {
  //////////////////////////////////////////////////////////////////////
  // This function takes an obj object with the obj.data element      //
  // containing an array of parsed FASTA files, and stores them in    //
  // the database and table specified by obj.database and obj.table.  //
  // The object obj is resolved by the promise.  If specified, a      //
  // callback will be execute once all records have been imported.    //
  // A progress_callback argument is also available for reporting the //
  // progress of this function back to the main program flow.         //
  // Examined elements: command, status, source, num_records,         //
  //==================================================================//
  //      num_uploaded, options                                       //
  //  Updated elements: command, status                               //
  //==================================================================//
  // This function has it's own on-screen progress bar.               //
  //////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(obj) === 'undefined') { obj = { status: 'failure' }; }
    if (typeof(index            ) === 'undefined') { index = parseInt(obj.num_uploaded); }
    if (typeof(progress_callback) === 'undefined') { progress_callback = false; }
    if (typeof(callback         ) === 'undefined') { callback  = false; }
    if (typeof(firstTime        ) === 'undefined') { firstTime = true; }
    if (!obj.status) { obj.status = 'success'; }
    if (obj.status === 'failure') { reject(Error(obj.status)); }
    if (firstTime) {
      create_progress_bar("Transferring records to database", true, obj.data.length);
      update_progress_bar(obj.num_uploaded);
    } // end if
    var batch_size = 25;
    FASTA_to_db_loop(batch_size);
    resolve(obj);
  }); // end Promise
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  function FASTA_to_db_loop(batch_size) {
    if (index < obj.data.length) {
      setTimeout(function() {
        let batch_stop = index + batch_size;
        if (batch_stop > obj.data.length) { batch_stop = obj.data.length; }
        let delta = batch_stop - index;
        // Copy obj, and delete the data element from the new object.
        // The purpose of this set is to pass a file control object
        //  by AJAX without taking up unnecessary server bandwidth.
        let newObj = Object.assign({ }, obj); delete newObj.data;
        newObj.data = [];
        newObj.command = "FASTA_to_db";
        for (let i = index; i < batch_stop; i++) {
          newObj.data.push(obj.data[i]);
        } // end if
        FASTA_to_db_send_the_record(newObj, delta)
        .then(function() { index = index + delta; FASTA_to_db(obj, progress_callback, callback, index, false); });
      }, 100);
    } // end if
    else { if (callback) { callback(); } }
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  function FASTA_to_db_send_the_record(newObj, delta) {
    return new Promise(function(resolve, reject) {
      if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
      else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {
            if (this.responseText) { console.log(this.responseText); }
            update_progress_bar(delta);
            progress_bar_subtitle("Uploading record " + index + " out of " + obj.data.length);
            if (progress_callback) { progress_callback(delta); }
            resolve();
          } // end if
          else { FASTA_to_db_send_the_record(newObj, delta).then(() => { resolve(); }); }
        } // end if
      }; // end function
      let send_message = "execute=true";
      send_message += "&json=" + JSON.stringify(newObj);
      xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions", true);
      xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xmlhttp.send(send_message);
    }); // end promise
  } // end function
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function FASTA_to_cds_db(obj, progress_callback, callback, index, firstTime) {
  //////////////////////////////////////////////////////////////////////
  // This function takes an obj object with the obj.data element      //
  // containing an array of parsed FASTA files, and stores them in    //
  // the database and table specified by obj.database and obj.table.  //
  // The object obj is resolved by the promise.  If specified, a      //
  // callback will be execute once all records have been imported.    //
  // A progress_callback argument is also available for reporting the //
  // progress of this function back to the main program flow.         //
  // Examined elements: command, status, source, num_records,         //
  // Why does the cds_db database get it's own separate FASTA-related //
  // function?  Because the defline needs to be parsed prior to use   //
  // and the PHP file has more table columns to deal with.  That's    //
  // why.                                                             //
  //==================================================================//
  //      num_uploaded, options                                       //
  //  Updated elements: command, status                               //
  //==================================================================//
  // This function has it's own on-screen progress bar.               //
  //////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(obj) === 'undefined') { obj = { status: 'failure' }; }
    if (typeof(index            ) === 'undefined') { index = parseInt(obj.num_uploaded); }
    if (typeof(progress_callback) === 'undefined') { progress_callback = false; }
    if (typeof(callback         ) === 'undefined') { callback  = false; }
    if (typeof(firstTime        ) === 'undefined') { firstTime = true; }
    if (!obj.status) { obj.status = 'success'; }
    if (obj.status === 'failure') { reject(Error(obj.status)); }
    if (firstTime) {
      create_progress_bar("Transferring records to database", true, obj.data.length);
      update_progress_bar(obj.num_uploaded);
    } // end if
    var batch_size = 25;
    FASTA_to_cds_db_loop(batch_size);
    resolve(obj);
  }); // end Promise
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  function FASTA_to_cds_db_loop(batch_size) {
    if (index < obj.data.length) {
      setTimeout(function() {
        let batch_stop = index + batch_size;
        if (batch_stop > obj.data.length) { batch_stop = obj.data.length; }
        let delta = batch_stop - index;
        // Copy obj, and delete the data element from the new object.
        // The purpose of this set is to pass a file control object
        //  by AJAX without taking up unnecessary server bandwidth.
        let newObj = Object.assign({ }, obj); delete newObj.data;
        newObj.data = [];
        newObj.command = "FASTA_to_cds_db";
        for (let i = index; i < batch_stop; i++) {
          newObj.data.push(obj.data[i]);
        } // end if
        FASTA_to_cds_db_send_the_record(newObj, delta)
        .then(function() { index = index + delta; FASTA_to_cds_db(obj, progress_callback, callback, index, false); });
      }, 100);
    } // end if
    else { if (callback) { callback(); } }
  } // end function
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  function FASTA_to_cds_db_send_the_record(newObj, delta) {
    return new Promise(function(resolve, reject) {
      if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
      else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {
            update_progress_bar(delta);
            progress_bar_subtitle("Uploading record " + index + " out of " + obj.data.length);
            if (progress_callback) { progress_callback(delta); }
            resolve();
          } // end if
          else { FASTA_to_cds_db_send_the_record(newObj, delta).then(() => { resolve(); }); }
        } // end if
      }; // end function
      let send_message = "execute=true";
      send_message += "&json=" + JSON.stringify(newObj);
      xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions", true);
      xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xmlhttp.send(send_message);
    }); // end promise
  } // end function
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function FASTA_to_db_lite(obj) {
  //////////////////////////////////////////////////////////////////////
  // This function takes the sequence string stored in obj.data and   //
  // inserts it as a new record into the genome_db database, in the   //
  // given by the obj.table element.                                  //
  // Examined elements: command, status, source, num_records,         //
  //==================================================================//
  //      num_uploaded, options                                       //
  //  Updated elements: command, status                               //
  //////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
      if (typeof(obj) === "undefined") { reject(Error('Missing argument')); }
      if (typeof(obj.options) == "undefined") { obj.options = { }; }
      if (!obj.status) { obj.status = 'success'; }
      if (obj.status === 'failure') { reject(Error(obj.status)); }
      if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
      else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {
            if (this.responseText) { console.log(this.responseText); }
            resolve(obj);
          } // end if
          else { FASTA_to_db_lite(obj).then(resolve); }
        } // end if
      }; // end function
      if (obj.bytes_read) { obj.options.bytes_read = obj.bytes_read; }
      obj.command = "FASTA_to_db";
      let send_message = "execute=true";
      send_message += "&json=" + JSON.stringify(obj);
      xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions", true);
      xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xmlhttp.send(send_message);
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function get_contig_map(table, accession) {
  return new Promise(function(resolve, reject) {
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          if (this.responseText) {
            const map = JSON.parse(this.responseText);
            if (map.length) {
              let start = 1;
              let end = 0;
              for (let i = 0; i < map.length; i++) {
                map[i].index = i;
                map[i].id = parseInt(map[i].id);
                map[i].char_length = parseInt(map[i].char_length);
                end = end + map[i].char_length;
                map[i].start = start;
                map[i].end = end;
                start = end + 1;
              } // end for loop
            } // end if
            resolve(map);
          } // end if
        } // end if
        else { resolve([]); }
      } // end if
    } // end function
    let send_message = "execute=true";
    send_message += "&direct_command=get_contig_map";
    send_message += "&table=" + table;
    send_message += "&accession=" + accession;
    xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end new Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function insert_alignment_record(obj) {
  //////////////////////////////////////////////////////////////////////
  // This function updates the alignment entry for a table row.       //
  //////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(obj) === 'undefined') { obj = { status: 'failure' }; }
    if (typeof(obj.filename) === 'undefined') { obj.status = 'failure'; }
    if (!obj.status) { obj.status = 'success'; }
    if (obj.status === 'failure') { reject(Error(obj.status)); }
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          if (this.responseText) { console.log(this.responseText); }
          resolve(obj);
        } // end if
        else { insert_alignment_record(obj).then(resolve); }
      } // end if
    } // end function
    obj.command = "insert_alignment_record";
    let send_message = "execute=true";
    send_message += "&json=" + JSON.stringify(obj);
    xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end new Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function parse_defline(obj) {
  for (i = 0; i < obj.data.length; i++) {
    const defline= obj.data[i].defline;
    let parameters = defline.split(/\[(.*?)\]/);
    for (let j = 0; j < parameters.length; j++) {
      let parameter = parameters[j];
      let parts = parameter.split("=");
      if (parts[0] && parts[1]) { obj.data[i][parts[0]] = parts[1]; }
    } // end for loop
  } // end for loop
  return obj;
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function parse_FASTA(obj) {
  //////////////////////////////////////////////////////////////////////
  // This function takes one or more FASTA records stored as a string //
  // in obj.data and parses the records as an array of objects.       //
  // After this function executes, the obj.data will contain the      //
  // array of parsed objects.  The object obj is passed to the        //
  // callback (if specified) and resolved by the promise.             //
  //==================================================================//
  // Data structure:                                                  //
  //      obj.data =                                                  //
  //          [                                                       //
  //              {                                                   //
  //                  "accession":    the accession number of the     //
  //                                  FASTA record,                   //
  //                  "defline": the defline of the FASTA record,     //
  //                  "sequence": the FASTA record sequence,          //
  //                  "char_length": the number of characters in the  //
  //                      sequence                                    //
  //              }                                                   //
  //          ]                                                       //
  //==================================================================//
  // Examined elements: status, data                                  //
  //  Updated elements: status, data, num_records, options            //
  //////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(obj     ) === 'undefined') { obj = { status: 'failure' }; }
    if (typeof(obj.data) === 'undefined') { obj = { status: 'failure' }; }
    else if (!obj.data.length) { obj = { status: 'failure' }; }
    if (typeof(obj.options) === "undefined") { obj.options = { }; }
    if (!obj.status) { obj.status = 'success'; }
    if (obj.status === 'failure') { reject(Error(obj.status)); }
    obj.command = "parse_FASTA";
    let n = 0;
    let s = obj.data;
    obj.data = [];
    let data = { accession: "", defline: "", sequence: "", char_length: 0 };
    let lines = s.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line[0] == ">") {
        line = line.substring(1);
        if (data.defline) {
          obj.data.push(data);
          data = { accession: "", defline: "", sequence: "", char_length: 0 };
        } // end if
        data.accession = line.substr(0, line.indexOf(' '));
        data.defline = line.substr(line.indexOf(' ')+1);
        data.sequence = "";
        data.char_length = 0;
      } // end if
      else {
        n = n + line.length;
        data.sequence += line;
        data.char_length += line.length;
      } // end else
    } // end for
    obj.data.push(data);
    obj.num_records = obj.data.length;
    obj.options.num_characters = n;
    resolve(obj);
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function parse_FASTA_fragment(obj) {
  //////////////////////////////////////////////////////////////////////
  // This function takes any FASTA information stored as a string in  //
  // the obj.data element (even a partial or fragmented FASTA file    //
  // record) and replaces it with the extracted total sequence        //
  // infomation, given as one complete string (no return characters). //
  //==================================================================//
  // Data structure:                                                  //
  //      obj.data =                                                  //
  //          [                                                       //
  //              {                                                   //
  //                  "sequence": the FASTA record sequence,          //
  //                  "char_length": the number of characters in the  //
  //                      sequence                                    //
  //              }                                                   //
  //          ]                                                       //
  //==================================================================//
  // Examined elements: status, data                                  //
  //  Updated elements: status, data, options                         //
  //////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(obj) === 'undefined') { obj = { status: 'failure' }; }
    if (typeof(obj.accession) === 'undefined') { obj.accession = ""; }
    if (typeof(obj.defline) === 'undefined') { obj.defline = ""; }
    if (typeof(obj.options) === 'undefined') { obj.options = { }; }
    if (typeof(obj.options.num_characters) === 'undefined') { obj.options.num_characters = 0; }
    if (!obj.status) { obj.status = 'success'; }
    if (obj.status === 'failure') { reject(Error(obj.status)); }
    obj.command = "parse_extract_sequence";
    let s = [];
    if (Array.isArray(obj.data)) { s = obj.data; }
    else { s.push(obj.data); }
    obj.data = [];
    for (let h = 0; h < s.length; h++) {
      let n = 0;
      let data = { accession: "", defline: "", sequence: "", char_length: 0 };
      let lines = s[h].split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes(">")) {
          line = line.substring(1);
          if (data.defline) {
            obj.data.push(data);
            data = { accession: "", defline: "", sequence: "", char_length: 0 };
          } // end if
          data.accession   = line.substr(0, line.indexOf(' '));
          data.defline     = line.substr(line.indexOf(' ')+1);
          obj.accession    = data.accession;
          obj.defline      = data.defline;
          data.sequence    = "";
          data.char_length = 0;
        } // end if
        else {
          data.accession    = obj.accession;
          data.char_length += line.length;
          data.defline      = obj.defline;
          data.sequence    += line;
          n = n + line.length;
        } // end else
      } // end for
      obj.data.push(data);
      obj.options.num_characters += n;
    } // end for loop
    resolve(obj);
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function parse_location(str) {
  const location = { };
  location.complement = false;
  location.join = false;
  location.domain = [];
  if (str.includes("complement")) {
    location.complement = true;
    str = str.replace("complement(", "");
    str = str.substring(0, str.length - 1);
  } // end if
  if (str.includes("join")) {
    location.join = true;
    str = str.replace("join(", "");
    str = str.substring(0, str.length - 1);
  } // end if
  const parts = str.split(",");
  for (let i = 0; i< parts.length; i++) {
    const section = parts[i].split("..");
    location.domain.push({ start: parseInt(section[0]), end: parseInt(section[1]) });
  } // end for loop
  location.start = location.domain[0].start;
  location.end = location.domain[location.domain.length - 1].end;
  return location;
} // end function
// FUNCTION ///////////////////////////////////////////////////////////////////
function update_alignment_record(obj) {
  //////////////////////////////////////////////////////////////////////
  // This function updates the alignment entry for a table row.       //
  //////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(obj) === 'undefined') { obj = { status: 'failure' }; }
    if (typeof(obj.filename) === 'undefined') { obj.status = 'failure'; }
    if (!obj.status) { obj.status = 'success'; }
    if (obj.status === 'failure') { reject(Error(obj.status)); }
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) { resolve(obj); }
    } // end function
    obj.command = "update_alignment_record";
    let send_message = "execute=true";
    send_message += "&json=" + JSON.stringify(obj);
    xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end new Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function update_metadata(obj) {
  //////////////////////////////////////////////////////////////////////
  // The table_metadata table stores information such as the file     //
  // version, the number of records, and the userID of the user who   //
  // imported the records.                                            //
  //==================================================================//
  // Examined elements: status, database, table, num_records          //
  //  Updated elements: status                                        //
  //////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(obj) === 'undefined') { obj = { status: 'failure' }; }
    if (!obj.status) { obj.status = 'success'; }
    if (obj.status === 'failure') { reject(Error(obj.status)); }
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          if (this.responseText) {
            let response = JSON.parse(this.responseText);
            response.data = obj.data;
            resolve(response);
          } // end if
        } // end if
      } // end if
    }; // end function
    obj.command = "update_metadata";
    // Copy obj, and delete the data element from the new object.
    // The purpose of this set is to pass a file control object
    //  by AJAX without taking up unnecessary server bandwidth.
    let newObj = Object.assign({ }, obj); delete newObj.data;
    newObj.data = '';
    let send_message = "execute=true";
    send_message += "&json=" + JSON.stringify(newObj);
    xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function update_user_computer_time() {
  return new Promise(function(resolve, reject) {
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          if (this.responseText) { console.log(this.responseText); }
          resolve();
        } // end if
        else { resolve(); }
      } // end if
    } // end function
    let send_message = "execute=true";
    send_message += "&direct_command=update_user_computer_time";
    xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end new Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
