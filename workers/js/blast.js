///////////////////////////////////////////////////////////////////////////////
// ALIGNMENT //////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// IMPORTS ////////////////////////////////////////////////////////////////////
var current_base_url = 'https://www.moiraiconservation.org';
importScripts(current_base_url + '/js/math.js');
importScripts(current_base_url + '/bioinformatics/js/cd_hit.js?version='+guid());
importScripts(current_base_url + '/bioinformatics/js/codon_codes.js?version='+guid());
importScripts(current_base_url + '/bioinformatics/js/sdust.js?version='+guid());
importScripts(current_base_url + '/bioinformatics/js/scoring_matrices.js?version='+guid());
importScripts(current_base_url + '/bioinformatics/js/seg.js?version='+guid());
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function HSP() {
  this.bit_score        = 0.0;
  this.centroid         = { };
  this.centroid.query   = 0;
  this.centroid.subject = 0;
  this.changed          = true;
  this.characters       = 0;
  this.diagonal         = 0;
  this.expect           = 10.0;
  this.extended         = false;
  this.gapped_alignment = false;
  this.gaps             = 0;
  this.identity         = 0;
  this.keep             = true;
  this.nat_score        = 0.0;
  this.p_value          = 1.0;
  this.percent_gaps     = 0.0;
  this.percent_identity = 0.0;
  this.query_end        = 0;
  this.query_start      = 0;
  this.score            = 0;
  this.subject_end      = 0;
  this.subject_start    = 0;
} // end function
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function Report(batch, batch_index) {
  if (typeof(batch) === 'undefined') { batch = 1; }
  if (typeof(batch_index) === 'undefined') { batch_index = 0; }
  this.batch                = batch;
  this.batch_index          = batch_index;
  this.bit_score            = 0.0;
  this.characters           = 0;
  this.data                 = undefined;
  this.expect               = Infinity;
  this.hsp                  = [];
  this.hsp_average_gaps     = 0;
  this.hsp_gaps             = 0;
  this.hsp_spread_factor    = 0.00;
  this.identity             = 0;
  this.linked_hsp           = [];
  this.nat_score            = 0.0;
  this.p_value              = 1.0;
  this.percent_identity     = 0.0;
  this.query                = "";
  this.query_coverage       = 0;
  this.query_domain         = { end: -Infinity, length: 0, start: Infinity };
  this.query_length         = 0;
  this.score                = 0;
  this.significant          = false;
  this.subject              = "";
  this.subject_domain       = { end: -Infinity, length: 0, start: Infinity };
  this.threshold            = 0.05;
  this.total_hsp_characters = 0;
} // end function
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function Options() {
  this.hsp_filtering  = { };
  this.hsp_overlap    = { };
  this.score          = { };
  this.search_space   = { };
  this.seed           = { };
  this.x_drop         = { };
  //  Option                          Value        NCBI command-line equivalent
  //===========================================================================
  this.batch                        = 0;
  this.batch_index                  = 1;
  this.culling_limit                = Infinity;
  this.multithreading               = true;
  this.hsp_filtering.on             = false;
  this.hsp_filtering.method         = "";
  this.hsp_filtering.threshold      = 0.00;
  this.hsp_overlap.on               = true;
  this.hsp_overlap.degree           = 0.125;
  this.max_hsp_spread_factor        = Infinity;
  this.max_hsps                     = Infinity;
  this.score.gap_extend             = 1;        //  -E  (NCBI BLAST)
  this.score.gap_open               = 11;       //  -G  (NCBI BLAST)
  this.score.gapped                 = false;    //  -g  (NCBI BLAST)
  this.score.matrix                 = BLOSUM62; //  -M  (NCBI BLAST)
  this.score.matrix_unscaled        = BLOSUM62;
  this.score.rescale_matrix         = false;
  this.search_space.num_characters  = 0;
  this.search_space.num_sequences   = 0;
  this.seed.exact_match             = false;
  this.seed.filter_low_complexity   = true;     //  -F  (NCBI BLAST)
  this.seed.max_number              = Infinity;
  this.seed.score_threshold         = 11;       //  -f  (NCBI BLAST)
  this.seed.word_size               = 4;        //  -W  (NCBI BLAST)
  this.single_hit_algorithm         = false;    //  -P  (NCBI BLAST)
  this.two_hit_window_size          = 40;       //  -A  (NCBI BLAST)
  this.x_drop.X1                    = 7;        //  -y  (NCBI BLAST)
  this.x_drop.X2                    = 15;       //  -X  (NCBI BLAST)
  this.x_drop.X2_trigger            = 22;       //  -N  (NCBI PSI-BLAST)
} // end function
///////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////
var bioBlast = new Blast();
///////////////////////////////////////////////////////////////////////////////
// CATEGORY: MANAGEMENT OF MULTITHREADING /////////////////////////////////////
//    (1) Objects and functions associated with the management of            //
//      multithreading.  These include the onmessage function, and the       //
//      Blast constructor along with its two primary methods add_job and     //
//      create_worker.                                                       //
//===========================================================================//
//  Functions:                                                               //
//      onmessage                                                            //
//      Blast (object constructor)                                           //
//      Blast.add_job                                                        //
//      Blast.create_worker                                                  //
//      Blast.create_workerPool                                              //
///////////////////////////////////////////////////////////////////////////////
// WORKER /////////////////////////////////////////////////////////////////////
onmessage = function(e) {
  var job = e.data || { };
  switch(job.command) {
    case "blast": {
      bioBlast.blast(job.query, job.subject, job.options, job.workerNumber);
      break;
    } // end case
    case "close": { bioBlast.close(); break; }
    default: { break; }
  } // end switch
} // end onmessage
///////////////////////////////////////////////////////////////////////////////
// ALIGNMENT OBJECT ///////////////////////////////////////////////////////////
function Blast() {
  this.jobPool = [];
  this.workerPool = [];
  if (navigator.hardwareConcurrency) {
    let maxWorkers = Math.floor(navigator.hardwareConcurrency * 0.5); // DO NOT max out the CPU
    if (maxWorkers < 1) { maxWorkers = 1; }
    this.maxWorkers = maxWorkers;
  } // end if
  else { this.maxWorkers = 1; }
  this.batch = { blast: [] };
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.add_job = function(job) {
    if (job) { this.jobPool.push(job); }
    if (!this.workerPool.length) { this.create_workerPool(); }
    for (let i = 0; i < this.workerPool.length; i++) {
      if (!this.workerPool[i].inUse && this.jobPool.length) {
        this.workerPool[i].inUse = true;
        let ticket = this.jobPool.pop();
        ticket.workerNumber = i;
        this.workerPool[i].worker.postMessage(ticket);
      } // end if
    } // end for loop
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.create_worker = function() {
    let newWorker = new Worker('blast.js?version=' + guid());
    //////////////////////////////////////////////////////////////////////
    // ON MESSAGE ////////////////////////////////////////////////////////
    newWorker.onmessage = function(e) {
      switch(e.data.status) {
        case "complete": {
          switch(e.data.command) {
            case "blast": {
              for (let i = 0; i < e.data.result.length; i++) { this.batch.blast.push(e.data.result[i]); }
              this.batch.blast.sort(function(a, b) {
                if (a.batch_index < b.batch_index) { return -1; }
                if (a.batch_index > b.batch_index) { return  1; }
                return 0;
              }); // end sort
              let effective_length = 0;
              for (let i = 0; i < this.batch.blast.length; i++) {
                if (i === 0) { effective_length++; }
                else {
                  if (this.batch.blast[i].batch_index !== this.batch.blast[(i - 1)].batch_index) {
                    effective_length++;
                  } // end if
                } // end else
              } // end for loop
              if (effective_length >= e.data.result[0].batch) {
                this.batch.blast.sort(function(a, b) {
                  if ((a.expect === Infinity) || (a.expect === -Infinity)) { return 1; }
                  if (a.expect === b.expect) {
                    if (a.subject_domain.start < b.subject_domain.start) { return -1; }
                    if (a.subject_domain.start > b.subject_domain.start) { return  1; }
                    return 0;
                  } // end if
                  let both_positive = false;
                  let both_negative = false;
                  if ((a.expect > 0) && (b.expect > 0)) { both_positive = true; }
                  if ((a.expect < 0) && (b.expect < 0)) { both_negative = true; }
                  if (both_positive && (a.expect < b.expect)) { return -1; }
                  if (both_positive && (a.expect > b.expect)) { return  1; }
                  if (both_negative && (a.expect < b.expect)) { return  1; }
                  if (both_negative && (a.expect > b.expect)) { return -1; }
                  let abs_a = Math.abs(a.expect);
                  let abs_b = Math.abs(b.expect);
                  if (abs_a < abs_b) { return -1; }
                  if (abs_a > abs_b) { return  1; }
                  return 0;
                }); // end sort
                postMessage({ status: "progress", command: "blast", target: "progress_bar", action: "hide"});
                postMessage({ status: "complete", command: "blast", result: this.batch.blast });
                delete this.batch.blast;
                this.batch.blast = [];
              } // end if
              else {
                postMessage({ status: "progress", command: "blast", target: "progress_bar", action: "delux", number: this.batch.blast.length, out_of: e.data.result[0].batch });
              } // end else
              if (e.data.workerNumber !== "undefined") {
                this.workerPool[e.data.workerNumber].inUse = false;
                this.add_job();
              } // end if
              break;
            } // end case
            case "close": { postMessage({ status: "complete", command: "close" }); break; }
            default: { break; }
          } // end switch
        } // end case
        default: { break; }
      } // end switch
    }.bind(this); // end function
    //////////////////////////////////////////////////////////////////////
    let obj = { };
    obj.worker = newWorker;
    obj.inUse = false;
    return obj;
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.create_workerPool = function() {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.workerPool.push(this.create_worker());
    } // end if
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.close = function() {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.workerPool[i].worker.terminate();
    } // end if
    postMessage({ status: "complete", command: "close" });
  } // end method
  ////////////////////////////////////////////////////////////////////////
}; // end constructor
///////////////////////////////////////////////////////////////////////////////
// CATEGORY: SINGLE-THREAD FUNCTIONS //////////////////////////////////////////
//    (2) Functions associated with single-thread tasks.  These can be       //
//      further divided into (a) primary functions associated with the       //
//      analysis of protein or nucleotide sequences, and (b) secondary       //
//      supporting functions that provide mathematical, and string           //
//      manipulation, and matrix manipulation capabilities.                  //
//===========================================================================//
//  Functions:                                                               //
//      (a) Primary single-thread functions:                                 //
//          Blast.evaluate                                                   //
//          Blast.extend                                                     //
//          Blast.global                                                     //
//          Blast.link_HSPs                                                  //
//          Blast.seed                                                       //
//          Blast.two_hit                                                    //
//          Blast.x_drop_gapped                                              //
//          Blast.x_drop_ungapped                                            //
//      (b) Secondary single-thread functions:                               //
//          Blast.bit_score_to_raw_score                                     //
//          Blast.calculate_lambda                                           //
//          Blast.calculate_hsp_best_stats                                   //
//          Blast.calculate_hsp_centroids                                    //
//          Blast.calculate_hsp_scores                                       //
//          Blast.calculate_search_space                                     //
//          Blast.complete_options                                           //
//          Blast.copy_attributes                                            //
//          Blast.copy_object                                                //
//          Blast.create_diagonal_distribution                               //
//          Blast.create_hsp_report                                          //
//          Blast.create_matrix                                              //
//          Blast.cull_hsp_array                                             //
//          Blast.filter_hsp_array                                           //
//          Blast.filter_hsp_array_by_bit_score                              //
//          Blast.filter_hsp_array_by_characters                             //
//          Blast.filter_hsp_array_by_expect                                 //
//          Blast.filter_hsp_array_by_nat_score                              //
//          Blast.filter_hsp_array_by_p_value                                //
//          Blast.filter_hsp_array_by_score                                  //
//          Blast.flip_string                                                //
//          Blast.raw_score_to_bit_score                                     //
//          Blast.rescale_matrix                                             //
//          Blast.Spouge_raw_score_to_expect                                 //
///////////////////////////////////////////////////////////////////////////////
// CATEGORY: PRIMARY SINGLE-THREAD FUNCTIONS //////////////////////////////////
//  (a) primary functions associated with the analysis of protein or         //
//    nucleotide sequences.                                                  //
//===========================================================================//
//  Functions:                                                               //
//      Blast.evaluate                                                       //
//      Blast.extend                                                         //
//      Blast.global                                                         //
//      Blast.link_HSPs                                                      //
//      Blast.seed                                                           //
//      Blast.two_hit                                                        //
//      Blast.x_drop_gapped                                                  //
//      Blast.X-drop_ungapped                                                //
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.evaluate = function(hsp_array, query, subject, options) {
  ////////////////////////////////////////////////////////////////////////
  //  Single-thread primary function.                                   //
  //  Returns variables with return statement.                          //
  //====================================================================//
  //  This function examines the individual HSPs within an HSP array,   //
  //  and returns one or more sets of consistent HSPs.  Multiple        //
  //  strategies are available, and selected through the                //
  //  options.evaluation_method.                                        //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (typeof(query    ) === 'undefined') { return []; }
  if (typeof(subject  ) === 'undefined') { return []; }
  if ( Array.isArray(subject  )) { return new []; }
  if (!Array.isArray(hsp_array)) { return new []; }
  options = this.complete_options(options);
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  function is_collinear(subset) {
    let collinear = true;
    subset.sort(function(a, b) {
      if (a.centroid.query < b.centroid.query) { return -1; }
      if (a.centroid.query > b.centroid.query) { return  1; }
      return 0;
    }); // end sort
    for (let i = 1; i < subset.length; i++) {
      if (subset[i].centroid.subject < subset[(i - 1)].centroid.subject) { collinear = false; }
    } // end for loop
    return collinear;
  } // end function
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  function is_overlap_okay(subset, options) {
    let overlap_okay = true;
    subset.sort(function(a, b) {
      if (a.expect < b.expect) { return -1; }
      if (a.expect > b.expect) { return  1; }
      return 0;
    }); // end sort
    for (let i = 1; i < subset.length; i++) {
      let j = i - 1;
      while (j >= 0) {
        if ((subset[i].query_end >= subset[j].query_end) && (subset[i].query_start <= subset[j].query_end)) {
          if (options.hsp_overlap) {
            let query_overlap = subset[j].query_end - subset[i].query_start;
            if ((query_overlap / subset[i].characters) >= options.hsp_overlap.degree) { overlap_okay = false; }
            if ((query_overlap / subset[j].characters) >= options.hsp_overlap.degree) { overlap_okay = false; }
          } // end if
          else { overlap_okay = false; }
        }
        else if ((subset[i].query_end >= subset[j].query_start) && (subset[i].query_start <= subset[j].query_start)) {
          if (options.hsp_overlap) {
            let query_overlap = subset[j].query_start - subset[i].query_end;
            if ((query_overlap / subset[i].characters) >= options.hsp_overlap.degree) { overlap_okay = false; }
            if ((query_overlap / subset[j].characters) >= options.hsp_overlap.degree) { overlap_okay = false; }
          } // end if
          else { overlap_okay = false; }
        } // end else if
        else if ((subset[i].query_start >= subset[j].query_start) && (subset[i].query_end <= subset[j].query_end)) { overlap_okay = false; }
        if ((subset[i].subject_end >= subset[j].subject_end) && (subset[i].subject_start <= subset[j].subject_end)) {
          if (options.hsp_overlap) {
            let subject_overlap = subset[j].subject_end - subset[i].subject_start;
            if ((subject_overlap / subset[i].characters) >= options.hsp_overlap.degree) { overlap_okay = false; }
            if ((subject_overlap / subset[j].characters) >= options.hsp_overlap.degree) { overlap_okay = false; }
          } // end if
          else { overlap_okay = false; }
        } // end else if
        else if ((subset[i].subject_end >= subset[j].subject_start) && (subset[i].subject_start <= subset[j].subject_start)) {
          if (options.hsp_overlap) {
            let subject_overlap = subset[j].subject_start - subset[i].subject_end;
            if ((subject_overlap / subset[i].characters) >= options.hsp_overlap.degree) { overlap_okay = false; }
            if ((subject_overlap / subset[j].characters) >= options.hsp_overlap.degree) { overlap_okay = false; }
          } // end if
          else { overlap_okay = false; }
        } // end else if
        else if ((subset[i].subject_start >= subset[j].subject_start) && (subset[i].subject_end <= subset[j].subject_end)) { overlap_okay = false; }
        j--;
      } // end while
    } // end for loop
    return overlap_okay;
  } // end function
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  function is_spread_okay(subset, options) {
    let spread_okay   = true;
    let subject_end   = -Infinity;
    let subject_start = Infinity;
    let query_end     = -Infinity;
    let query_start   = Infinity;
    for (let i = 0; i < subset.length; i++) {
      if (subset[i].subject_end   > subject_end   ) { subject_end   = subset[i].subject_end; }
      if (subset[i].subject_start < subject_start ) { subject_start = subset[i].subject_start; }
      if (subset[i].query_end     > query_end     ) { query_end     = subset[i].query_end; }
      if (subset[i].query_start   < query_start   ) { query_start   = subset[i].query_start; }
    } // end for loop
    let subject_coverage  = subject_end - subject_start;
    let query_coverage    = query_end   - query_start;
    if (subject_coverage > (query_coverage * (1 + options.max_hsp_spread_factor))) { spread_okay = false; }
    if (subject_coverage < (query_coverage * (1 - options.max_hsp_spread_factor))) { spread_okay = false; }
    return spread_okay;
  } // end function
  // METHOD //////////////////////////////////////////////////////////////
  function is_valid_p_value(report) {
    let valid = true;
    for (let i = 0; i < report.hsp.length; i++) {
      if (report.p_value > report.hsp[i].p_value) { valid = false; }
    } // end
    return valid;
  } // end function
  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////
  // FILTER THE HSP ARRAY ////////////////////////////////////////////////
  if (options.hsp_filtering.on) {
    switch (options.hsp_filtering.method) {
      case "bit score":   { hsp_array = this.filter_hsp_array_by_bit_score( hsp_array, options.hsp_filtering.threshold); break; }
      case "characters":  { hsp_array = this.filter_hsp_array_by_characters(hsp_array, options.hsp_filtering.threshold); break; }
      case "expect":      { hsp_array = this.filter_hsp_array_by_expect(    hsp_array, options.hsp_filtering.threshold); break; }
      case "nat score":   { hsp_array = this.filter_hsp_array_by_nat_score( hsp_array, options.hsp_filtering.threshold); break; }
      case "p-value":     { hsp_array = this.filter_hsp_array_by_p_value(   hsp_array, options.hsp_filtering.threshold); break; }
      case "score":       { hsp_array = this.filter_hsp_array_by_score(     hsp_array, options.hsp_filtering.threshold); break; }
      default: { break; }
    } // end switch
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // TRUNCATE HSP ARRAY //////////////////////////////////////////////////
  // BLAST-style algorithms usually use a threshold value for reducing
  // the HSP list at this stage.  Score thresholds, p-value thresholds,
  // and expect thresholds are common.  Here we're just sorting by the
  // expect values and truncating the array after 22 entries.  The
  // value 20 was chosen due to desktop computer memory constrainst,
  // and corresponds to a maximum of 4,194,304 possible groupings of
  // of HSPs.  This consumes about 460 MB of memory on my home
  // computer.
  hsp_array.sort(function(a, b) {
    if (a.expect < b.expect) { return -1; }
    if (a.expect > b.expect) { return  1; }
    if (a.expect === b.expect) {
      if (a.characters > b.characters) { return -1; }
      if (a.characters < b.characters) { return  1; }
    } // end if
    return 0;
  }); // end sort
  hsp_array = hsp_array.slice(0, 22);
  ////////////////////////////////////////////////////////////////////////
  // REMOVE INVALID OR DUPLICATE HSPs ////////////////////////////////////
  for (let i = 0; i < hsp_array.length; i++) {
    if (i > 0) {
      let j = i - 1;
      while (j >= 0) {
        if (hsp_array[j].keep) {
          if (JSON.stringify(hsp_array[i]) === JSON.stringify(hsp_array[j])) { hsp_array[i].keep = false; }
        } // end if
        j--;
      } // end while
    } // end if
    if (hsp_array[i].characters === 0) { hsp_array[i].keep = false; }
  } // end for loop
  hsp_array = this.filter_hsp_array(hsp_array);
  ////////////////////////////////////////////////////////////////////
  // GENERATE ALL POSSIBLE SUB-ARRAYS OF THE HSP ARRAY ///////////////
  hsp_array = this.calculate_hsp_centroids(hsp_array, options);
  const get_all_subsets = theArray => theArray.reduce((subsets, value) => subsets.concat(subsets.map(set => [value,...set])),[[]]);
  const subsets = get_all_subsets(hsp_array);
  ////////////////////////////////////////////////////////////////////
  // EVALUATE THE HSP SUBSETS ////////////////////////////////////////
  let hsp_reports = [];
  for (let i = 0; i < subsets.length; i++) {
    if (subsets[i].length) {
      if (subsets[i].length <= options.max_hsps) {
        if (is_collinear(subsets[i]) && is_overlap_okay(subsets[i], options) && is_spread_okay(subsets[i], options)) {
          let report = this.create_hsp_report(subsets[i], query, subject, options);
          if (is_valid_p_value(report)) { hsp_reports.push(report); }
        } // end if
      } // end if
    } // end if
  } // end for loop
  return hsp_reports;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.extend = function(hsp_array, query, subject, options) {
  ////////////////////////////////////////////////////////////////////////
  //  Single-thread primary function.                                   //
  //  Returns variables with return statement.                          //
  //====================================================================//
  //  This function extends all valid HSPs using the initial ungapped   //
  //  extension method employed by NCBI BLAST.  A gapped extension      //
  //  will then be used on appropriate HSPs if options.score.gapped     //
  //  is set to true.  Gapped alignments are performed using the        //
  //  X-drop algorithm.                                                 //
  //====================================================================//
  //  This function examines the following options:                     //
  //      single_hit_algorithm, score.gapped                            //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (typeof(query    ) === 'undefined') { return []; }
  if (typeof(subject  ) === 'undefined') { return []; }
  if ( Array.isArray(subject  )) { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  options = this.complete_options(options);
  ////////////////////////////////////////////////////////////////////////
  // TWO-HIT ALGORITHM ///////////////////////////////////////////////////
  if (!options.single_hit_algorithm) { hsp_array = this.two_hit(hsp_array, options); }
  ////////////////////////////////////////////////////////////////////////
  // X-DROP //////////////////////////////////////////////////////////////
  hsp_array = this.x_drop_ungapped(hsp_array, query, subject, options);
  hsp_array = this.cull_hsp_array(hsp_array, options);
  if (options.score.gapped) {
    hsp_array = this.x_drop_gapped(hsp_array, query, subject, options);
    hsp_array = this.cull_hsp_array(hsp_array, options);
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // RETURN FUNCTION /////////////////////////////////////////////////////
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.global = function(query, subject, options) {
  ////////////////////////////////////////////////////////////////////////
  // CHECK ARGUMENTS /////////////////////////////////////////////////////
  if (typeof(query  ) === 'undefined') { return new Report(); }
  if (typeof(subject) === 'undefined') { return new Report(); }
  if (Array.isArray(subject)) { return new Report(); }
  options = this.complete_options(options);
  if (!options.batch) { options.batch = subject.length; }
  options.score.gapped = true;
  if (/[a-z]/.test(query)) { query = query.toUpperCase(); }
  if (/[a-z]/.test(subject.sequence)) { subject.sequence = subject.sequence.toUpperCase(); }
  //////////////////////////////////////////////////////////////////////
  // SETUP /////////////////////////////////////////////////////////////
  const hsp = new HSP();
  let hsp_array = [];
  const stats = this.calculate_search_space(query, subject, options);
  ////////////////////////////////////////////////////////////////////
  // CREATE THE MATRIX ///////////////////////////////////////////////
  let matrix = this.create_matrix((query.length + 1), (subject.sequence.length + 1));
  for (let row = 0; row <= query.length; row++) {
    for (let column = 0; column <= subject.sequence.length; column++) {
      matrix[row][column] = { direction: "diagonal", score: 0 };
    } // end for loop
  } // end for loop
  ////////////////////////////////////////////////////////////////////
  // INITIALIZE THE MATRIX ///////////////////////////////////////////
  for (let row = 1; row <= query.length; row++) {
    let init_row = matrix[(row - 1)][0].score - options.score.gap_extend;
    matrix[row][0] = { direction: "vertical", score: init_row };
  } // end for loop
  for (let column = 1; column <= subject.sequence.length; column++) {
    let init_column = matrix[0][(column - 1)].score - options.score.gap_extend;
    matrix[0][column] = { direction: "horizontal", score: init_column };
  } // end for loop
  //////////////////////////////////////////////////////////////
  // PERFORM THE ALIGNMENT /////////////////////////////////////
  for (let row = 1; row <= query.length; row++) {
    for (let column = 1; column <= subject.sequence.length; column++) {
      let letter1 = query.charAt(row - 1);
      let letter2 = subject.sequence.charAt(column - 1);
      let diagonal_score   = 0;
      let horizontal_score = 0;
      let vertical_score   = 0;
      // calculate diagonal score
      diagonal_score = matrix[(row - 1)][(column - 1)].score + options.score.matrix[letter1][letter2];
      // calculate vertical score (with affine gaps)
      if (matrix[(row - 1)][column].direction == 'vertical') { vertical_score = matrix[(row - 1)][column].score - options.score.gap_extend; }
      else { vertical_score = matrix[(row - 1)][column].score - (options.score.gap_open + options.score.gap_extend); }
      // calculate horizontal score (with affine gaps)
      if (matrix[row][(column - 1)].direction == 'horizontal') { horizontal_score = matrix[row][(column - 1)].score - options.score.gap_extend; }
      else { horizontal_score = matrix[row][(column - 1)].score - (options.score.gap_open + options.score.gap_extend); }
      // max score
      let max_score = Math.max(diagonal_score, vertical_score, horizontal_score);
      // record score and direction
      matrix[row][column].score = max_score;
      if (horizontal_score == max_score) { matrix[row][column].direction = 'horizontal'; }
      if (vertical_score   == max_score) { matrix[row][column].direction = 'vertical';   }
      if (diagonal_score   == max_score) { matrix[row][column].direction = 'diagonal';   }
    } // end for loop
  } // end for loop
  ////////////////////////////////////////////////////////////////////
  // PERFORM THE TRACE BACK //////////////////////////////////////////
  let row = query.length;
  let column = subject.sequence.length;
  hsp.query = "";
  hsp.subject = "";
  while((row > 0) && (column > 0)) {
    switch(matrix[row][column].direction) {
      case 'diagonal': {
        hsp.query += query.charAt(row - 1);
        hsp.subject += subject.sequence.charAt(column - 1);
        row--; column--;
        break;
      } // end case
      case 'horizontal': {
        hsp.query += "-";
        hsp.subject += subject.sequence.charAt(column - 1);
        column--;
        break;
      } // end case
      case 'vertical': {
        hsp.query += query.charAt(row - 1);
        hsp.subject += "-";
        row--;
        break;
      } // end case
    } // end switch
  } // end while
  hsp.query    = this.flip_string(hsp.query);
  hsp.subject  = this.flip_string(hsp.subject);
  hsp_array.push(hsp);
  hsp_array = this.calculate_hsp_scores(hsp_array, query, subject, options);
  const report = this.create_hsp_report(hsp_array, query, subject, options);
  return report;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.link_HSPs = function(hsp_array, query, subject, options) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (typeof(query  ) === 'undefined') { return []; }
  if (typeof(subject) === 'undefined') { return []; }
  if (Array.isArray(subject)) { return []; }
  options = this.complete_options(options);
  if (!hsp_array.length || hsp_array.length === 1) { return hsp_array; }
  let colinear = false;
  let last_subject_centroid = 0;
  let lowest_expect = Infinity;
  let lowest_expect_index = 0;
  hsp_array = this.calculate_hsp_centroids(hsp_array, options, "exonerate");
  // sort the hsp array by centroid, from lowest to highest
  hsp_array.sort(function(a, b) {
    if (a.centroid.query < b.centroid.query) { return -1; }
    if (a.centroid.query > b.centroid.query) { return  1; }
    return 0;
  }); // end sort
  ////////////////////////////////////////////////////////////////////////
  // MAKE SURE THE HSPs ARE COLINEAR /////////////////////////////////////
  while (!colinear) {
    for (let i = 0; i < hsp_array.length; i++) {
      if (hsp_array[i].expect < lowest_expect) { lowest_expect = hsp_array[i].expect; lowest_expect_index = i; }
      if (hsp_array[i].centroid.subject < last_subject_centroid) { hsp_array[i].keep = false; }
      else { last_subject_centroid = hsp_array[i].centroid.subject; }
    } // end for loop
    if (hsp_array[lowest_expect_index].keep) { colinear = true; }
    else {
      for (let i = 0; i < hsp_array.length; i++) {
        if (hsp_array[i].keep) { hsp_array[i].keep = false; }
        else { hsp_array[i].keep = true; }
      } // end for loop
    } // end else
    hsp_array = this.filter_hsp_array(hsp_array);
  } // end while
  ////////////////////////////////////////////////////////////////////////
  // BREAK HSPs AT CENTROID //////////////////////////////////////////////
  for (let i = 0; i < hsp_array.length; i++) {
    hsp_array[i].query_head = hsp_array[i].query.substring(0, (hsp_array[i].centroid.query - hsp_array[i].query_start));
    hsp_array[i].query_tail = hsp_array[i].query.substring((hsp_array[i].centroid.query - hsp_array[i].query_start), hsp_array[i].query.length);
    hsp_array[i].subject_head = hsp_array[i].subject.substring(0, (hsp_array[i].centroid.subject - hsp_array[i].subject_start));
    hsp_array[i].subject_tail = hsp_array[i].subject.substring((hsp_array[i].centroid.subject - hsp_array[i].subject_start), hsp_array[i].subject.length);
    hsp_array[i].link_from_previous = false;
    hsp_array[i].link_to_next = false;
  } // end for loop
  let new_hsp_array = [];
  let new_hsp = new HSP();
  for (let i = 0; i < hsp_array.length; i++) {
    if (!hsp_array[i].link_from_previous) {
      new_hsp.query   = hsp_array[i].query_head;
      new_hsp.subject = hsp_array[i].subject_head;
    } // end if
    if (i < (hsp_array.length - 1)) {
      if (((hsp_array[i + 1].query_start - hsp_array[i].query_end) < 800) && ((hsp_array[i + 1].subject_start - hsp_array[i].subject_end) < 800)) {
        hsp_array[i + 1].link_from_previous = true;
        hsp_array[i].link_to_next = true;
        hsp_array[i].query_between = query.substring(hsp_array[i].centroid.query, hsp_array[i + 1].centroid.query);
        hsp_array[i].subject_between = subject.sequence.substring(hsp_array[i].centroid.subject, hsp_array[i + 1].centroid.subject);
        hsp_array[i].report_between = this.global(hsp_array[i].query_between, { sequence: hsp_array[i].subject_between }, options);
        new_hsp.query   += hsp_array[i].report_between.hsp[0].query;
        new_hsp.subject += hsp_array[i].report_between.hsp[0].subject;
      } // end if
    } // end if
    if (!hsp_array[i].link_to_next) {
      new_hsp.query   += hsp_array[i].query_tail;
      new_hsp.subject += hsp_array[i].subject_tail;
      new_hsp_array.push(JSON.parse(JSON.stringify(new_hsp)));
      new_hsp = new HSP();
    } // end if
  } // end for loop
  hsp_array = this.calculate_hsp_scores(new_hsp_array, query, subject, options);
  ////////////////////////////////////////////////////////////////////////
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.seed = function(query, subject, options) {
  ////////////////////////////////////////////////////////////////////////
  //  Single-thread primary function.                                   //
  //  Returns variables with return statement.                          //
  //====================================================================//
  //  This function matches all words of the specified length           //
  //  (default 4 characters for amino acids and 8 for nucleotides)      //
  //  between the query and subject sequences.  If word_exact_match is  //
  //  set to true, then only exact matches are considered.  Otherwise   //
  //  matches will be any subject word that scores at least as high as  //
  //  word_score_threshold when compared to the query sequence, and     //
  //  using the scoring matrix indicated byscore.matrix.  To limit      //
  //  computation time, no more than max_seeds hits will be considered. //
  //  However, by default this value is set very large (10 000).  An    //
  //  array of high-scoring segment pairs is returned to the user.      //
  //====================================================================//
  //  This function examines the following options:                     //
  //      score.matrix, score.matrix.type, seed.word_size,              //
  //      seed.score_threshold, seed.exact_match, seed.max_number,      //
  //      seed.filter_low_complexity                                    //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(query  ) === 'undefined') { return []; }
  if (typeof(subject) === 'undefined') { return []; }
  if (Array.isArray(subject)) { return []; }
  options = this.complete_options(options);
  let hsp_array = [];
  let query_word_index = options.seed.word_size;
  ////////////////////////////////////////////////////////////////////////
  // FILTER QUERY LOW COMPLEXITY REGIONS /////////////////////////////////
  //  Low-complexity regions are filtered for amino acids using the SEG //
  //  algorithm delevoped by Wootton JC and Federhen S (1993).  The     //
  //  values used here for the window length (w), trigger complexity    //
  //  (k2_1) and extension complexity (k2_2) are the values suggested   //
  //  by Schäffer AA, et. al (2001).                                    //
  //====================================================================//
  //   SEG References:                                                  //
  //   [1] Wootton, J. C., & Federhen, S. (1993). Statistics of local   //
  //      complexity in amino acid sequences and sequence databases.    //
  //      Computers & chemistry, 17(2), 149-163.                        //
  //  [2] Schäffer, A. A., Aravind, L., Madden, T. L., Shavirin,        //
  //      S., Spouge, J. L., Wolf, Y. I., Koonin, E. V., & Altschul,    //
  //      S. F. (2001). Improving the accuracy of PSI-BLAST protein     //
  //      database searches with composition-based statistics and       //
  //      other refinements. Nucleic acids research, 29(14), 2994-      //
  //      3005.                                                         //
  //====================================================================//
  //  Low-complexity regions are filtered for nucleotides using the     //
  //  SDUST algorithm developed by Morgulis A, et. al. (2006), which is //
  //  itself a modification of the DUST algorithm developed by Tatusov  //
  //  R. and Lipman D.J. (unpublished data).  The published default     //
  //  values are used (a window length of 64 and a score threshold of   //
  //  2).                                                               //
  //====================================================================//
  //  SDUST Reference:                                                  //
  //  [1] Morgulis, A., Gertz, E. M., Schäffer, A. A., & Agarwala, R.   //
  //    (2006). A fast and symmetric DUST implementation to mask low-   //
  //    complexity DNA sequences. Journal of Computational Biology,     //
  //    13(5), 1028-1040.                                               //
  ////////////////////////////////////////////////////////////////////////
  if (options.score.matrix.type === 'amino acids') {
    if (!(/[a-z]/.test(query)) && options.seed.filter_low_complexity) {
      query = seg(query, { w: 10, k2_1: 1.8, k2_2: 2.1 });
    } // end if
  } // end if
  else if (options.score.matrix.type === 'nucleotides') {
    if (!(/[a-z]/.test(query)) && options.seed.filter_low_complexity) {
      query = sdust(query);
    } // end if
  } // end if
  ////////////////////////////////////////////////////////////////////////
  while ((query_word_index <= query.length) && (hsp_array.length <= options.seed.max_number)) {
    let query_word = query.substring(query_word_index - options.seed.word_size, query_word_index);
    if (/[a-z]/.test(query_word) && options.seed.filter_low_complexity) { query_word_index++; continue; }
    let query_word_score = 0;
    for (let i = 0; i < options.seed.word_size; i++) { query_word_score += options.score.matrix[query_word.charAt(i)][query_word.charAt(i)]; }
    if ((query_word_score >= options.seed.score_threshold) || options.seed.exact_match) {
      let subject_word_index = options.seed.word_size;
      while ((subject_word_index <= subject.sequence.length) && (hsp_array.length <= options.seed.max_number)) {
        let subject_word = subject.sequence.substring(subject_word_index - options.seed.word_size, subject_word_index);
        let word_score = 0;
        for (let i = 0; i < options.seed.word_size; i++) { word_score += options.score.matrix[query_word.charAt(i)][subject_word.charAt(i)]; }
        if ((word_score >= options.seed.score_threshold) || (options.seed.exact_match && (query_word === subject_word))) {
          let hsp = new HSP();
          hsp.query           =   query_word;
          hsp.subject         =   subject_word;
          hsp.query_start     =   query_word_index - options.seed.word_size;
          hsp.query_end       =   query_word_index - 1;
          hsp.subject_start   =   subject_word_index - options.seed.word_size;
          hsp.subject_end     =   subject_word_index - 1;
          hsp.score           =   word_score;
          hsp.diagonal        =   hsp.query_start - hsp.subject_start;
          // check to see if the current HSP overlaps an
          // existing HSP; if so, merge the two HSPs
          for (let i = 0; i < hsp_array.length; i++) {
            if ((hsp.query_start   > hsp_array[i].query_start  ) && (hsp.query_start   < hsp_array[i].query_end  ) && (hsp.query_end   > hsp_array[i].query_end  ) &&
                (hsp.subject_start > hsp_array[i].subject_start) && (hsp.subject_start < hsp_array[i].subject_end) && (hsp.subject_end > hsp_array[i].subject_end) &&
                ((hsp.query_start - hsp_array[i].query_start) === (hsp.subject_start - hsp_array[i].subject_start))) {
              hsp_array[i].query_end   = hsp.query_end;
              hsp_array[i].subject_end = hsp.subject_end;
              hsp_array[i].query   = query.substring(hsp_array[i].query_start, hsp_array[i].query_end);
              hsp_array[i].subject = subject.sequence.substring(hsp_array[i].subject_start, hsp_array[i].subject_end);
              hsp_array[i].extended = true;
              hsp_array[i].changed  = true;
              hsp.keep = false;
            } // end if
          } // end for loop
          if (hsp.keep) { hsp_array.push(hsp); }
        } // end if
        subject_word_index++;
      } // end while
    } // end if
    query_word_index++;
  } // end while loop
  // calculate the HSP scores
  hsp_array = this.calculate_hsp_scores(hsp_array, query, subject, options);
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.two_hit = function(hsp_array, options) {
  ////////////////////////////////////////////////////////////////////////
  //  Single-thread primary function.                                   //
  //  Returns variables with return statement.                          //
  //====================================================================//
  //  This function performs the standard BLAST two-hit algorithm.      //
  //  In short, this function removes HSPs if both of the following     //
  //  criteria are met: (1) the HSP has not been previously extended,   //
  //  and (2) the HSP does not have a neighboring HSP on the same       //
  //  diagonal within a distance of 40 characters.                      //
  //====================================================================//
  //  This function examines the following options:                     //
  //      two_hit_window_size                                           //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  options = this.complete_options(options);
  let dist = this.create_diagonal_distribution(hsp_array, options);
  for (let i = 0; i < hsp_array.length; i++) {
    let min_distance = Infinity;
    if (dist[hsp_array[i].diagonal].length > 1) {
      for (let j = 0; j < dist[hsp_array[i].diagonal].length; j++) {
        let distance = Math.abs(hsp_array[i].query_start - hsp_array[dist[hsp_array[i].diagonal][j]].query_start);
        if (distance && (distance < min_distance)) { min_distance = distance; }
      } // end for loop
      if ((min_distance > options.two_hit_window_size) && (!hsp_array[i].extended)) { hsp_array[i].keep = false; }
    } // end if
  } // end for loop
  hsp_array = this.filter_hsp_array(hsp_array);
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.x_drop_gapped = function(hsp_array, query, subject, options) {
  ////////////////////////////////////////////////////////////////////////
  //  Single-thread primary function.                                   //
  //  Returns variables with return statement.                          //
  //====================================================================//
  //  For gapped alignments, a centroid value is calculated for the HSP //
  //  (defined as the center position of the highest-scoring eleven-    //
  //  character-wide sliding window).  A floating-bandwidth gapped      //
  //  local alignment is then performed in either direction from the    //
  //  centroid position.  The floating band-width algorithm scans       //
  //  anti-diagonals proceeding away from the centroid position, and    //
  //  only keeps scores that lay above a floating threshold             //
  //  (calculated as the best score along the anti-diagonal, minus      //
  //  the score specified by the option "x_drop.X2").  Once the         //
  //  scores have been calculated, the local alignment is determined    //
  //  by performing a trace-back from the highest-scoring cell.         //
  //====================================================================//
  //   References:                                                      //
  //  [1] Altschul, S. F., Madden, T. L., Schäffer, A. A., Zhang, J.,   //
  //      Zhang, Z., Miller, W., & Lipman, D. J. (1997). Gapped BLAST   //
  //      and PSI-BLAST: a new generation of protein database search    //
  //      programs. Nucleic acids research, 25(17), 3389-3402.          //
  //  [2] Zhang, Z., Berman, P., & Miller, W. (1998). Alignments        //
  //      without low-scoring regions. Journal of Computational         //
  //      Biology, 5(2), 197-210.                                       //
  //====================================================================//
  //  This function examines the following options:                     //
  //      x_drop.X2, x_drop.X2_trigger, score.matrix, score.gap_open,   //
  //      score.gap_extend                                              //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (typeof(query    ) === 'undefined') { return []; }
  if (typeof(subject  ) === 'undefined') { return []; }
  if ( Array.isArray(subject  )) { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  options = this.complete_options(options);
  let stats = this.calculate_search_space(query, subject, options);
  ////////////////////////////////////////////////////////////////////////
  // GAPPED X-DROP ///////////////////////////////////////////////////////
  hsp_array = this.calculate_hsp_centroids(hsp_array, options, 'x-drop');
  for (let i = 0; i < hsp_array.length; i++) {
    if (hsp_array[i].bit_score >= options.x_drop.X2_trigger) {
      let left_side_query     =   '';
      let right_side_query    =   '';
      let left_side_subject   =   '';
      let right_side_subject  =   '';
      ////////////////////////////////////////////////////////////////////
      // EXTEND TO THE RIGHT /////////////////////////////////////////////
      // initialize variables
      let row                   = 0;
      let column                = 0;
      let verticle_score        = 0;
      let diagonal_score        = 0;
      let horizontal_score      = 0;
      let best_address          = '';
      let best_bit_score        = -Infinity;
      let matrix                = { };
      let matrix_keys           = [];
      let d                     = hsp_array[i].centroid.subject + hsp_array[i].centroid.query + 1;
      let antidiagonal          = [];
      let upper_limit           = hsp_array[i].centroid.query;
      let lower_limit           = hsp_array[i].centroid.query + 1;
      let address               = hsp_array[i].centroid.subject.toString() + '-' + hsp_array[i].centroid.query.toString();
      let current_cell          = { address: { i: 0, j: 0 }, score: 0, direction: 'diagonal' };
      let vertical_cell         = { address: { i: 0, j: 0 }, score: 0, direction: 'diagonal' };
      let diagonal_cell         = { address: { i: 0, j: 0 }, score: 0, direction: 'diagonal' };
      let horizontal_cell       = { address: { i: 0, j: 0 }, score: 0, direction: 'diagonal' };
      matrix[address]           = { address: { i: 0, j: 0 }, score: 0, direction: 'diagonal' };
      // initialize the first cell of the matrix
      matrix[address].address.i = hsp_array[i].centroid.query;
      matrix[address].address.j = hsp_array[i].centroid.subject;
      matrix[address].score     = 0;
      matrix[address].direction = "diagonal";
      current_cell.address.i    = upper_limit;
      current_cell.address.j    = d - current_cell.address.i;
      // loop to calculate the scores along the antidiagonal
      while (d < (subject.sequence.length + query.length)) {
        if ((current_cell.address.i < query.length) && (current_cell.address.j < subject.sequence.length)) {
          let query_letter        = query.charAt(current_cell.address.i);
          let subject_letter      = subject.sequence.charAt(current_cell.address.j);
          let vertical_address    =  current_cell.address.j.toString()      + '-' + (current_cell.address.i - 1).toString();
          let diagonal_address    = (current_cell.address.j - 1).toString() + '-' + (current_cell.address.i - 1).toString();
          let horizontal_address  = (current_cell.address.j - 1).toString() + '-' +  current_cell.address.i.toString();
          //  copy the surrounding matrix cells to the
          //  three reference cells
          if (matrix[vertical_address  ]) { vertical_cell   = Object.assign({ }, matrix[vertical_address  ]); } else { vertical_cell.score   = -Infinity; }
          if (matrix[diagonal_address  ]) { diagonal_cell   = Object.assign({ }, matrix[diagonal_address  ]); } else { diagonal_cell.score   = -Infinity; }
          if (matrix[horizontal_address]) { horizontal_cell = Object.assign({ }, matrix[horizontal_address]); } else { horizontal_cell.score = -Infinity; }
          if (vertical_cell.direction   === 'vertical'  ) { vertical_score   = vertical_cell.score   - options.score.gap_extend; } else { vertical_score   = vertical_cell.score   - (options.score.gap_open + options.score.gap_extend); }
          if (horizontal_cell.direction === 'horizontal') { horizontal_score = horizontal_cell.score - options.score.gap_extend; } else { horizontal_score = horizontal_cell.score - (options.score.gap_open + options.score.gap_extend); }
          diagonal_score = diagonal_cell.score + options.score.matrix[query_letter][subject_letter];
          let max_score = Math.max(diagonal_score, vertical_score, horizontal_score);
          current_cell.score = max_score;
          current_cell.bit_score = this.raw_score_to_bit_score(max_score, stats);
          if (horizontal_score === max_score) { current_cell.direction = 'horizontal'; }
          else if (vertical_score === max_score) { current_cell.direction = 'vertical';   }
          else if (diagonal_score === max_score) { current_cell.direction = 'diagonal';   }
          if (current_cell.score > -Infinity) { antidiagonal.push(this.copy_object(current_cell)); }
        } // end if
        current_cell.address.i++;
        current_cell.address.j = d - current_cell.address.i;
        if ((current_cell.address.i > lower_limit) || (current_cell.address.j < hsp_array[i].centroid.subject) || (current_cell.address.i >= query.length)) {
          //  The antidiagonal is finished.
          //  Calculate the new upper and lower limits,
          //  transfer the antidiagonal cells to the matrix,
          //  and start a new antidiagonal
          if (antidiagonal.length) {
            upper_limit =  Infinity;
            lower_limit = -Infinity;
            for (let k = 0; k < antidiagonal.length; k++) {
              if (antidiagonal[k].bit_score >= (best_bit_score - options.x_drop.X2)) {
                if (antidiagonal[k].address.i < upper_limit) { upper_limit = antidiagonal[k].address.i; }
                if (antidiagonal[k].address.i > lower_limit) { lower_limit = antidiagonal[k].address.i; }
                address = antidiagonal[k].address.j.toString() + '-' + antidiagonal[k].address.i.toString();
                matrix[address] = this.copy_object(antidiagonal[k]);
              } // end if
            } // end for loop
            for (let k = 0; k < antidiagonal.length; k++) {
              if (antidiagonal[k].bit_score >= best_bit_score) {
                best_bit_score = antidiagonal[k].bit_score;
                best_address = antidiagonal[k].address.j.toString() + '-' + antidiagonal[k].address.i.toString();
                row = antidiagonal[k].address.i;
                column = antidiagonal[k].address.j;
                hsp_array[i].query_end   = antidiagonal[k].address.i;
                hsp_array[i].subject_end = antidiagonal[k].address.j;
              } // end if
            } // end for loop
            delete antidiagonal;
            antidiagonal = [];
            lower_limit++;
            d++;
            current_cell.address.i = upper_limit;
            current_cell.address.j = d - current_cell.address.i;
          } // end if
          else { break; }
        } // end if
      } // end while loop
      // begin the trace-back
      address = best_address;
      if (best_bit_score > -Infinity) {
        while ((row >= hsp_array[i].centroid.query) && (column >= hsp_array[i].centroid.subject)) {
          switch(matrix[address].direction) {
            case 'diagonal': {
              right_side_query += query.charAt(matrix[address].address.i);
              right_side_subject += subject.sequence.charAt(matrix[address].address.j);
              row--;
              column--;
              break;
            } // end case
            case 'vertical': {
              right_side_query += query.charAt(matrix[address].address.i);
              right_side_subject += '-';
              row--;
              break;
            } // end case
            case 'horizontal': {
              right_side_query   += '-';
              right_side_subject += subject.sequence.charAt(matrix[address].address.j);
              column--;
              break;
            } // end case
            default: { break; }
          } // end switch
          address = column.toString() + '-' + row.toString();
        } // end while
      } // end if
      right_side_query   = this.flip_string(right_side_query  );
      right_side_subject = this.flip_string(right_side_subject);
      delete matrix;
      ////////////////////////////////////////////////////////////////////
      // EXTEND TO THE LEFT //////////////////////////////////////////////
      // initialize variables
      row               = 0;
      column            = 0;
      verticle_score    = 0;
      diagonal_score    = 0;
      horizontal_score  = 0;
      best_address      = '';
      best_bit_score    = -Infinity;
      matrix            = { };
      matrix_keys       = [];
      d                 = hsp_array[i].centroid.subject + hsp_array[i].centroid.query - 1;
      antidiagonal      = [];
      upper_limit       = hsp_array[i].centroid.query - 1;
      lower_limit       = hsp_array[i].centroid.query;
      address           = hsp_array[i].centroid.subject.toString() + '-' + hsp_array[i].centroid.query.toString();
      current_cell      = { address: { i: 0, j: 0 }, score: 0, direction: 'diagonal' };
      vertical_cell     = { address: { i: 0, j: 0 }, score: 0, direction: 'diagonal' };
      diagonal_cell     = { address: { i: 0, j: 0 }, score: 0, direction: 'diagonal' };
      horizontal_cell   = { address: { i: 0, j: 0 }, score: 0, direction: 'diagonal' };
      matrix[address]   = { address: { i: 0, j: 0 }, score: 0, direction: 'diagonal' };
      // initialize the first cell of the matrix
      matrix[address].address.i = hsp_array[i].centroid.query;
      matrix[address].address.j = hsp_array[i].centroid.subject;
      matrix[address].score     = 0;
      matrix[address].direction = 'diagonal';
      current_cell.address.i    = lower_limit;
      current_cell.address.j    = d - current_cell.address.i;
      // loop to calculate the scores along the antidiagonal
      while (d >= 0) {
        if ((current_cell.address.i >= 0) && (current_cell.address.j >= 0)) {
          let query_letter        = query.charAt(current_cell.address.i);
          let subject_letter      = subject.sequence.charAt(current_cell.address.j);
          let vertical_address    =  current_cell.address.j.toString()      + '-' + (current_cell.address.i + 1).toString();
          let diagonal_address    = (current_cell.address.j + 1).toString() + '-' + (current_cell.address.i + 1).toString();
          let horizontal_address  = (current_cell.address.j + 1).toString() + '-' +  current_cell.address.i.toString();
          //  copy the surrounding matrix cells to the
          //  three reference cells
          if (matrix[vertical_address  ]) { vertical_cell   = Object.assign({ }, matrix[vertical_address  ]); } else { vertical_cell.score   = -Infinity; }
          if (matrix[diagonal_address  ]) { diagonal_cell   = Object.assign({ }, matrix[diagonal_address  ]); } else { diagonal_cell.score   = -Infinity; }
          if (matrix[horizontal_address]) { horizontal_cell = Object.assign({ }, matrix[horizontal_address]); } else { horizontal_cell.score = -Infinity; }
          if (vertical_cell.direction   === 'vertical'  ) { vertical_score   = vertical_cell.score   - options.score.gap_extend; } else { vertical_score   = vertical_cell.score   - (options.score.gap_open + options.score.gap_extend); }
          if (horizontal_cell.direction === 'horizontal') { horizontal_score = horizontal_cell.score - options.score.gap_extend; } else { horizontal_score = horizontal_cell.score - (options.score.gap_open + options.score.gap_extend); }
          diagonal_score = diagonal_cell.score + options.score.matrix[query_letter][subject_letter];
          let max_score = Math.max(diagonal_score, vertical_score, horizontal_score);
          current_cell.score = max_score;
          current_cell.bit_score = this.raw_score_to_bit_score(max_score, stats);
          if (horizontal_score === max_score) { current_cell.direction = 'horizontal'; }
          if (vertical_score   === max_score) { current_cell.direction = 'vertical';   }
          if (diagonal_score   === max_score) { current_cell.direction = 'diagonal';   }
          if (current_cell.score > -Infinity) { antidiagonal.push(this.copy_object(current_cell)); }
        } // end if
        current_cell.address.i--;
        current_cell.address.j = d - current_cell.address.i;
        if ((current_cell.address.i < upper_limit) || (current_cell.address.j > hsp_array[i].centroid.subject) || (current_cell.address.i < 0)) {
          //  The antidiagonal is finished.
          //  Calculate the new upper and lower limits,
          //  transfer the antidiagonal cells to the matrix,
          //  and start a new antidiagonal
          if (antidiagonal.length) {
            upper_limit =  Infinity;
            lower_limit = -Infinity;
            for (let k = 0; k < antidiagonal.length; k++) {
              if (antidiagonal[k].bit_score >= (best_bit_score - options.x_drop.X2)) {
                if (antidiagonal[k].address.i < upper_limit) { upper_limit = antidiagonal[k].address.i; }
                if (antidiagonal[k].address.i > lower_limit) { lower_limit = antidiagonal[k].address.i; }
                address = antidiagonal[k].address.j.toString() + '-' + antidiagonal[k].address.i.toString();
                matrix[address] = this.copy_object(antidiagonal[k]);
              } // end if
            } // end for loop
            for (let k = 0; k < antidiagonal.length; k++) {
              if (antidiagonal[k].bit_score >= best_bit_score) {
                best_bit_score = antidiagonal[k].bit_score;
                best_address = antidiagonal[k].address.j.toString() + '-' + antidiagonal[k].address.i.toString();
                row = antidiagonal[k].address.i;
                column = antidiagonal[k].address.j;
                hsp_array[i].query_start   = antidiagonal[k].address.i;
                hsp_array[i].subject_start = antidiagonal[k].address.j;
              } // end if
            } // end for loop
            delete antidiagonal;
            antidiagonal = [];
            upper_limit--;
            d--;
            current_cell.address.i = lower_limit;
            current_cell.address.j = d - current_cell.address.i;
          } // end if
          else { break; }
        } // end if
      } // end while loop
      // begin the trace-back
      address = best_address;
      if (best_bit_score > -Infinity) {
        while ((row <= hsp_array[i].centroid.query) && (column <= hsp_array[i].centroid.subject)) {
          switch(matrix[address].direction) {
            case 'diagonal': {
              left_side_query += query.charAt(matrix[address].address.i);
              left_side_subject += subject.sequence.charAt(matrix[address].address.j);
              row++;
              column++;
              break;
            } // end case
            case 'vertical': {
              left_side_query += query.charAt(matrix[address].address.i);
              left_side_subject += '-';
              row++;
              break;
            } // end case
            case 'horizontal': {
              left_side_query   += '-';
              left_side_subject += subject.sequence.charAt(matrix[address].address.j);
              column++;
              break;
            } // end case
            default: { break; }
          } // end switch
          address = column.toString() + '-' + row.toString();
        } // end while
      } // end if
      delete matrix;
      ////////////////////////////////////////////////////////////////////
      if (left_side_query  ) { left_side_query   =   left_side_query.substring(0, left_side_query.length   - 1); }
      if (left_side_subject) { left_side_subject = left_side_subject.substring(0, left_side_subject.length - 1); }
      hsp_array[i].changed = true;
      hsp_array[i].extended = true;
      hsp_array[i].gapped_alignment = true;
      hsp_array[i].subject = left_side_subject + right_side_subject;
      hsp_array[i].query   = left_side_query   + right_side_query;
    } // end if
  } // end for loop
  hsp_array = this.filter_hsp_array(hsp_array);
  hsp_array = this.calculate_hsp_scores(hsp_array, query, subject, options);
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.x_drop_ungapped = function(hsp_array, query, subject, options) {
  ////////////////////////////////////////////////////////////////////////
  //  Single-thread primary function.                                   //
  //  Returns variables with return statement.                          //
  //====================================================================//
  //  For ungapped alignments, the HSP is extended in both directions   //
  //  by pairwise alignment.  If the total score in either direction    //
  //  falls below a floating threshold (calculated as the score of the  //
  //  maximum score achieved in that direction, minus the score         //
  //  specified by the option "x_drop.X1"), then the alignment process  //
  //  stops and the alignment is truncated to the position of the       //
  //  maximum score in that direction.                                  //
  //====================================================================//
  //   References:                                                      //
  //  [1] Altschul, S. F., Madden, T. L., Schäffer, A. A., Zhang, J.,   //
  //      Zhang, Z., Miller, W., & Lipman, D. J. (1997). Gapped BLAST   //
  //      and PSI-BLAST: a new generation of protein database search    //
  //      programs. Nucleic acids research, 25(17), 3389-3402.          //
  //  [2] Zhang, Z., Berman, P., & Miller, W. (1998). Alignments        //
  //      without low-scoring regions. Journal of Computational         //
  //      Biology, 5(2), 197-210.                                       //
  //====================================================================//
  //  This function examines the following options:                     //
  //      x_drop.X1,score.matrix, score.gap_open, score.gap_extend      //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (typeof(query    ) === 'undefined') { return []; }
  if (typeof(subject  ) === 'undefined') { return []; }
  if ( Array.isArray(subject  )) { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  options = this.complete_options(options);
  options.score.gapped = false;
  let dist = this.create_diagonal_distribution(hsp_array);
  let stats = this.calculate_search_space(query, subject, options);
  ////////////////////////////////////////////////////////////////////////
  // UNGAPPED X-DROP /////////////////////////////////////////////////////
  for (let i = 0; i < hsp_array.length; i++) {
    if (hsp_array[i].keep) {
      let left_score          = 0;
      let left_bit_score      = 0;
      let right_score         = 0;
      let right_bit_score     = 0;
      let max_left_bit_score  = -Infinity;
      let max_right_bit_score = -Infinity;
      let left_identity       = 0;
      let right_identity      = 0;
      let max_left_index      = { query_index: hsp_array[i].query_start, subject_index: hsp_array[i].subject_start };
      let max_right_index     = { query_index: hsp_array[i].query_end, subject_index: hsp_array[i].subject_end };
      if (hsp_array[i].score) { max_right_index = { query_index: hsp_array[i].query_end, subject_index: hsp_array[i].subject_end }; }
      // extend left
      let query_index   = hsp_array[i].query_start   - 1;
      let subject_index = hsp_array[i].subject_start - 1;
      while ((query_index >= 0) && (subject_index >= 0) && (left_bit_score >= (max_left_bit_score - options.x_drop.X1))) {
        let letter1 = query[query_index];
        let letter2 = subject.sequence[subject_index];
        if (letter1 === letter2) { left_identity++; }
        left_score += options.score.matrix[letter1][letter2];
        left_bit_score = this.raw_score_to_bit_score(left_score, stats);
        if (left_bit_score >= max_left_bit_score) {
          max_left_bit_score = left_bit_score;
          max_left_index.query_index   = query_index;
          max_left_index.subject_index = subject_index;
        } // end if
        query_index--;
        subject_index--;
      } // end while
      // extend right
      query_index   = hsp_array[i].query_end   + 1;
      subject_index = hsp_array[i].subject_end + 1;
      while ((query_index < query.length) && (subject_index < subject.sequence.length) && (right_bit_score >= (max_right_bit_score - options.x_drop.X1))) {
        let letter1 = query.charAt(query_index);
        let letter2 = subject.sequence.charAt(subject_index);
        if (letter1 === letter2) { right_identity++; }
        right_score += options.score.matrix[letter1][letter2];
        right_bit_score = this.raw_score_to_bit_score(right_score, stats);
        if (right_bit_score >= max_right_bit_score) {
          max_right_bit_score = right_bit_score;
          max_right_index.query_index   = query_index;
          max_right_index.subject_index = subject_index;
        } // end if
        query_index++;
        subject_index++;
      } // end while
      if (max_left_index.query_index    < 0) { max_left_index.query_index   = 0; }
      if (max_left_index.subject_index  < 0) { max_left_index.subject_index = 0; }
      if (max_right_index.query_index   >= query.length  ) { max_right_index.query_index   = query.length - 1; }
      if (max_right_index.subject_index >= subject.length) { max_right_index.subject_index = subject.sequence.length - 1; }
      hsp_array[i].query_start    =   max_left_index.query_index;
      hsp_array[i].query_end      =   max_right_index.query_index;
      hsp_array[i].subject_start  =   max_left_index.subject_index;
      hsp_array[i].subject_end    =   max_right_index.subject_index;
      hsp_array[i].query          =   query.substring(hsp_array[i].query_start, hsp_array[i].query_end + 1);
      hsp_array[i].subject        =   subject.sequence.substring(hsp_array[i].subject_start, hsp_array[i].subject_end + 1);
      hsp_array[i].extended       =   true;
      hsp_array[i].changed        =   true;
      // filter non-extended HSPs that are completely overlapped by
      //  this extended HSP
      let neighbor = dist[hsp_array[i].diagonal];
      for (let j = 0; j < neighbor.length; j++) {
        if (!hsp_array[neighbor[j]].extended) {
          if (((hsp_array[neighbor[j]].query_start   >= hsp_array[i].query_start  ) && (hsp_array[neighbor[j]].query_start   <= hsp_array[i].query_end  )) &&
              ((hsp_array[neighbor[j]].subject_start >= hsp_array[i].subject_start) && (hsp_array[neighbor[j]].subject_start <= hsp_array[i].subject_end))) {
            hsp_array[neighbor[j]].keep = false;
          } // end if
        } // end if
      } // end for loop
    } // end if
  } // end for loop
  hsp_array = this.filter_hsp_array(hsp_array);
  ////////////////////////////////////////////////////////////////////////
  // MERGE OVERLAPPING HSPs //////////////////////////////////////////////
  let merged = true;
  while (merged) {
    for (let i = 0; i < hsp_array.length; i++) {
      merged = false;
      if (hsp_array[i].keep) {
        let j = i - 1;
        while (j >= 0) {
          if (hsp_array[j].keep) {
            if (hsp_array[i].diagonal == hsp_array[j].diagonal) {
              ////////////////////////////////////////////////////////////
              // MERGE AND FILTER HSPs ///////////////////////////////////
              if ((hsp_array[i].query_end >= hsp_array[j].query_end) && (hsp_array[i].query_start <= hsp_array[j].query_end)) {
                hsp_array[j].query_end   = hsp_array[i].query_end;
                hsp_array[j].subject_end = hsp_array[i].subject_end;
                if (hsp_array[i].query_start <= hsp_array[j].query_start) {
                  hsp_array[j].query_start   = hsp_array[i].query_start;
                  hsp_array[j].subject_start = hsp_array[i].subject_start;
                } // end if
                hsp_array[j].query   = query.substring(hsp_array[i].query_start, hsp_array[i].query_end);
                hsp_array[j].subject = subject.sequence.substring(hsp_array[i].subject_start, hsp_array[i].subject_end);
                hsp_array[j].changed = true;
                hsp_array[i].keep = false;
                merged = true;
              } // end if
              else if ((hsp_array[i].query_end >= hsp_array[j].query_start) && (hsp_array[i].query_start <= hsp_array[j].query_start)) {
                hsp_array[j].query_start   = hsp_array[i].query_start;
                hsp_array[j].subject_start = hsp_array[i].subject_start;
                if (hsp_array[i].query_end >= hsp_array[j].query_end) {
                  hsp_array[j].query_end   = hsp_array[i].query_end;
                  hsp_array[j].subject_end = hsp_array[i].subject_end;
                } // end if
                hsp_array[j].query   = query.substring(hsp_array[i].query_start, hsp_array[i].query_end);
                hsp_array[j].subject = subject.sequence.substring(hsp_array[i].subject_start, hsp_array[i].subject_end);
                hsp_array[j].changed = true;
                hsp_array[i].keep = false;
                merged = true;
              } // end else if
              else if ((hsp_array[i].query_start >= hsp_array[j].query_start) && (hsp_array[i].query_end <= hsp_array[j].query_end)) {
                hsp_array[i].keep = false;
                merged = true;
              } // end else if
            } // end if
          } // end if
          j--;
        } // end while
      } // end if
    } // end for loop
  } // end while loop
  ////////////////////////////////////////////////////////////////////////
  // CALCULATE THE SCORES AND RETURN THE FUNCTION ////////////////////////
  hsp_array = this.filter_hsp_array(hsp_array);
  hsp_array = this.calculate_hsp_scores(hsp_array, query, subject, options);
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// CATEGORY: SECONDARY SINGLE-THREAD FUNCTIONS ////////////////////////////////
//  (b) secondary supporting functions that provide mathematical, string     //
//    manipulation, and matrix manipulation capabilities.                    //
//===========================================================================//
//  Functions:                                                               //
//      Blast.bit_score_to_raw_score                                         //
//      Blast.calculate_hsp_best_stats                                       //
//      Blast.calculate_hsp_centroids                                        //
//      Blast.calculate_hsp_scores                                           //
//      Blast.calculate_lambda                                               //
//      Blast.calculate_search_space                                         //
//      Blast.complete_options                                               //
//      Blast.copy_attributes                                                //
//      Blast.copy_object                                                    //
//      Blast.create_diagonal_distribution                                   //
//      Blast.create_hsp_report                                              //
//      Blast.create_matrix                                                  //
//      Blast.cull_hsp_array                                                 //
//      Blast.filter_hsp_array                                               //
//      Blast.filter_hsp_array_by_bit_score                                  //
//      Blast.filter_hsp_array_by_characters                                 //
//      Blast.filter_hsp_array_by_expect                                     //
//      Blast.filter_hsp_array_by_nat_score                                  //
//      Blast.filter_hsp_array_by_p_value                                    //
//      Blast.filter_hsp_array_by_score                                      //
//      Blast.flip_string                                                    //
//      Blast.raw_score_to_bit_score                                         //
//      Blast.rescale_matrix                                                 //
//      Blast.Spouge_raw_score_to_expect                                     //
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.bit_score_to_raw_score = function(bit_score, stats) {
  ////////////////////////////////////////////////////////////////////////
  //  Single-thread primary function.                                   //
  //  Returns variables with return statement.                          //
  //====================================================================//
  //  Converts an alignment bit score into a raw score using the        //
  //  following formula:                                                //
  //      raw score = [(bit score * ln(2)) + ln(k)] / lambda            //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(bit_score) === 'undefined') { return 0; }
  if (typeof(stats    ) === 'undefined') { return 0; }
  return ((bit_score * Math.log(2)) + Math.log(stats.k)) / stats.lambda;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.calculate_hsp_best_stats = function(hsp_array) {
  const stats = { };
  stats.best_bit_score = -Infinity;
  stats.best_characters = -Infinity;
  stats.best_expect = Infinity;
  stats.best_nat_score = -Infinity;
  stats.best_p_value = Infinity;
  stats.best_percent_identity = -Infinity;
  stats.best_score = -Infinity;
  stats.number_of_HSPs = hsp_array.length;
  for (let i = 0; i < hsp_array.length; i++) {
    if (hsp_array[i].bit_score > stats.best_bit_score) { stats.best_bit_score = hsp_array[i].bit_score; }
    if (hsp_array[i].characters > stats.best_characters) { stats.best_characters = hsp_array[i].characters; }
    if (hsp_array[i].expect < stats.best_expect && hsp_array[i].expect >= 0) { stats.best_expect = hsp_array[i].expect; }
    if (hsp_array[i].nat_score > stats.best_nat_score) { stats.best_nat_score = hsp_array[i].nat_score; }
    if (hsp_array[i].p_value < stats.best_p_value && hsp_array[i].p_value >= 0) { stats.best_p_value = hsp_array[i].p_value; }
    if (hsp_array[i].percent_identity > stats.best_percent_identity) { stats.best_percent_identity = hsp_array[i].percent_identity; }
    if (hsp_array[i].score > stats.best_score) { stats.best_score = hsp_array[i].score; }
  } // end for loop
  return stats;
} // end function
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.calculate_hsp_centroids = function(hsp_array, options, method) {
  ////////////////////////////////////////////////////////////////////////
  //  Single-thread primary function.                                   //
  //  Returns variables with return statement.                          //
  //====================================================================//
  //  This function calculates the centroid character location for      //
  //  each HSP in the supplied hsp_array argument.  The method used     //
  //  is determined by the "method" argument.  See the comments for     //
  //  each case below for details.                                      //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (typeof(method   ) === 'undefined') { method = 'standard'; }
  if (!Array.isArray(hsp_array)) { return []; }
  options = this.complete_options(options);
  switch(method) {
    case 'standard': {
      ////////////////////////////////////////////////////////////////////
      //  Sets the centroid position to the middle character along the  //
      //  length of each query and subject segments of the HPS (round   //
      //  up if segment consists of an odd number of characters).       //
      ////////////////////////////////////////////////////////////////////
      for (let i = 0; i < hsp_array.length; i++) {
        hsp_array[i].centroid.query   = Math.round(hsp_array[i].characters / 2) + hsp_array[i].query_start;
        hsp_array[i].centroid.subject = Math.round(hsp_array[i].characters / 2) + hsp_array[i].subject_start;
      } // end for loop
      break;
    } // end case
    case 'x-drop': {
      ////////////////////////////////////////////////////////////////////
      //  Sets the centroid position for both the query and subject     //
      //  segments as the center position of the highest-scoring        //
      //  eleven-character-wide sliding window.                         //
      //================================================================//
      //  References:                                                   //
      //  [1] Altschul, S. F., Madden, T. L., Schäffer, A. A., Zhang,   //
      //      J., Zhang, Z., Miller, W., & Lipman, D. J. (1997). Gapped //
      //      BLAST and PSI-BLAST: a new generation of protein database //
      //      search programs. Nucleic acids research, 25(17),          //
      //      3389-3402.                                                //
      //  [2] Zhang, Z., Berman, P., & Miller, W. (1998). Alignments    //
      //      without low-scoring regions. Journal of Computational     //
      //      Biology, 5(2), 197-210.                                   //
      ////////////////////////////////////////////////////////////////////
      let window_length = 11;
      for (let i = 0; i < hsp_array.length; i++) {
        if (hsp_array[i].characters < window_length) {
          hsp_array[i].centroid.query   = Math.round(hsp_array[i].characters / 2) + hsp_array[i].query_start;
          hsp_array[i].centroid.subject = Math.round(hsp_array[i].characters / 2) + hsp_array[i].subject_start;
        } // end if
        else {
          let best_word_score     =   -Infinity;
          let best_query_index    =   0;
          let best_subject_index  =   0;
          let query_index         =   window_length;
          let subject_index       =   window_length;
          while ((query_index < hsp_array[i].query.length) && (subject_index < hsp_array[i].subject.length)) {
            let query_word   =   hsp_array[i].query.substring(query_index   - window_length, query_index  );
            let subject_word = hsp_array[i].subject.substring(subject_index - window_length, subject_index);
            if (/[a-z]/.test(query_word  )) { query_index++;   continue; }
            if (/[a-z]/.test(subject_word)) { subject_index++; continue; }
            let word_score       = 0;
            let previous_letter1 = '';
            let previous_letter2 = '';
            window_length = Math.min(query_word.length, subject_word.length);
            for (let j = 0; j < window_length; j++) {
              let letter1 =   query_word[j];
              let letter2 = subject_word[j];
              if (letter1 === '-') {
                if (previous_letter1 === '-') { word_score -= options.score.gap_extend; }
                else { word_score -= (options.score.gap_open + options.score.gap_extend); }
              } // end if
              else if (letter2 === '-') {
                if (previous_letter2 === '-') { word_score -= (options.score.gap_extend); }
                else { word_score -= (options.score.gap_open + options.score.gap_extend); }
              } // end if
              else { word_score += options.score.matrix[letter1][letter2]; }
              previous_letter1 = letter1;
              previous_letter2 = letter2;
            } // end for loop
            if (word_score > best_word_score) {
              best_word_score     = word_score;
              best_query_index    = Math.round(  query_index - (window_length / 2));
              best_subject_index  = Math.round(subject_index - (window_length / 2));
              if (best_query_index   < 0) { best_query_index   = 0; }
              if (best_subject_index < 0) { best_subject_index = 0; }
            } // end if
            query_index++;
            subject_index++;
          } // end while
          hsp_array[i].centroid.query   = best_query_index   + hsp_array[i].query_start;
          hsp_array[i].centroid.subject = best_subject_index + hsp_array[i].subject_start;
        } // end else
      } // end for loop
      break;
    } // end case
    case 'exonerate': {
      ////////////////////////////////////////////////////////////////////
      //  Sets the centroid position for both the query and subject     //
      //  segments as the position where one-half of the total          //
      //  alignment score is generated by the remaining alignment to    //
      //  either side.                                                  //
      //================================================================//
      //  References:                                                   //
      //    [1] Slater, G. S. C., & Birney, E. (2005). Automated        //
      //      generation of heuristics for biological sequence          //
      //      comparison. BMC bioinformatics, 6(1), 31.                 //
      ////////////////////////////////////////////////////////////////////
      for (let i = 0; i < hsp_array.length; i++) {
        let score = 0;
        let previous_letter1 = '';
        let previous_letter2 = '';
        let mid_score = Math.ceil(hsp_array[i].score / 2);
        let query_index   = 0;
        let subject_index = 0;
        while ((query_index < hsp_array[i].query.length) && (subject_index < hsp_array[i].subject.length) && (score < mid_score)) {
          let letter1 = hsp_array[i].query[query_index];
          let letter2 = hsp_array[i].subject[subject_index];
          if (letter1 === '-') {
            if (previous_letter1 === '-') { score -= options.score.gap_extend; }
            else { score -= (options.score.gap_open + options.score.gap_extend); }
          } // end if
          else if (letter2 === '-') {
            if (previous_letter2 === '-') { score -= (options.score.gap_extend); }
            else { score -= (options.score.gap_open + options.score.gap_extend); }
          } // end if
          else { score += options.score.matrix[letter1][letter2]; }
          query_index++;
          subject_index++;
        } // end while loop
        hsp_array[i].centroid.query   = (query_index   - 1) + hsp_array[i].query_start;
        hsp_array[i].centroid.subject = (subject_index - 1) + hsp_array[i].subject_start;
      } // end for loop
      break;
    } // end case
    default: { break; }
  } // end switch
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.calculate_hsp_scores = function(hsp_array, query, subject, options) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (typeof(query    ) === 'undefined') { return []; }
  if (typeof(subject  ) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  options = this.complete_options(options);
  for (let i = 0; i < hsp_array.length; i++) {
    if (hsp_array[i].keep && hsp_array[i].changed) {
      if (!hsp_array[i].gapped_alignment) { options.score.gapped = false; }
      else { options.score.gapped = true; }
      let stats = this.calculate_search_space(query, subject, options);
      hsp_array[i].score    = 0;
      hsp_array[i].gaps     = 0;
      hsp_array[i].identity = 0;
      if (hsp_array[i].query && hsp_array[i].subject) {
        hsp_array[i].diagonal   = hsp_array[i].query_start - hsp_array[i].subject_start;
        let query_index         =   0;
        let subject_index       =   0;
        let previous_letter1    =   "";
        let previous_letter2    =   "";
        while ((query_index < hsp_array[i].query.length) && (subject_index < hsp_array[i].subject.length)) {
          let letter1 = hsp_array[i].query.charAt(query_index).toUpperCase();
          let letter2 = hsp_array[i].subject.charAt(subject_index).toUpperCase();
          if (letter1 === "-") {
            hsp_array[i].gaps++;
            if (previous_letter1 === "-") { hsp_array[i].score -= options.score.gap_extend; }
            else { hsp_array[i].score -= (options.score.gap_open + options.score.gap_extend); }
          } // end if
          else if (letter2 === "-") {
            if (previous_letter2 === "-") { hsp_array[i].score -= (options.score.gap_extend); }
            else { hsp_array[i].score -= (options.score.gap_open + options.score.gap_extend); }
          } // end if
          else {
            if (letter1 === letter2) { hsp_array[i].identity++; }
            hsp_array[i].score += options.score.matrix[letter1][letter2];
          } // end else
          previous_letter1 = letter1;
          previous_letter2 = letter2;
          query_index++;
          subject_index++;
        } // end while
      } // end if
      hsp_array[i].characters       = hsp_array[i].query.length - hsp_array[i].gaps;
      hsp_array[i].percent_identity = (hsp_array[i].identity / hsp_array[i].characters) * 100;
      hsp_array[i].percent_gaps     = (hsp_array[i].gaps / hsp_array[i].characters) * 100;
      hsp_array[i].nat_score        = (stats.lambda * hsp_array[i].score) - Math.log(stats.k);
      hsp_array[i].bit_score        = hsp_array[i].nat_score / Math.log(2);
      hsp_array[i].expect           = stats.k * stats.m_prime * stats.n_prime * Math.exp(-1 * stats.lambda * hsp_array[i].score);
      hsp_array[i].p_value          = 1 - Math.exp(-1 * hsp_array[i].expect);
      hsp_array[i].changed          = false;
    } // end if
  } // end for loop
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.calculate_lambda = function(matrix, query_freq, subject_freq) {
  let alphabet = [];
  let keys = Object.keys(matrix);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].length === 1) { alphabet.push(keys[i]); }
  } // end for loop
  let lambda = 1.0;
  let lambda_high = 2.0;
  let lambda_low = 0.0;
  while ((lambda_high - lambda_low) > 0.001) {
    let sum = 0;
    for (let j = 0; j < alphabet.length; j++) {
      for (let i = 0; i < alphabet.length; i++) {
        let pi = 0;  let pj = 0;
        if (query_freq[alphabet[i]]  ) { pi = query_freq[alphabet[i]];   }
        if (subject_freq[alphabet[j]]) { pj = subject_freq[alphabet[i]]; }
        sum += pi * pj * Math.exp(lambda * matrix[alphabet[i]][alphabet[j]]);
      } // end for loop
    } // end for loop
    // adjust the best guess at lambda
    if (sum > 1) {
      lambda_high = lambda;
      lambda = (lambda + lambda_low) / 2;
    } // end if
    else {
      lambda_low = lambda;
      lambda = (lambda + lambda_high) / 2;
    } // end else
  } // end while
  return lambda;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.calculate_search_space = function(query, subject, options) {
  if (typeof(query  ) === 'undefined') { return []; }
  if (typeof(subject) === 'undefined') { return []; }
  if (!Array.isArray(subject)) {
    let subject_alt = { sequence: subject };
    subject = [];
    subject.push(subject_alt);
  } // end if
  options = this.complete_options(options);
  var stats;
  if (options.score.gapped) {
    let stats_address = options.score.gap_open.toString() + '-' + options.score.gap_extend.toString();
    stats = options.score.matrix.stats[stats_address];
  } // end if
  else { stats = options.score.matrix.stats.ungapped; }
  stats.m = query.length;
  stats.n = 0;
  if (options.search_space.num_characters) { stats.n = options.search_space.num_characters; }
  else { for (let i = 0; i < subject.length; i++) { stats.n += subject[i].sequence.length; } }
  stats.l = (Math.log(stats.k * stats.m * stats.n)) / stats.h;
  stats.m_prime = Math.round(stats.m - stats.l);
  if (stats.m_prime < (1 / stats.k)) { stats.m_prime = 1 / stats.k; }
  stats.n_prime = 0;
  if (options.search_space.num_sequences) { stats.n_prime = Math.round(stats.n - (stats.l * options.search_space.num_sequences)); }
  else { stats.n_prime = stats.n - (stats.l * subject.length); }
  return stats;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.complete_options = function(options) {
  let base_options      = new Options;
  let level1_options    = new Options;
  options               = Object.assign(base_options,                options             );
  options.score         = Object.assign(level1_options.score,        options.score       );
  options.seed          = Object.assign(level1_options.seed,         options.seed        );
  options.search_space  = Object.assign(level1_options.search_space, options.search_space);
  options.x_drop        = Object.assign(level1_options.x_drop,       options.x_drop      );
  return options;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.copy_attributes = function(new_obj, old_obj) {
  for (var attr in old_obj) { if (old_obj.hasOwnProperty(attr)) { new_obj[attr] = old_obj[attr]; } }
  return new_obj;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.copy_object = function(obj) {
  let new_obj = JSON.parse(JSON.stringify(obj));
  return new_obj;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.create_diagonal_distribution = function(hsp_array) {
  if (typeof(hsp_array) === 'undefined') { return { }; }
  if (!Array.isArray(hsp_array)) { return { }; }
  let diagonal_distribution = { };
  for (let i = 0; i < hsp_array.length; i++) {
    if (!diagonal_distribution[hsp_array[i].diagonal]) { diagonal_distribution[hsp_array[i].diagonal] = []; }
    diagonal_distribution[hsp_array[i].diagonal].push(i);
  } // end for loop
  return diagonal_distribution;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.create_hsp_report = function(hsp_array, query, subject, options) {
  let report = new Report();
  let stats = this.calculate_search_space(query, subject, options);
  ////////////////////////////////////////////////////////////////////////
  // NO HSPs /////////////////////////////////////////////////////////////
  if (!hsp_array.length) { return new Report; }
  ////////////////////////////////////////////////////////////////////////
  // ONE HSP /////////////////////////////////////////////////////////////
  if (hsp_array.length === 1) {
    report.score         = hsp_array[0].score;
    report.nat_score     = hsp_array[0].nat_score;
    report.bit_score     = hsp_array[0].bit_score;
    report.expect        = hsp_array[0].expect;
    report.p_value       = hsp_array[0].p_value;
    report.threshold     = 0.05;
    if (report.p_value < report.threshold) { report.significant = true; }
    report.hsp_gaps         = 0;
    report.query            = query;
    report.subject          = subject.sequence;
    report.identity         = hsp_array[0].identity;
    report.characters       = hsp_array[0].characters;
    report.percent_identity = hsp_array[0].percent_identity;
    report.query_coverage   = (hsp_array[0].characters / query.length) * 100;
    report.query_length     = query.length;
    report.data             = subject;
    let hsp                 = this.copy_attributes(new HSP(), hsp_array[0]);
    report.hsp.push(hsp);
    report.query_domain.end     = hsp_array[0].query_end;
    report.query_domain.start   = hsp_array[0].query_start;
    report.subject_domain.end   = hsp_array[0].subject_end;
    report.subject_domain.start = hsp_array[0].subject_start;
    report.total_hsp_characters = hsp_array[0].characters;
    report.query_domain.length = (report.query_domain.end - report.query_domain.start) + 1;
    report.query_length = query.length;
    report.subject_domain.length = (report.subject_domain.end - report.subject_domain.start) + 1;
    report.hsp_spread_factor = report.subject_domain.length / report.query_domain.length;
  } // end if (ONE HSP)
  ////////////////////////////////////////////////////////////////////////
  // MULTIPLE HSPs ///////////////////////////////////////////////////////
  else if (hsp_array.length > 1) {
    // sort the hsp array by query_start, from lowest to highest
    hsp_array.sort(function(a, b) {
      if (a.query_start < b.query_start) { return -1; }
      if (a.query_start > b.query_start) { return  1; }
      return 0;
    }); // end sort
    // calculate the length of gaps between HSPs
    // and calculate the sum scores
    let beta                    = 0.1;              // gap decay constant
    let g                       = 0;                // the average number of gap_characters between HSPs
    let r                       = hsp_array.length; // the number of HSPs
    let intra_hsp_gaps          = 0;                // the number of gaps between HSPs
    let sum_penalty             = 0;                // the penalty for grouping HSPs
    let sum_p_value             = 0;                // the p-value of the sum score
    let sum_score               = 0;                // the final sum score
    let test_corrected_p_value  = 0;                // the p-value of the sum score corrected for multiple HSP testing
    let total_g                 = 0;                // the absolute number of gap characters between HSPs
    let total_raw_score         = 0;                // raw score
    let total_normalized_score  = 0;                // total_raw_score * lambda
    // set the gap decay constant
    if (!options.score.gapped) { beta = 0.5; }
    // calculate the total raw score and the average gap size
    for (let i = 0; i < hsp_array.length; i++) {
      total_raw_score = total_raw_score + hsp_array[i].score;
      if (i > 0) {
        if (hsp_array[i].query_start > hsp_array[(i - 1)].query_end) {
          total_g = total_g + Math.abs(hsp_array[i].query_start - hsp_array[(i - 1)].query_end);
          intra_hsp_gaps++;
        }
      } // end if
    } // end for loop
    if (intra_hsp_gaps) { g = total_g / intra_hsp_gaps; }
    total_normalized_score = total_raw_score * stats.lambda;
    // set the sum penalty
    if (g) { sum_penalty = Math.log(stats.k * stats.m_prime * stats.n_prime) - ((r - 1) * (Math.log(stats.k) + (2 * Math.log(g)))) - Math.log10(factorial(r)); }
    else { sum_penalty = total_normalized_score - (r * Math.log(stats.k * stats.m_prime * stats.n_prime)) + Math.log(factorial(r)); }
    // Calculate the sum score, sum p-vale, and test corrected p-value.
    // The method for calculating the sum p-value is dependent on whether or
    // not overlap is allowed among the HSPs, and based on formula and
    // suggestions found in the two references listed below.
    // [1] Ewens, W. J., & Grant, G. R. (2001). Statistical methods in
    //  bioinformatics: an introduction. Springer Science & Business Media.
    //  Page: 280.
    // [2] Bedell, J., Korf, I., & Yandell, M. (2003). BLAST: An Essential
    //  Guide to the Basic Local Blast Search Tool. Pages: 69, and 105.
    sum_score = total_normalized_score - sum_penalty;
    if (options.hsp_overlap.on) { sum_p_value = ( Math.exp(-1 * sum_score) * Math.pow(sum_score, (r - 1)) ) / ( factorial(r) * factorial(r - 1) ); }
    else { sum_p_value = ( ( Math.exp(-1 * sum_score) * Math.pow(sum_score, (r - 1)) ) / ( factorial(r) * factorial(r - 1) ) ) / factorial(r); }
    test_corrected_p_value = sum_p_value / ( Math.pow(beta, (r - 1)) * (1 - beta) );
    report.score     = total_raw_score;
    report.nat_score = sum_score;
    report.bit_score = report.nat_score / Math.log(2);
    report.expect    = (stats.n_prime / stats.n ) * test_corrected_p_value;
    report.p_value   = test_corrected_p_value;
    if (report.expect < 0.00) {
      report.expect = Infinity;
      report.p_value = Infinity;
    } // end if
    report.threshold = 0.05;
    if (report.p_value < report.threshold) { report.significant = true; }
    report.hsp_average_gaps     = g;
    report.hsp_gaps             = total_g;
    report.query                = query;
    report.subject              = subject.sequence;
    report.data                 = subject;
    report.identity             = 0;
    report.characters           = 0;
    report.total_hsp_characters = 0;
    for (let i = 0; i < hsp_array.length; i++) {
      let hsp = this.copy_attributes(new HSP(), hsp_array[i]);
      report.hsp.push(hsp);
      report.identity += hsp_array[i].identity;
      if (hsp_array[i].query_end > report.query_domain.end) { report.query_domain.end = hsp_array[i].query_end; }
      if (hsp_array[i].query_start < report.query_domain.start) { report.query_domain.start = hsp_array[i].query_start; }
      if (hsp_array[i].subject_end > report.subject_domain.end) { report.subject_domain.end = hsp_array[i].subject_end; }
      if (hsp_array[i].subject_start < report.subject_domain.start) { report.subject_domain.start = hsp_array[i].subject_start; }
      report.total_hsp_characters += hsp_array[i].characters;
      if (i === 0) { report.characters += hsp_array[i].characters; }
      else {
        if (hsp_array[i].query_start >= hsp_array[(i - 1)].query_end) {
          report.characters += hsp_array[i].characters;
        } // end if
        else {
          let condensed_query = hsp_array[i].query.replace(/-/g, "");
          let delta = hsp_array[(i - 1)].query_end - hsp_array[i].query_start;
          let truncated_query = condensed_query.substring(delta);
          report.characters += truncated_query.length;
        } // end else
      } // ens else
    } // end for loop
    report.percent_identity = (report.identity / report.total_hsp_characters) * 100;
    report.query_coverage = (report.characters / query.length) * 100;
    report.query_domain.length = report.query_domain.end - report.query_domain.start;
    report.query_length = query.length;
    report.subject_domain.length = report.subject_domain.end - report.subject_domain.start;
    report.hsp_spread_factor = report.subject_domain.length / report.query_domain.length;
  } // end else if (MULTIPLE HSPs)
  ////////////////////////////////////////////////////////////////////////
  // add the completed report to the array
  return report;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.create_matrix = function(length) {
  let arr = new Array(length || 0);
  let i = length;
  if (arguments.length > 1) {
    var args = Array.prototype.slice.call(arguments, 1);
    while(i--) arr[length-1 - i] = this.create_matrix.apply(this, args);
  } // end if
  return arr;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.cull_hsp_array = function(hsp_array, options) {
  ////////////////////////////////////////////////////////////////////////
  //  Slightly modified version of the method described in [1].  The    //
  //  modification is based on the assumed method of use with           //
  //  nucleotide sequences where only sections up to 50,000 nucleotides //
  //  long are searched at a time.                                      //
  //  [1] Berman, P., Zhang, Z., Wolf, Y. I., Koonin, E. V., & Miller,  //
  //    W. (2000). Winnowing sequences from a database search. Journal  //
  //    of computational biology: a journal of computational molecular  //
  //    cell biology, 7(1-2), 293.                                      //
  ////////////////////////////////////////////////////////////////////////
  if (options.culling_limit < Infinity && options.culling_limit > 0) {
    for (let i = 0; i < hsp_array.length; i++) {
      let n = 0;
      for (let j = 0; j < hsp_array.length; j++) {
        if (i !== j) {
               if ((hsp_array[i].query_start >   hsp_array[j].query_start) && (hsp_array[i].query_end <   hsp_array[j].query_end)) { n++; }
          else if ((hsp_array[i].query_start === hsp_array[j].query_start) && (hsp_array[i].query_end <   hsp_array[j].query_end)) { n++; }
          else if ((hsp_array[i].query_start >   hsp_array[j].query_start) && (hsp_array[i].query_end === hsp_array[j].query_end)) { n++; }
          else if ((hsp_array[i].query_start === hsp_array[j].query_start) && (hsp_array[i].query_end === hsp_array[j].query_end) && (hsp_array[i].score < hsp_array[j].score)) { n++; }
        } // end if
      } // end for loop j
      if (n >= options.culling_limit) { hsp_array[i].keep = false; }
    } // end for loop i
    hsp_array = this.filter_hsp_array(hsp_array);
  } // end if
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.filter_hsp_array = function(hsp_array) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.filter_hsp_array_by_bit_score = function(hsp_array, threshold) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  delete hsp_array;
  hsp_array = new_hsp_array;
  delete new_hsp_array;
  new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].bit_score >= threshold) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.filter_hsp_array_by_characters = function(hsp_array, threshold) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  delete hsp_array;
  hsp_array = new_hsp_array;
  delete new_hsp_array;
  new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].characters >= threshold) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.filter_hsp_array_by_expect = function(hsp_array, threshold) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  delete hsp_array;
  hsp_array = new_hsp_array;
  delete new_hsp_array;
  new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].expect <= threshold && hsp_array[i].expect >= 0) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.filter_hsp_array_by_nat_score = function(hsp_array, threshold) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  delete hsp_array;
  hsp_array = new_hsp_array;
  delete new_hsp_array;
  new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].nat_score >= threshold) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.filter_hsp_array_by_percent_identity = function(hsp_array, threshold) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  delete hsp_array;
  hsp_array = new_hsp_array;
  delete new_hsp_array;
  new_hsp_array = [];
  threshold = threshold / hsp_array.length;
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].percent_identity >= threshold) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.filter_hsp_array_by_p_value = function(hsp_array, threshold) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  delete hsp_array;
  hsp_array = new_hsp_array;
  delete new_hsp_array;
  new_hsp_array = [];
  threshold = threshold / hsp_array.length;
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].p_value <= threshold && hsp_array[i].p_value >= 0) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.filter_hsp_array_by_score = function(hsp_array, threshold) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  delete hsp_array;
  hsp_array = new_hsp_array;
  delete new_hsp_array;
  new_hsp_array = [];
  threshold = threshold / hsp_array.length;
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].score >= threshold) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.flip_string = function(string) {
  if (typeof(string) === 'undefined') { string = ''; }
  let new_string = '';
  for (let i = (string.length - 1); i >= 0; i--) {
    new_string += string[i];
  } // end for loop
  return new_string;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.raw_score_to_bit_score = function(raw_score, stats) {
  let bit_score = -Infinity;
  if (typeof(raw_score) !== "undefined") {
    if ((raw_score > -Infinity) && (raw_score < Infinity)) {
      bit_score = ((stats.lambda * raw_score) - Math.log(stats.k)) / Math.log(2);
    } // end if
  } // end if
  return bit_score;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.rescale_matrix = function(query, subject, options) {
  options = this.complete_options(options);
  if (typeof(query  ) === 'undefined') { return options.score.matrix; }
  if (typeof(subject) === 'undefined') { return options.score.matrix; }
  let matrix = this.copy_object(options.score.matrix);
  let f = 32; // scaling factor
  let lambda_u = options.score.matrix.stats.ungapped.lambda;
  let Q_freq = { }; // frequency of letters in the query
  let D_freq = { }; // frequency of letters in the subject
  let alphabet = [];
  let keys = Object.keys(matrix);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].length === 1) {
      alphabet.push(keys[i]);
      Q_freq[keys[i]] = 0;
      D_freq[keys[i]] = 0;
    } // end if
  } // end for loop
  // calculate the frequency of the letters in the query
  for (let i = 0; i < query.length; i++) {
    let character = query.charAt(i);
    if (character === character.toUpperCase()) {
      if (!Q_freq[character]) { Q_freq[character] = 0; }
      Q_freq[character]++;
    } // end if
  } // end for loop
  // calculate the frequency of the letters in the subject
  for (let i = 0; i < subject.sequence.length; i++) {
    let character = subject.sequence.charAt(i);
    if (character === character.toUpperCase()) {
      if (!D_freq[character]) { D_freq[character] = 0; }
      D_freq[character]++;
    } // end if
  } // end for loop
  let scaling_factor = f / lambda_u;
  for (let j = 0; j < alphabet.length; j++) {
    for (let i = 0; i < alphabet.length; i++) {
      matrix[alphabet[i]][alphabet[j]] = Math.round(matrix[alphabet[i]][alphabet[j]] * scaling_factor);
    } // end for loop
  } // end for loop
  // calculate lambda prime
  let lambda_u_prime = this.calculate_lambda(matrix, Q_freq, D_freq);
  let r = lambda_u_prime / lambda_u;
  for (let j = 0; j < alphabet.length; j++) {
    for (let i = 0; i < alphabet.length; i++) {
      matrix[alphabet[i]][alphabet[j]] = Math.round((matrix[alphabet[i]][alphabet[j]] * r) / f);
    } // end for loop
  } // end for loop
  matrix.stats.ungapped.lambda = r;
  return matrix;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// CATEGORY: MULTITHREAD FUNCTIONS ////////////////////////////////////////////
//    (3) Functions associated with multithread tasks (and which usually     //
//      consist of series of calls to single-thread tasks.                   //
//===========================================================================//
//  Functions:                                                               //
//      Blast.blast                                                          //
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.blast = function(query, subject, options, workerNumber) {
  ////////////////////////////////////////////////////////////////////////
  //  This is the "seed-extend-evaluate" algorithm used for nucleotide  //
  //  and protein BLAST searches.  The argument "query" should be       //
  //  supplied as a string.  "subject" may be supplied either as a      //
  //  string, or as an array of sequences.  If "subject" is supplied as //
  //  an array, it must be in the following format:                     //
  //      subject = [ { sequence: "string" }, ... ]                     //
  //  Statistics such as "expect" and the associated "p-value" are      //
  // calculated and included in the "report" object returned by this    //
  //  function.                                                         //
  ////////////////////////////////////////////////////////////////////////
  // CHECK ARGUMENTS /////////////////////////////////////////////////////
  if (typeof(query  ) === 'undefined') { return []; }
  if (typeof(subject) === 'undefined') { return []; }
  if (!Array.isArray(subject)) {
    let subject_alt = { sequence: subject };
    subject = [];
    subject.push(subject_alt);
  } // end if
  options = this.complete_options(options);
  if (!options.batch) { options.batch = subject.length || 1; }
  ////////////////////////////////////////////////////////////////////////
  // MULTITHREADING //////////////////////////////////////////////////////
  if (options.multithreading && (subject.length > 1)) {
    for (i = 0; i < subject.length; i++) {
      const new_options = Object.assign({}, options);
      new_options.batch_index = i;
      let job = { status: 'command', command: 'blast', query: query, subject: [subject[i]], options: new_options, workerNumber: workerNumber };
      this.add_job(job);
    } // end for loop
  } // end if
  else {
    if (!options.batch_index) { options.batch_index = 0; }
    //////////////////////////////////////////////////////////////////////
    // SETUP /////////////////////////////////////////////////////////////
    let report_array = [];
    let stats = this.calculate_search_space(query, subject, options);
    //////////////////////////////////////////////////////////////////
    // LOOP THROUGH subject ARRAY (SUBJECT SEQUENCES) ////////////////
    for (index = 0; index < subject.length; index++) {
      subject[index].sequence = subject[index].sequence.toUpperCase();
      ////////////////////////////////////////////////////////////////////
      // SEED WORDS //////////////////////////////////////////////////////
      let hsp_array = this.seed(query, subject[index], options);
      if (!hsp_array.length) {
        report_array.push(new Report(options.batch, options.batch_index));
        continue;
      } // end if
      query = query.toUpperCase();
      ////////////////////////////////////////////////////////////////////
      // RESCALE THE MATRIX //////////////////////////////////////////////
      if (options.score.rescale_matrix) {
        options.score.matrix = this.rescale_matrix(query, subject[index], options);
      } // end if
      ////////////////////////////////////////////////////////////////////
      // EXTEND HSPs /////////////////////////////////////////////////////
      hsp_array = this.extend(hsp_array, query, subject[index], options);
      if (!hsp_array.length) {
        report_array.push(new Report(options.batch, options.batch_index));
        continue;
      } // end if
      ////////////////////////////////////////////////////////////////////
      // EVALUATE HSPs ///////////////////////////////////////////////////
      let reports = this.evaluate(hsp_array, query, subject[index], options);
      if (!reports.length) {
        report_array.push(new Report(options.batch, options.batch_index));
        continue;
      } // end if
      for (i = 0; i < reports.length; i++) {
        reports[i].batch = options.batch;
        reports[i].batch_index = options.batch_index;
        report_array.push(reports[i]);
      } // end for loop
      ////////////////////////////////////////////////////////////////////
    } // end for loop
    //////////////////////////////////////////////////////////////////////
    let result = { status: 'complete', command: 'blast', result: report_array, workerNumber: workerNumber };
    postMessage(result);
  } // end else
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Blast.prototype.Spouge_raw_score_to_expect = function(raw_score, query, subject, options) {
  // Calculates the E-value from the raw score using the method
  //  suggested from Dr. John L. Spouge
  //  https://www.ncbi.nlm.nih.gov/CBBresearch/Spouge/html_ncbi/html/blast/index.html
  const matrix_index = options.score.gap_open.toString() + '-' + options.score.gap_extend.toString();
  let stats = this.calculate_search_space(query, subject, options);
  // initialize the unscalled stats
  let unscaled_stats  = options.score.matrix_unscaled.stats[matrix_index];
  unscaled_stats.G    = options.score.gap_open + options.score.gap_extend;
  unscaled_stats.b    = 2.0 * unscaled_stats.G * (options.score.matrix_unscaled.stats["ungapped"].alpha   - unscaled_stats.alpha);
  unscaled_stats.Beta = 2.0 * unscaled_stats.G * (options.score.matrix_unscaled.stats["ungapped"].alpha_v - unscaled_stats.alpha_v);
  unscaled_stats.Tau  = 2.0 * unscaled_stats.G * (options.score.matrix_unscaled.stats["ungapped"].alpha_v - unscaled_stats.sigma);
  let scale_factor = stats.lambda / unscaled_stats.lambda;
  // the pair-wise e-value must be scaled back to db-wise e-value
  let db_scale_factor = stats.n ? stats.n/stats.n_prime : 1.0;
  // set up the initial variables
  let lambda_     = stats.lambda;
  let k_          = stats.k;
  let ai_hat_     = unscaled_stats.alpha * scale_factor;
  let bi_hat_     = unscaled_stats.b;
  let alphai_hat_ = unscaled_stats.alpha_v * scale_factor;
  let betai_hat_  = unscaled_stats.Beta;
  let sigma_hat_  = unscaled_stats.sigma * scale_factor;
  let tau_hat_    = unscaled_stats.Tau;
  let aj_hat_     = ai_hat_;
  let bj_hat_     = bi_hat_;
  let alphaj_hat_ = alphai_hat_;
  let betaj_hat_  = betai_hat_;
  // this is 1/sqrt(2.0*PI)
  const const_val = 0.39894228040143267793994605993438;
  // uninitialized variables
  var m_li_y, vi_y, sqrt_vi_y, m_F, P_m_F;
  var n_lj_y, vj_y, sqrt_vj_y, n_F, P_n_F;
  var c_y, p1, p2, area;
  var e_value;
  // do the maths
  m_li_y = m_ - (ai_hat_*y_ + bi_hat_);
  vi_y = Math.max(2.0*alphai_hat_/lambda_, alphai_hat_*y_+betai_hat_);
  sqrt_vi_y = Math.sqrt(vi_y);
  m_F = m_li_y/sqrt_vi_y;
  P_m_F = erfc(-m_F / Math.sqrt(2.0)) / 2.0;
  p1 = m_li_y * P_m_F + sqrt_vi_y * const_val * Math.exp(-0.5*m_F*m_F);
  n_lj_y = n_ - (aj_hat_*y_ + bj_hat_);
  vj_y = Math.max(2.0*alphaj_hat_/lambda_, alphaj_hat_*y_+betaj_hat_);
  sqrt_vj_y = Math.sqrt(vj_y);
  n_F = n_lj_y/sqrt_vj_y;
  P_n_F = erfc(-n_F / Math.sqrt(2.0)) / 2.0;
  p2 = n_lj_y * P_n_F + sqrt_vj_y * const_val * Math.exp(-0.5*n_F*n_F);
  c_y = Math.max(2.0*sigma_hat_/lambda_, sigma_hat_*y_+tau_hat_);
  area = p1 * p2 + c_y * P_m_F * P_n_F;
  e_value = area * k_ * Math.exp(-lambda_ * y_) * db_scale_factor;
  if (e_value < 0.0) { e_value = -Infinity; }
  return e_value;
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  function erfc(x) {
    // https://stackoverflow.com/a/14873282
    // save the sign of x
    var sign = (x >= 0) ? 1 : -1;
    x = Math.abs(x);
    // constants
    var a1 =  0.254829592;
    var a2 = -0.284496736;
    var a3 =  1.421413741;
    var a4 = -1.453152027;
    var a5 =  1.061405429;
    var p  =  0.3275911;
    // A&S formula 7.1.26
    var t = 1.0/(1.0 + p*x);
    var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 1 - (sign * y); // erf(-x) = -erf(x);
  } // end method
  ////////////////////////////////////////////////////////////////////////
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
