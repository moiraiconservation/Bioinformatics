///////////////////////////////////////////////////////////////////////////////
// blast.js ///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function BlastOptions(matrix, record, type) {
  ////////////////////////////////////////////////////////////////////////
  //  This object represents the "options" data structure needed for    //
  //  the blast.js worker, and provides settings for pairwise           //
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
  if (typeof(type) === "undefined") { type = "standard"; }
  ////////////////////////////////////////////////////////////////////////
  // ESTABLISH THE INTERNAL OBJECTS //////////////////////////////////////
  this.hsp_filtering  = { };
  this.hsp_overlap    = { };
  this.score          = { };
  this.seed           = { };
  this.search_space   = { };
  this.x_drop         = { };
  ////////////////////////////////////////////////////////////////////////
  // SET CUSTOM OPTIONS //////////////////////////////////////////////////
  switch (matrix.type) {
    case "amino acids": {
      this.batch                        = 0;
      this.batch_index                  = 1;
      this.culling_limit                = Infinity;
      this.multithreading               = true;
      this.record                       = record;
      this.hsp_filtering.on             = false;
      this.hsp_filtering.method         = "";
      this.hsp_filtering.threshold      = 0.00;
      this.hsp_overlap.on               = true;
      this.hsp_overlap.degree           = 0.125;
      this.max_hsp_spread_factor        = 0.15;
      this.max_hsps                     = Infinity;
      this.score.gap_extend             = matrix.default_gap_extend;
      this.score.gap_open               = matrix.default_gap_open;
      this.score.gapped                 = true;
      this.score.matrix                 = matrix;
      this.score.matrix_unscaled        = matrix;
      this.score.rescale_matrix         = false;
      this.search_space.num_characters  = record.options.num_characters;
      this.search_space.num_sequences   = record.num_records;
      this.seed.exact_match             = false;
      this.seed.max_number              = Infinity;
      this.seed.filter_low_complexity   = true;
      this.seed.score_threshold         = 11;
      this.seed.word_size               = 4;
      this.single_hit_algorithm         = false;
      this.two_hit_window_size          = 40;
      this.x_drop.X1                    = 7;
      this.x_drop.X2                    = 15;
      this.x_drop.X2_trigger            = 22;
      break;
    } // end case
    case "nucleotides": {
      switch (type) {
        case "standard": {
          this.batch                        = 0;
          this.batch_index                  = 1;
          this.culling_limit                = Infinity;
          this.multithreading               = true;
          this.record                       = record;
          this.hsp_filtering.on             = false;
          this.hsp_filtering.method         = "expect";
          this.hsp_filtering.threshold      = 0.05;
          this.hsp_overlap.on               = true;
          this.hsp_overlap.degree           = 0.125;
          this.max_hsp_spread_factor        = Infinity;
          this.max_hsps                     = Infinity;
          this.score.gap_extend             = matrix.default_gap_extend;
          this.score.gap_open               = matrix.default_gap_open;
          this.score.gapped                 = true;
          this.score.matrix                 = matrix;
          this.score.matrix_unscaled        = matrix;
          this.score.rescale_matrix         = false;
          this.search_space.num_characters  = record.options.num_characters;
          this.search_space.num_sequences   = record.options.num_accession || 1;
          this.seed.exact_match             = true;
          this.seed.filter_low_complexity   = true;
          this.seed.max_number              = Infinity;
          this.seed.score_threshold         = Infinity;
          this.seed.word_size               = 11;
          this.single_hit_algorithm         = true;
          this.two_hit_window_size          = 40;
          this.x_drop.X1                    = 20;
          this.x_drop.X2                    = 30;
          this.x_drop.X2_trigger            = 22;
          break;
        } //end case
        case "megablast": {
          this.batch                        = 0;
          this.batch_index                  = 1;
          this.culling_limit                = Infinity;
          this.multithreading               = true;
          this.record                       = record;
          this.hsp_filtering.on             = false;
          this.hsp_filtering.method         = "expect";
          this.hsp_filtering.threshold      = 0.05;
          this.hsp_overlap.on               = true;
          this.hsp_overlap.degree           = 0.125;
          this.max_hsp_spread_factor        = Infinity;
          this.max_hsps                     = Infinity;
          this.score.gap_extend             = matrix.default_gap_extend;
          this.score.gap_open               = matrix.default_gap_open;
          this.score.gapped                 = true;
          this.score.matrix                 = matrix;
          this.score.matrix_unscaled        = matrix;
          this.score.rescale_matrix         = false;
          this.search_space.num_characters  = record.options.num_characters;
          this.search_space.num_sequences   = record.options.num_accession || 1;
          this.seed.exact_match             = true;
          this.seed.filter_low_complexity   = true;
          this.seed.max_number              = Infinity;
          this.seed.score_threshold         = Infinity;
          this.seed.word_size               = 28;
          this.single_hit_algorithm         = true;
          this.two_hit_window_size          = Infinity;
          this.x_drop.X1                    = 10;
          this.x_drop.X2                    = 20;
          this.x_drop.X2_trigger            = 20;
          break;
        } // end case
        case "sensitive": {
          this.batch                        = 0;
          this.batch_index                  = 1;
          this.culling_limit                = Infinity;
          this.multithreading               = true;
          this.record                       = record;
          this.hsp_filtering.on             = false;
          this.hsp_filtering.method         = "expect";
          this.hsp_filtering.threshold      = 0.05;
          this.hsp_overlap.on               = true;
          this.hsp_overlap.degree           = 0.125;
          this.max_hsp_spread_factor        = Infinity;
          this.max_hsps                     = Infinity;
          this.score.gap_extend             = matrix.default_gap_extend;
          this.score.gap_open               = matrix.default_gap_open;
          this.score.gapped                 = true;
          this.score.matrix                 = matrix;
          this.score.matrix_unscaled        = matrix;
          this.score.rescale_matrix         = false;
          this.search_space.num_characters  = record.options.num_characters;
          this.search_space.num_sequences   = 1;
          this.seed.exact_match             = true;
          this.seed.filter_low_complexity   = true;
          this.seed.max_number              = Infinity;
          this.seed.score_threshold         = Infinity;
          this.seed.word_size               = 5;
          this.single_hit_algorithm         = true;
          this.two_hit_window_size          = Infinity;
          this.x_drop.X1                    = 10;
          this.x_drop.X2                    = 50;
          this.x_drop.X2_trigger            = 20;
          break;
        } // end case
        default: { break; }
      } // end switch
      break;
    } // end case
    default: { break; }
  } // end switch
} // end object
///////////////////////////////////////////////////////////////////////////////
// BLASTTOPTIONS PROTOTYPES GETTERS / SETTERS /////////////////////////////////
BlastOptions.prototype = {
  get matrix() {
    return this.score.matrix;
  }, // end get
  get record() {
    return this.record;
  },
  set matrix(matrix) {
    if (typeof(matrix) === "undefined") { matrix = BLOSUM62; }
    this.score.matrix          = matrix;
    this.score.matrix_unscaled = matrix;
    this.score.gap_open        = matrix.default_gap_open;
    this.score.gap_extend      = matrix.default_gap_extend;
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
function BlastRecord() {
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
function MegaBlastOptions() {
  this.culling_limit  = Infinity;
  this.gap_extend     = NUC_1_2.default_gap_extend;
  this.gap_open       = NUC_1_2.default_gap_open;
  this.max_hsps = Infinity;
  this.matrix         = NUC_1_2;
} // end object
// OBJECT /////////////////////////////////////////////////////////////////////
function blast(organism_name) {
  if (typeof(organism_name) !== "undefined") {
    this._organism_name = organism_name;
    this._table = organism_name.replace(/ /g, '_');
    this._cds = { _database: "cds_db", _record: new BlastRecord(), _table: this._table };
    this._genome = { _database: "genome_db", _record: new BlastRecord(), _table: this._table };
    this._proteome = { _database: "proteome_db", _record: new BlastRecord(), _table: this._table };
  } // end if
  else {
    this._organism_name = "";
    this._table = "";
    this._cds = { _database: "", _record: new BlastRecord(), _table: "" };
    this._genome = { _database: "", _record: new BlastRecord(), _table: "" };
    this._proteome = { _database: "", _record: new BlastRecord(), _table: "" };
  } // end else
  this._worker = new Worker(current_base_url + "/workers/js/blast.js?version=" + guid());
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this._call_worker = function(command, options) {
    return new Promise(function(resolve, reject) {
      ////////////////////////////////////////////////////////////////////
      // SEND THE COMMAND ////////////////////////////////////////////////
      switch (command) {
        case "blast": {
          hide_progress_bar(true);
          create_loading_box("Starting BLAST Search", true);
          this._worker.postMessage({ status: "command", command: "blast", query: options.query, subject: options.subject, options: options.options });
          break;
        } // end case
        case "close": {
          this._worker.postMessage({ status: "command", command: "close" });
          break;
        } // end case
      } // end switch
      ////////////////////////////////////////////////////////////////////
      // ONMESSAGE ///////////////////////////////////////////////////////
      this._worker.onmessage = function(e) {
        switch (e.data.status) {
          case "complete": {
            switch (e.data.command) {
              case "blast": {
                resolve(e.data.result);
                break;
              } // end case
              case "close": {
                this._worker.terminate();
                this._worker = undefined;
                resolve();
                break;
              } // end case
              default: { break; }
            } //end switch
            break;
          } // end case
          case "progress": {
            switch (e.data.target) {
              case "progress_bar": {
                switch (e.data.action) {
                  case "create": { create_progress_bar(e.data.text, true, e.data.amount); break; }
                  case "delux": {
                    hide_loading_box(true);
                    let progress = e.data.number;
                    let limit = e.data.out_of;
                    let progress_text = progress.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
                    let limit_text = limit.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
                    create_progress_bar("BLAST Search", true, limit);
                    progress_bar_subtitle(progress_text + " out of " + limit_text);
                    update_progress_bar(progress);
                    break;
                  } // end case
                  case "hide": { hide_progress_bar(true); break; }
                  case "subtitle": { progress_bar_subtitle(e.data.text); break; }
                  case "update": { update_progress_bar(e.data.amount); break; }
                  default: { break; }
                } // end switch
                break;
              } // end case
              default: { break; }
            } // end switch
            break;
          } // end case
          default: { break; }
        } // end switch
      }; // end onmessage
    }.bind(this)); // end promise
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this._get_cds_record = function() {
    return new Promise(function(resolve, reject) {
      let obj1 = { };
      let obj2 = { };
      obj1.database   =   this._cds._database;
      obj1.table      =   "table_metadata";
      obj1.command    =   "select";
      obj1.where      =   [ { "key": "id", "value": this._cds._table } ];
      obj2.database   =   this._cds._database;
      obj2.table      =   this._cds._table;
      obj2.command    =   "count";
      let json1 = JSON.stringify(obj1);
      let json2 = JSON.stringify(obj2);
      db_guard(json1)
      .then(responseText => {
        if (responseText) {
          if (this._cds._record) { delete this._cds._record; }
          this._cds._record = new BioactionRecord;
          let db_record = JSON.parse(responseText);
          if (typeof(db_record.owner       ) !== "undefined") { this._cds._record.metadata.owner          = db_record.owner; }
          if (typeof(db_record.records     ) !== "undefined") { this._cds._record.num_records             = parseInt(db_record.records     ); }
          if (typeof(db_record.year        ) !== "undefined") { this._cds._record.metadata.year           = parseInt(db_record.year        ); }
          if (typeof(db_record.day         ) !== "undefined") { this._cds._record.metadata.day            = parseInt(db_record.day         ); }
          if (typeof(db_record.hour        ) !== "undefined") { this._cds._record.metadata.hour           = parseInt(db_record.hour        ); }
          if (typeof(db_record.minute      ) !== "undefined") { this._cds._record.metadata.minute         = parseInt(db_record.minute      ); }
          if (typeof(db_record.second      ) !== "undefined") { this._cds._record.metadata.second         = parseInt(db_record.second      ); }
          if (typeof(db_record.delta_second) !== "undefined") { this._cds._record.metadata.delta_second   = parseInt(db_record.delta_second); }
          if (db_record.options) { this._cds._record.options = JSON.parse(db_record.options); }
        } // end if
      })
      .then(() => db_guard(json2))
      .then(responseText => {
        if (responseText) {
          let db_record = JSON.parse(responseText);
          if (db_record["COUNT(*)"]) {
            this._cds._record.num_uploaded = parseInt(db_record["COUNT(*)"]);
            if (this._cds._record.num_records) {
              this._cds._record.percent_uploaded = Math.floor((this._cds._record.num_uploaded / this._cds._record.num_records) * 100);
            } // end if
          } // end if
        } // end if
      })
      .then(() => { resolve(); });
    }.bind(this)); // end Promise
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this._get_genome_record = function() {
    return new Promise(function(resolve, reject) {
      let obj1 = { };
      let obj2 = { };
      let obj3 = { };
      obj1.command    = "select";
      obj1.database   = this._genome._database;
      obj1.table      = "table_metadata";
      obj1.where      = [ { "key": "id", "value": this._genome._table } ];
      obj2.command    = "count";
      obj2.database   = this._genome._database;
      obj2.table      = this._genome._table;
      obj3.command    = "count_distinct";
      obj3.database   = this._genome._database;
      obj3.table      = this._genome._table;
      obj3.columns    = [ { "key": "accession" } ];
      let json1 = JSON.stringify(obj1);
      let json2 = JSON.stringify(obj2);
      let json3 = JSON.stringify(obj3);
      db_guard(json1)
      .then(responseText => {
        if (responseText) {
          if (this._genome._record) { delete this._genome._record; }
          this._genome._record = new BlastRecord;
          let db_record = JSON.parse(responseText);
          if (typeof(db_record.owner       ) !== "undefined") { this._genome._record.metadata.owner         = db_record.owner; }
          if (typeof(db_record.records     ) !== "undefined") { this._genome._record.num_records            = parseInt(db_record.records     ); }
          if (typeof(db_record.year        ) !== "undefined") { this._genome._record.metadata.year          = parseInt(db_record.year        ); }
          if (typeof(db_record.day         ) !== "undefined") { this._genome._record.metadata.day           = parseInt(db_record.day         ); }
          if (typeof(db_record.hour        ) !== "undefined") { this._genome._record.metadata.hour          = parseInt(db_record.hour        ); }
          if (typeof(db_record.minute      ) !== "undefined") { this._genome._record.metadata.minute        = parseInt(db_record.minute      ); }
          if (typeof(db_record.second      ) !== "undefined") { this._genome._record.metadata.second        = parseInt(db_record.second      ); }
          if (typeof(db_record.delta_second) !== "undefined") { this._genome._record.metadata.delta_second  = parseInt(db_record.delta_second); }
          if (db_record.options) {
            this._genome._record.options = JSON.parse(db_record.options);
            if (this._genome._record.options.bytes_read) { this._genome._record.num_uploaded = this._genome._record.options.bytes_read; }
          } // end if
          if (this._genome._record.num_records) {
            this._genome._record.percent_uploaded = Math.floor((this._genome._record.num_uploaded / this._genome._record.num_records) * 100);
          } // end if
        } // end if
      })
      .then(() => db_guard(json2))
      .then(responseText => {
        if (responseText) {
          let db_record = JSON.parse(responseText);
          if (db_record["COUNT(*)"]) {
            this._genome._record.options.num_records = parseInt(db_record["COUNT(*)"]);
          } // end if
        } // end if
        db_guard(json3)
        .then(responseText => {
          if (responseText) {
            let db_record = JSON.parse(responseText);
            if (db_record["COUNT(DISTINCT(accession))"]) {
              this._genome._record.options.num_accession = parseInt(db_record["COUNT(DISTINCT(accession))"]);
            } // end if
          } // end if
          resolve();
        }); // end then
      }) // end then
    }.bind(this)); // end Promise
  }; // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this._get_proteome_record = function() {
    return new Promise(function(resolve, reject) {
      let obj1 = { };
      let obj2 = { };
      obj1.database   =   this._proteome._database;
      obj1.table      =   "table_metadata";
      obj1.command    =   "select";
      obj1.where      =   [ { "key": "id", "value": this._proteome._table } ];
      obj2.database   =   this._proteome._database;
      obj2.table      =   this._proteome._table;
      obj2.command    =   "count";
      let json1 = JSON.stringify(obj1);
      let json2 = JSON.stringify(obj2);
      db_guard(json1)
      .then(responseText => {
        if (responseText) {
          if (this._proteome._record) { delete this._proteome._record; }
          this._proteome._record = new BioactionRecord;
          let db_record = JSON.parse(responseText);
          if (typeof(db_record.owner       ) !== "undefined") { this._proteome._record.metadata.owner         = db_record.owner; }
          if (typeof(db_record.records     ) !== "undefined") { this._proteome._record.num_records            = parseInt(db_record.records     ); }
          if (typeof(db_record.year        ) !== "undefined") { this._proteome._record.metadata.year          = parseInt(db_record.year        ); }
          if (typeof(db_record.day         ) !== "undefined") { this._proteome._record.metadata.day           = parseInt(db_record.day         ); }
          if (typeof(db_record.hour        ) !== "undefined") { this._proteome._record.metadata.hour          = parseInt(db_record.hour        ); }
          if (typeof(db_record.minute      ) !== "undefined") { this._proteome._record.metadata.minute        = parseInt(db_record.minute      ); }
          if (typeof(db_record.second      ) !== "undefined") { this._proteome._record.metadata.second        = parseInt(db_record.second      ); }
          if (typeof(db_record.delta_second) !== "undefined") { this._proteome._record.metadata.delta_second  = parseInt(db_record.delta_second); }
          if (db_record.options) { this._proteome._record.options = JSON.parse(db_record.options); }
        } // end if
      })
      .then(() => db_guard(json2))
      .then(responseText => {
        if (responseText) {
          let db_record = JSON.parse(responseText);
          if (db_record["COUNT(*)"]) {
            this._proteome._record.num_uploaded = parseInt(db_record["COUNT(*)"]);
            if (this._proteome._record.num_records) {
              this._proteome._record.percent_uploaded = Math.floor((this._proteome._record.num_uploaded / this._proteome._record.num_records) * 100);
            } // end if
          } // end if
        } // end if
      })
      .then(() => { resolve(); });
    }.bind(this)); // end Promise
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.close = function() {
    this._call_worker("close");
  } // end method
  // METHOD //////////////////////////////////////////////////////////////
  this.megablast = function(query, options) {
    return new Promise(function(resolve, reject) {
      if (this._organism_name === "") { resolve(); }
      if (typeof(query) === "undefined") { resolve([]); }
      if (typeof(options) === "undefined") { options = new MegaBlastOptions(); }
      this._get_genome_record()
      .then(() => {
        var blast_options;
        if (typeof(options.matrix) !== "undefined") { blast_options = new BlastOptions(options.matrix, this._genome._record, "megablast"); }
        else { blast_options = new BlastOptions(NUC_1_2, this._genome._record, "megablast"); }
        if (typeof(options.culling_limit) !== "undefined") { blast_options.culling_limit = options.culling_limit; }
        if (typeof(options.max_hsps) !== "undefined") { blast_options.max_hsps = options.max_hsps; }
        if (typeof(options.gap_extend) !== "undefined") blast_options.score.gap_extend = options.gap_extend;
        if (typeof(options.gap_open) !== "undefined") blast_options.score.gap_open = options.gap_open;
        const genome_finder = new GenomeFinder();
        const genome_finder_options = new GenomeFinderOptions(this._organism_name);
        genome_finder_options.query = query;
        genome_finder.find(genome_finder_options)
        .then(result => {
          genome_finder.get_sequences(result)
          .then(seq_result => {
            genome_finder.close();
            const subject = [];
            for (let i = 0; i < seq_result.result.positive.length; i++) {
              subject.push({ sequence: seq_result.result.positive[i], complement: false });
            } // end for loop
            for (let i = 0; i < seq_result.result.negative.length; i++) {
              subject.push({ sequence: seq_result.result.negative[i], complement: true });
            } // end for loop
            let worker_options = { query: query, subject: subject, options: blast_options };
            this._call_worker("blast", worker_options)
            .then(blast_result => {
              resolve(blast_result);
            }); // end then
          }); // end then
        }); // end then
      }); // end then
    }.bind(this));
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.set_database = function(organism_name) {
    if (typeof(organism_name) !== "undefined") {
      this._organism_name = organism_name;
      this._table = organism_name.replace(/ /g, '_');
      this._cds = { _database: "cds_db", _record: new BlastRecord(), _table: this._table };
      this._genome = { _database: "genome_db", _record: new BlastRecord(), _table: this._table };
      this._proteome = { _database: "proteome_db", _record: new BlastRecord(), _table: this._table };
    } // end if
    else {
      this._organism_name = "";
      this._table = "";
      this._cds = { _database: "", _record: new BlastRecord(), _table: "" };
      this._genome = { _database: "", _record: new BlastRecord(), _table: "" };
      this._proteome = { _database: "", _record: new BlastRecord(), _table: "" };
    } // end else
  } // end method
  ////////////////////////////////////////////////////////////////////////
} // end object
///////////////////////////////////////////////////////////////////////////////
