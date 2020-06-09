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
function Report(batch) {
  if (typeof(batch) === 'undefined') { batch = 1; }
  this.batch            = batch;
  this.bit_score        = 0.0;
  this.characters       = 0;
  this.data             = undefined;
  this.expect           = 10.0;
  this.hsp              = [];
  this.hsp_gaps         = 0;
  this.identity         = 0;
  this.linked_hsp       = [];
  this.nat_score        = 0.0;
  this.p_value          = 1.0;
  this.percent_identity = 0.0;
  this.query            = "";
  this.query_coverage   = 0;
  this.query_length     = 0;
  this.score            = 0;
  this.significant      = false;
  this.subject          = "";
  this.threshold        = 0.05;
} // end function
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function Options() {
  this.score        = { };
  this.search_space = { };
  this.seed         = { };
  this.x_drop       = { };
  //  Option                          Value        NCBI command-line equivalent
  //===========================================================================
  this.afss                         = "standard";
  this.batch                        = 0;
  this.evaluation_method            = "standard";
  this.expect_threshold_1           = 10.0;     //  -e  (NCBI BLAST)
  this.expect_threshold_2           = 0.001;    //  -e  (NCBI BLAST)
  this.multithreading               = true;     //
  this.score.gap_extend             = 1;        //  -E  (NCBI BLAST)
  this.score.gap_open               = 11;       //  -G  (NCBI BLAST)
  this.score.gapped                 = false;    //  -g  (NCBI BLAST)
  this.score.matrix                 = BLOSUM62; //  -M  (NCBI BLAST)
  this.score.rescale_matrix         = false;    //
  this.search_space.num_characters  = 0;        //
  this.search_space.num_sequences   = 0;        //
  this.seed.exact_match             = false;    //
  this.seed.filter_low_complexity   = true;     //  -F  (NCBI BLAST)
  this.seed.max_number              = 10000;    //
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
var bioAlignment = new Alignment();
///////////////////////////////////////////////////////////////////////////////
// CATEGORY: MANAGEMENT OF MULTITHREADING /////////////////////////////////////
//    (1) Objects and functions associated with the management of            //
//      multithreading.  These include the onmessage function, and the       //
//      Alignment constructor along with its two primary methods add_job and //
//      create_worker.                                                       //
//===========================================================================//
//  Functions:                                                               //
//      onmessage                                                            //
//      Alignment (object constructor)                                       //
//      Alignment.add_job                                                    //
//      Alignment.create_worker                                              //
//      Alignment.create_workerPool                                          //
///////////////////////////////////////////////////////////////////////////////
// WORKER /////////////////////////////////////////////////////////////////////
onmessage = function(e) {
  var job = e.data || { };
  switch(job.command) {
    case "alignment_free_sequence_selection": {
      bioAlignment.alignment_free_sequence_selection(job.query, job.db_source, job.db_index, job.options);
      break;
    } // end case
    case "blast": {
      bioAlignment.blast(job.query, job.subject, job.options, job.workerNumber);
      break;
    } // end case
    default: { break; }
  } // end switch
} // end onmessage
///////////////////////////////////////////////////////////////////////////////
// ALIGNMENT OBJECT ///////////////////////////////////////////////////////////
function Alignment() {
  this.jobPool = [];
  this.workerPool = [];
  this.maxWorkers = navigator.hardwareConcurrency || 4;
  this.batch = { blast: [] };
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
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
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.create_worker = function() {
    let newWorker = new Worker('alignment.js?version=' + guid());
    //////////////////////////////////////////////////////////////////
    // ON MESSAGE ////////////////////////////////////////////////////
    newWorker.onmessage = function(e) {
      switch(e.data.status) {
        case 'complete': {
          switch(e.data.command) {
            case "alignment_free_sequence_selection": {
              const result = { status: "complete", command: "alignment_free_sequence_selection", result: e.data.result.subject };
              postMessage(result);
              break;
            } // end case
            case "blast": {
              for (let i = 0; i < e.data.result.length; i++) {
                this.batch.blast.push(e.data.result[i]);
              } // end if
              if (this.batch.blast.length >= e.data.result[0].batch) {
                let result = { status: "complete", command: "blast", result: this.batch.blast };
                postMessage(result);
                delete this.batch.blast;
                this.batch.blast = [];
              } // end if
              else {
                postMessage({ status: "progress", command: "blast", number: this.batch.blast.length, out_of: e.data.result[0].batch });
              } // end else
              if (e.data.workerNumber !== "undefined") {
                this.workerPool[e.data.workerNumber].inUse = false;
                this.add_job();
              } // end if
              break;
            } // end case
            default: { break; }
          } // end switch
        } // end case
        default: { break; }
      } // end switch
    }.bind(this); // end function
    //////////////////////////////////////////////////////////////////
    let obj = { };
    obj.worker = newWorker;
    obj.inUse = false;
    return obj;
  } // end method
  //////////////////////////////////////////////////////////////////////
  // METHOD ////////////////////////////////////////////////////////////
  this.create_workerPool = function() {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.workerPool.push(this.create_worker());
    } // end if
  } // end method
  //////////////////////////////////////////////////////////////////////
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
//          Alignment.alignment_free_sequence_selection                      //
//          Alignment.extend                                                 //
//          Alignment.global                                                 //
//          Alignment.link_HSPs                                              //
//          Alignment.seed                                                   //
//          Alignment.two_hit                                                //
//          Alignment.x_drop_extend                                          //
//      (b) Secondary single-thread functions:                               //
//          Alignment.bit_score_to_raw_score                                 //
//          Alignment.calculate_lambda                                       //
//          Alignment.calculate_hsp_best_stats                               //
//          Alignment.calculate_hsp_centroids                                //
//          Alignment.calculate_hsp_scores                                   //
//          Alignment.calculate_search_space                                 //
//          Alignment.complete_options                                       //
//          Alignment.copy_attributes                                        //
//          Alignment.copy_object                                            //
//          Alignment.create_diagonal_distribution                           //
//          Alignment.create_hsp_report                                      //
//          Alignment.create_matrix                                          //
//          Alignment.filter_hsp_array                                       //
//          Alignment.filter_hsp_array_by_bit_score                          //
//          Alignment.filter_hsp_array_by_expect                             //
//          Alignment.filter_hsp_array_by_p_value                            //
//          Alignment.flip_string                                            //
//          Alignment.rescale_matrix                                         //
///////////////////////////////////////////////////////////////////////////////
// CATEGORY: PRIMARY SINGLE-THREAD FUNCTIONS //////////////////////////////////
//  (a) primary functions associated with the analysis of protein or         //
//    nucleotide sequences.                                                  //
//===========================================================================//
//  Functions:                                                               //
//      Alignment.alignment_free_sequence_selection                          //
//      Alignment.extend                                                     //
//      Alignment.global                                                     //
//      Alignment.link_HSPs                                                  //
//      Alignment.seed                                                       //
//      Alignment.two_hit                                                    //
//      Alignment.x_drop_extend                                              //
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.alignment_free_sequence_selection = function(query, db_source, db_index, options) {
  if (typeof(query    ) === 'undefined') { return []; }
  if (typeof(db_source) === 'undefined') { return []; }
  if (typeof(db_index ) === 'undefined') { return []; }
  options = this.complete_options(options);
  let kmer_size = 4;
  let num_kmers = 0;
  let reverse   = false;
  const subject = [];
  if (options.score.matrix["type"] === "nucleotides") { kmer_size = 8; }
  const source = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
  const index  = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
  let job = { command: 'connect', database: db_source.database, table: db_source.table };
  source.postMessage(job);
  ////////////////////////////////////////////////////////////////////////
  // INDEX DATABASE MESSAGES /////////////////////////////////////////////
  index.onmessage = function(e) {
    switch(e.data.status) {
      case 'complete': {
        switch(e.data.command) {
          case 'connect': {
            const job = { command: 'select', where: [] };
            const kmer_list = [];
            query = query.toUpperCase();
            let query_word_index = kmer_size;
            while (query_word_index <= query.length) {
              let kmer = query.substring(query_word_index - kmer_size, query_word_index);
              kmer_list.push({ kmer: kmer, number: 1});
              query_word_index++;
            } // end while
            for (let i = 0; i < kmer_list.length; i++) {
              for (let j = 0; j < kmer_list.length; j++) {
                if (i !== j) {
                  if (kmer_list[i].kmer === kmer_list[j].kmer) { kmer_list[i].number++; }
                } // end if
              } // end for loop
            } // end for loop
            for (let i = 0; i < kmer_list.length; i++) {
              job.where.push({ key: "kmer", value: kmer_list[i].kmer });
            } // end if
            num_kmers = job.where.length;
            console.log(job);
            index.postMessage(job);
            break;
          } // end case
          case "select": {
            const map = [];
            const preMap = { };
            const record = e.data.record;
              for (let i = 0; i < record.length; i++) {
                let locations = record[i].sequences.split(",");
                for (let j = 0; j < locations.length; j++) {
                  if (locations[j] !== "") {
                    if (!preMap[locations[j]]) { preMap[locations[j]] = 0; }
                    preMap[locations[j]]++;
                  } // end if
                  else { num_kmers--; }
                } // end for loop
              } // end for loop
              const IDs = [];
              let job = { command: 'select', where: [] };
              const keys = Object.keys(preMap);
              for (let i = 0; i < keys.length; i++) { map.push({ id: keys[i], number: preMap[keys[i]] }); }
              map.sort(function(a, b) {
                if (a.number > b.number) { return -1; }
                if (a.number < b.number) { return  1; }
                return 0;
              });
              console.log(map[0]);
              switch(options.afss) {
                case "standard": {
                  let threshold = 500;
                  if (threshold > map.length) { threshold = map.length; }
                  for (let i = 0; i < threshold; i++) {
                    job.where.push({ key: "id", value: map[i].id });
                  } // end for loop
                } // end case
                default: { break; }
              } // end switch
              source.postMessage(job);
            break;
          } // end case
          default: { break; }
        } // end switch
        break;
      } // end case
      default: { break; }
    } // end switch
  } // end function
  ////////////////////////////////////////////////////////////////////////
  // SOURCE DATABASE MESSAGES ////////////////////////////////////////////
  source.onmessage = function(e) {
    switch(e.data.status) {
      case 'complete': {
        switch(e.data.command) {
          case 'connect': {
            let job = { command: 'connect', database: db_index.database, table: db_index.table };
            index.postMessage(job);
            break;
          } // end case
          case "select": {
            console.log(e.data);
            break;
          } // end case
          default: { break; }
        } // end switch
        break;
      } // end case
      default: { break; }
    } // end switch
  } // end function
  ////////////////////////////////////////////////////////////////////////
  /* Don't forget to put these at the end
  source.terminate();
  index.terminate();
  */
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.evaluate = function(hsp_array, query, subject, options) {
  ////////////////////////////////////////////////////////////////////////
  //  Single-thread primary function.                                   //
  //  Returns variables with return statement.                          //
  //====================================================================//
  //  This function examines the individual HSPs within an HSP array,   //
  //  and returns one or more sets of consistent HSPs.  Multiple        //
  //  strategies are available, and selected through the                //
  //  options.evaluation_method.                                        //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(hsp_array) === 'undefined') { return new Report; }
  if (typeof(query    ) === 'undefined') { return new Report; }
  if (typeof(subject  ) === 'undefined') { return new Report; }
  if ( Array.isArray(subject  )) { return new Report; }
  if (!Array.isArray(hsp_array)) { return new Report; }
  options = this.complete_options(options);
  switch(options.evaluation_method) {
    case 'standard': {
      ////////////////////////////////////////////////////////////////////
      // SORT HSPs BY EXPECT, FROM HIGH TO LOW ///////////////////////////
      hsp_array.sort(function(a, b) {
        if (a.keep && b.keep) {
          if (a.expect < b.expect) { return -1; }
          if (a.expect > b.expect) { return  1; }
        } // end if
        return 0;
      }); // end sort
      ////////////////////////////////////////////////////////////////////
      for (let i = 1; i < hsp_array.length; i++) {
        if (hsp_array[i].keep) {
          let j = i - 1;
          while (j >= 0) {
            if (hsp_array[j].keep) {
              ////////////////////////////////////////////////////////////
              // FILTER OVERLAPPING HSPs /////////////////////////////////
              if ((hsp_array[i].query_end >= hsp_array[j].query_end) && (hsp_array[i].query_start <= hsp_array[j].query_end)) {
                hsp_array[i].keep = false;
              } // end if
              else if ((hsp_array[i].query_end >= hsp_array[j].query_start) && (hsp_array[i].query_start <= hsp_array[j].query_start)) {
                hsp_array[i].keep = false;
              } // end else if
              else if ((hsp_array[i].query_start >= hsp_array[j].query_start) && (hsp_array[i].query_end <= hsp_array[j].query_end)) {
                hsp_array[i].keep = false;
              } // end else if
              ////////////////////////////////////////////////////////////
              // FILTER UNORDERED HSPs ///////////////////////////////////
              else if (((hsp_array[i].query_start <= hsp_array[j].query_start) && (hsp_array[i].subject_start >= hsp_array[j].subject_start)) ||
                       ((hsp_array[i].query_start >= hsp_array[j].query_start) && (hsp_array[i].subject_start <= hsp_array[j].subject_start))) {
                hsp_array[i].keep = false;
              } // end else if
              ////////////////////////////////////////////////////////////
            } // end if
            j--;
          } // end while
        } // end if
      } // end for loop
      hsp_array = this.filter_hsp_array(hsp_array);
      break;
    } // end case
    case 'genblasta': {
      ////////////////////////////////////////////////////////////////////
      //  Uses the GenBlastA algorithm to evaluate HSPs.                //
      //================================================================//
      //  Reference:                                                    //
      //    [1] She, R., Chu, J. S. C., Wang, K., Pei, J., & Chen, N.   //
      //      (2009). GenBlastA: enabling BLAST to identify homologous  //
      //      gene sequences. Genome research, 19(1), 143-149.          //
      ////////////////////////////////////////////////////////////////////
      function HSP_NODE() {
        this.edge               = { };
        this.edge.incoming      = [];
        this.edge.outgoing      = [];
        this.subject            = { };
        this.subject.adjacent   = [];
        this.subject.after      = [];
        this.subject.before     = [];
        this.subject.overlap    = [];
        this.subject.later_than = [];
        this.query              = { };
        this.query.adjacent     = [];
        this.query.after        = [];
        this.query.before       = [];
        this.query.later_than   = [];
        this.query.overlap      = [];
        this.weight             = 0;
      } // end function
      function HSP_EDGE() {
        this.penalty            = 0;
        this.penalty_ext        = 0;
        this.penalty_sep_after  = 0;
        this.penalty_sep_before = 0;
        this.penalty_skip       = 0;
        this.reward             = 0;
        this.subtype            = undefined;
        this.target             = undefined;
        this.type               = undefined;
      } // end function
      function HSP_PATH() {
        this.indices            = [];
        this.path_length        = 0;
      } // end function
      ////////////////////////////////////////////////////////////////////
      // METHOD //////////////////////////////////////////////////////////
      function minimum_path_length(hsp_array, start_index, end_index, current_index, current_level) {
        if (typeof(current_index) === 'undefined') { current_index = start_index; }
        if (typeof(current_level) === 'undefined') { current_level = 0; }
        current_level++;
        if (current_index === end_index) { return current_level; }
        else if (!hsp_array[current_index].graph.edge.outgoing.length) { return 0; }
        let path_length = 0;
        for (n = 0; n < hsp_array[current_index].graph.edge.outgoing.length; n++) {
          let next_edge = hsp_array[current_index].graph.edge.outgoing[n];
          if ((next_edge.type === 'adjacent') && (next_edge.subtype === 'extension')) {
            let new_path = minimum_path_length(hsp_array, start_index, end_index, next_edge.target, current_level);
            if (new_path) {
              if ((!path_length) || (new_path < path_length)) { path_length = new_path; }
            } // end if
          } // end if
        } // end for loop (n)
        return path_length;
      } // end function
      ////////////////////////////////////////////////////////////////////
      // METHOD //////////////////////////////////////////////////////////
      function minimum_path_weight(hsp_array, start_index, end_index, current_index, current_weight) {
        if (typeof(current_index ) === 'undefined') { current_index = start_index; }
        if (typeof(current_weight) === 'undefined') { current_weight = 0; }
        current_weight = current_weight + hsp_array[current_index].graph.weight;
        if (current_index === end_index) { return current_weight; }
        else if (!hsp_array[current_index].graph.edge.outgoing.length) { return 0; }
        let path_weight = 0;
        for (n = 0; n < hsp_array[current_index].graph.edge.outgoing.length; n++) {
          let next_edge = hsp_array[current_index].graph.edge.outgoing[n];
          if ((next_edge.type === 'adjacent') && (next_edge.subtype === 'extension')) {
            let new_weight = minimum_path_weight(hsp_array, start_index, end_index, next_edge.target, current_weight);
            if (new_weight) {
              if ((!path_weight) || (new_weight < path_weight)) { path_weight = new_weight; }
            } // end if
          } // end if
        } // end for loop (n)
        return path_weight;
      } // end function
      ////////////////////////////////////////////////////////////////////
      // METHOD //////////////////////////////////////////////////////////
      function find_all_paths(hsp_array, start_index, current_index, current_path, all_paths, penalty, reward) {
        if (typeof(current_index) === 'undefined') { current_index = start_index; }
        if (typeof(current_path ) === 'undefined') { current_path = new HSP_PATH(); }
        if (typeof(all_paths    ) === 'undefined') { all_paths    = []; }
        if (typeof(penalty      ) === 'undefined') { penalty      = 0; }
        if (typeof(reward       ) === 'undefined') { reward       = 0; }
        let first_separating = true;
        current_path.indices.push(current_index);
        current_path.path_length += penalty - reward;
        reward = hsp_array[current_index].graph.weight;
        if (!hsp_array[current_index].graph.edge.outgoing.length) {
          current_path.path_length += 0 - reward;
          all_paths.push(current_path);
          return all_paths;
        } // end if
        for (n = 0; n < hsp_array[current_index].graph.edge.outgoing.length; n++) {
          let next_edge = hsp_array[current_index].graph.edge.outgoing[n];
          if (next_edge.subtype === 'separating') {
            if (first_separating) {
              penalty = (0.5 * (next_edge.penalty_ext + next_edge.penalty_sep_after)) + (0.5 * next_edge.penalty_skip);
              current_path.path_length += penalty - reward;
              all_paths.push(current_path); first_separating = false;
            } // end if
            penalty = (0.5 * (next_edge.penalty_ext + next_edge.penalty_sep_before)) + (0.5 * next_edge.penalty_skip);
            all_paths = find_all_paths(hsp_array, start_index, next_edge.target, undefined, all_paths, penalty, reward);
          } // end if
          else {
            penalty = (0.5 * (next_edge.penalty_ext + next_edge.penalty_sep_before)) + (0.5 * next_edge.penalty_skip);
            all_paths = find_all_paths(hsp_array, start_index, next_edge.target, current_path, all_paths, penalty, reward);
          } // end else
        } // end for loop (n)
        return all_paths;
      } // end function
      ////////////////////////////////////////////////////////////////////
      // SORT HSPs BY EXPECT, FROM HIGH TO LOW ///////////////////////////
      hsp_array.sort(function(a, b) {
        if (a.keep && b.keep) {
          if (a.expect < b.expect) { return -1; }
          if (a.expect > b.expect) { return  1; }
        } // end if
        return 0;
      }); // end sort
      ////////////////////////////////////////////////////////////////////
      // IDENTIFY RELATIVE POSITIONS /////////////////////////////////////
      for (let m = 0; m < hsp_array.length; m++) {
        if (hsp_array[m].keep) {
          hsp_array[m].graph = new HSP_NODE();
          hsp_array[m].graph.weight = hsp_array[m].identity;
          for (let n = 0; n < hsp_array.length; n++) {
            if ((!hsp_array[n].keep) || (m === n)) { continue; }
            else {
              // categorize HSP based on query
              if (hsp_array[n].query_start > hsp_array[m].query_start) {
                hsp_array[m].graph.query.later_than.push(n);
                if (hsp_array[n].query_start > hsp_array[m].query_end) {
                  hsp_array[m].graph.query.after.push(n);
                } // end if
                else {
                  hsp_array[m].graph.query.overlap.push(n);
                  hsp_array[m].graph.query.adjacent.push(n);
                } // end else
              } // end if
              if (hsp_array[n].query_end < hsp_array[m].query_start) {
                hsp_array[m].graph.query.before.push(n);
              } // end if
              // categorize HSP based on subject
              if (hsp_array[n].subject_start > hsp_array[m].subject_start) {
                hsp_array[m].graph.subject.later_than.push(n);
                if (hsp_array[n].subject_start > hsp_array[m].subject_end) {
                  hsp_array[m].graph.subject.after.push(n);
                } // end if
                else {
                  hsp_array[m].graph.subject.overlap.push(n);
                  hsp_array[m].graph.subject.adjacent.push(n);
                } // end else
              } // end if
              if (hsp_array[n].subject_end < hsp_array[m].subject_start) {
                hsp_array[m].graph.subject.before.push(n);
              } // end if
            } // end else
          } // end for loop (n)
        } // end if (hsp_array[m].keep)
      } // end for loop (m)
      ////////////////////////////////////////////////////////////////////
      // IDENTIFY ADDITIONAL ADJACENT HSPs ///////////////////////////////
      for (let m = 0; m < hsp_array.length; m++) {
        if (hsp_array[m].keep) {
          // find the adjacent query node that is after the query
          let trial_adjacent_index = undefined;
          for (let n = 0; n < hsp_array[m].graph.query.after.length; n++) {
            let trial_index = hsp_array[m].graph.query.after[n];
            if (trial_index === m) { continue; }
            let trial_node  = hsp_array[hsp_array[m].graph.query.after[n]];
            if (typeof(trial_adjacent_index) === 'undefined') { trial_adjacent_index = trial_index; }
            else {
              if ((trial_node.graph.query.before.indexOf(m) > -1) && (trial_node.graph.query.after.indexOf(trial_adjacent_index) > -1)) {
                trial_adjacent_index = trial_index;
              } // end if
            } // end else
          } // end for loop (n)
          if (typeof(trial_adjacent_index) != 'undefined') { hsp_array[m].graph.query.adjacent.push(trial_adjacent_index); }
          // find the adjacent subject node that is after the subject
          trial_adjacent_index = undefined;
          for (let n = 0; n < hsp_array[m].graph.subject.after.length; n++) {
            let trial_index = hsp_array[m].graph.subject.after[n];
            if (trial_index === m) { continue; }
            let trial_node  = hsp_array[hsp_array[m].graph.subject.after[n]];
            if (typeof(trial_adjacent_index) === 'undefined') { trial_adjacent_index = trial_index; }
            else {
              if ((trial_node.graph.subject.before.indexOf(m) > -1) && (trial_node.graph.subject.after.indexOf(trial_adjacent_index) > -1)) {
                trial_adjacent_index = trial_index;
              } // end if
            } // end else
          } // end for loop (n)
          if (typeof(trial_adjacent_index) != 'undefined') { hsp_array[m].graph.subject.adjacent.push(trial_adjacent_index); }
        } // end if (hsp_array[m].keep)
      } // end for loop (m)
      ////////////////////////////////////////////////////////////////////
      // CREATE ADJACENT EDGES ///////////////////////////////////////////
      for (let m = 0; m < hsp_array.length; m++) {
        if (hsp_array[m].keep) {
          for (let n = 0; n < hsp_array.length; n++) {
            if ((!hsp_array[n].keep) || (m === n)) { continue; }
            if (hsp_array[m].graph.subject.later_than.indexOf(n) > -1) {
              let edge_type = 'skip';
              let edge_subtype = 'separating';
              if (hsp_array[m].graph.subject.adjacent.indexOf(n) > -1) { edge_type = 'adjacent'; }
              if (hsp_array[m].graph.subject.overlap.indexOf(n) > -1) {
                if (hsp_array[m].graph.query.adjacent.indexOf(n) > -1) { edge_subtype = 'extension'; }
              } // end if
              else {
                if (hsp_array[m].graph.query.later_than.indexOf(n) > -1) { edge_subtype = 'extension'; }
              } // end else
              if (edge_type === 'adjacent') {
                let outgoing_edge = new HSP_EDGE();
                let incoming_edge = new HSP_EDGE();
                outgoing_edge.target  = n;
                incoming_edge.target  = m;
                outgoing_edge.type    = edge_type;
                incoming_edge.type    = edge_type;
                outgoing_edge.subtype = edge_subtype;
                incoming_edge.subtype = edge_subtype;
                hsp_array[m].graph.edge.outgoing.push(outgoing_edge);
                hsp_array[n].graph.edge.incoming.push(incoming_edge);
              } // end if
            } // end if
          } // end for loop
        } // end if (hsp_array[m].keep)
      } // end for loop (m)
      ////////////////////////////////////////////////////////////////////
      // CREATE SKIP EDGES ///////////////////////////////////////////////
      for (let m = 0; m < hsp_array.length; m++) {
        if (hsp_array[m].keep) {
          for (let n = 0; n < hsp_array.length; n++) {
            if ((!hsp_array[n].keep) || (m === n)) { continue; }
            if (hsp_array[m].graph.subject.later_than.indexOf(n) > -1) {
              let edge_exists = false;
              for (let j = 0; j < hsp_array[m].graph.edge.outgoing.length; j++) {
                if (hsp_array[m].graph.edge.outgoing[j].target === n) { edge_exists = true; }
              } // end for loop (j)
              if (!edge_exists) {
                if (minimum_path_length(hsp_array, m, n) > 3) {
                  let edge_type = 'skip';
                  let edge_subtype = 'separating';
                  if (hsp_array[m].graph.subject.overlap.indexOf(n) > -1) {
                    if (hsp_array[m].graph.query.adjacent.indexOf(n) > -1) { edge_subtype = 'extension'; }
                  } // end if
                  else {
                    if (hsp_array[m].graph.query.later_than.indexOf(n) > -1) { edge_subtype = 'extension'; }
                  } // end else
                  if (edge_subtype === 'extension') {
                    let outgoing_edge = new HSP_EDGE();
                    let incoming_edge = new HSP_EDGE();
                    outgoing_edge.target  = n;
                    incoming_edge.target  = m;
                    outgoing_edge.type    = edge_type;
                    incoming_edge.type    = edge_type;
                    outgoing_edge.subtype = edge_subtype;
                    incoming_edge.subtype = edge_subtype;
                    hsp_array[m].graph.edge.outgoing.push(outgoing_edge);
                    hsp_array[n].graph.edge.incoming.push(incoming_edge);
                  } // end if
                } // end if (minimum_path_length > 3)
              } // end if (!edge_exists)
            } // end if (hsp_array[m].graph.subject.later_than.indexOf(n) > -1)
          } // end for loop (n)
        } // end if (hsp_array[m].keep)
      } // end for loop (m)
      ////////////////////////////////////////////////////////////////////
      // ESTABLISH THE SIGMA NODE ////////////////////////////////////////
      let sigma = [];
      for (let m = 0; m < hsp_array.length; m++) {
        if (hsp_array[m].keep) {
          if (hsp_array[m].graph.edge.incoming.length === 0) { sigma.push(m); }
        } // end if (hsp_array[m].keep)
      } // end for loop (m)
      ////////////////////////////////////////////////////////////////////
      // CALCULATE EDGE SCORES ///////////////////////////////////////////
      for (let m = 0; m < hsp_array.length; m++) {
        if (hsp_array[m].keep) {
          for (let n = 0; n < hsp_array[m].graph.edge.outgoing.length; n++) {
            let edge = hsp_array[m].graph.edge.outgoing[n];
            // calculate the adjacent extension penalty
            if ((edge.type === 'adjacent') && (edge.subtype == 'extension')) {
              let skip_start = hsp_array[m].query_end;
              let skip_end = hsp_array[edge.target].query_start;
              //  Find all nodes that overlap the skipped
              //  query segment and average their percent
              //  ID's.
              let num_PIDs    = 0;
              let total_PID   = 0;
              let average_PID = 0;
              for (let j = 0; j < hsp_array.length; j++) {
                if (!hsp_array[j].keep || (m === j) || (edge.target === j)) { continue; }
                if (((hsp_array[j].query_end   >= skip_end  ) && (hsp_array[j].query_start <= skip_end  )) ||
                    ((hsp_array[j].query_end   >= skip_start) && (hsp_array[j].query_start <= skip_start)) ||
                    ((hsp_array[j].query_start >= skip_start) && (hsp_array[j].query_end   <= skip_end  ))) {
                  num_PIDs++;
                  total_PID += hsp_array[j].percent_identity;
                } // end else if
              } // end for loop
              if (num_PIDs) { average_PID = total_PID / num_PIDs; }
              hsp_array[m].graph.edge.outgoing[n].penalty_ext = average_PID * (skip_end - skip_start);
            } // end if
            // calculate the separating penalty
            if ((edge.type === 'adjacent') && (edge.subtype == 'separating')) {
              let before_total = 0;
              let after_total  = 0;
              for (let j = 0; j < hsp_array.length; j++) {
                if (!hsp_array[j].keep) { continue; }
                if (hsp_array[j].query_end   < hsp_array[edge.target].query_start) { before_total += hsp_array[j].weight; }
                if (hsp_array[j].query_start < hsp_array[m].query_start) { after_total += hsp_array[j].weight; }
              } // end for loop
              hsp_array[m].graph.edge.outgoing[n].penalty_sep_before = before_total;
              hsp_array[m].graph.edge.outgoing[n].penalty_sep_after  = after_total;
            } // end if
            // calculate the skip penalty
            if ((edge.type === 'skip') && (edge.subtype == 'extension')) {
              hsp_array[m].graph.edge.outgoing[n].penalty_skip = minimum_path_weight(hsp_array, m, edge.target);
            } // end if
          } // end for loop (n)
        } // end if (hsp_array[m].keep)
      } // end for loop (m)
      ////////////////////////////////////////////////////////////////////
      // FIND ALL PATHS //////////////////////////////////////////////////
      let path = [];
      for (let n = 0; n < sigma.length; n++) {
        path.push(...find_all_paths(hsp_array, sigma[n]));
      } // end for loop
      path.sort(function(a, b) {
        if (a.path_length < b.path_length) { return -1; }
        if (a.path_length > b.path_length) { return  1; }
        return 0;
      }); // end sort
      ////////////////////////////////////////////////////////////////////
      // CREATE A NEW HSP ARRAY //////////////////////////////////////////
      let new_array = [];
      let best_path = path[0];
      for (let n = 0; n < best_path.indices.length; n++) {
        new_array.push(JSON.parse(JSON.stringify(hsp_array[best_path.indices[n]])));
      } // end for loop
      delete hsp_array;
      hsp_array = new_array;
      hsp_array = this.filter_hsp_array(hsp_array);
      break;
      ////////////////////////////////////////////////////////////////////
    } // end case
    default: { break; }
  } // end switch
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.extend = function(hsp_array, query, subject, options) {
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
  // UNGAPPED X-DROP /////////////////////////////////////////////////////
  let x_drop_options_1 = this.copy_object(options);
  x_drop_options_1.score.gapped = false;
  hsp_array = this.x_drop_extend(hsp_array, query, subject, x_drop_options_1);
  hsp_array = this.filter_hsp_array_by_expect(hsp_array, options.expect_threshold_1);
  ////////////////////////////////////////////////////////////////////////
  // GAPPED X-DROP ///////////////////////////////////////////////////////
  if (options.score.gapped) { hsp_array = this.x_drop_extend(hsp_array, query, subject, options); }
  hsp_array = this.filter_hsp_array_by_expect(hsp_array, options.expect_threshold_2);
  ////////////////////////////////////////////////////////////////////////
  // RETURN FUNCTION /////////////////////////////////////////////////////
  return hsp_array;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.global = function(query, subject, options) {
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
Alignment.prototype.link_HSPs = function(hsp_array, query, subject, options) {
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
Alignment.prototype.seed = function(query, subject, options) {
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
    for (let i = 0; i < options.seed.word_size; i++) { query_word_score += options.score.matrix[query_word[i]][query_word[i]]; }
    if ((query_word_score >= options.seed.score_threshold) || options.seed.exact_match) {
      let subject_word_index = options.seed.word_size;
      while ((subject_word_index <= subject.sequence.length) && (hsp_array.length <= options.seed.max_number)) {
        let subject_word = subject.sequence.substring(subject_word_index - options.seed.word_size, subject_word_index);
        if (/[a-z]/.test(subject_word) && options.seed.filter_low_complexity) { subject_word_index++; continue; }
        let word_score = 0;
        for (let i = 0; i < options.seed.word_size; i++) { word_score += options.score.matrix[query_word[i]][subject_word[i]]; }
        if ((word_score >= options.seed.score_threshold) || (options.seed.exact_match && (query_word === subject_word))) {
          let hsp = new HSP();
          hsp.query           =   query_word;
          hsp.subject         =   subject_word;
          hsp.query_start     =   query_word_index - options.seed.word_size;
          hsp.query_end       =   query_word_index;
          hsp.subject_start   =   subject_word_index - options.seed.word_size;
          hsp.subject_end     =   subject_word_index;
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
Alignment.prototype.two_hit = function(hsp_array, options) {
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
Alignment.prototype.x_drop_extend = function(hsp_array, query, subject, options) {
  ////////////////////////////////////////////////////////////////////////
  //  Single-thread primary function.                                   //
  //  Returns variables with return statement.                          //
  //====================================================================//
  //  This function performs the standard BLAST X-drop algorithm for    //
  //  extending HSPs using either gapped or ungapped local              //
  //  alignment.  For ungapped alignments, the HSP is extended in       //
  //  both directions by pairwise alignment.  If the total score in     //
  //  either direction falls below a floating threshold (calculated     //
  //  as the score of the maximum score achieved in that direction,     //
  //  minus the score specified by the option "x_drop.X1"), then the    //
  //  alignment process stops and the alignment is truncated to the     //
  //  position of the maximum score in that direction.  For gapped      //
  //  alignments, a centroid value is calculated for the HSP            //
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
  //      x_drop.X1, x_drop.X2, x_drop.X2_trigger, score.gapped,        //
  //      score.matrix, score.gap_open, score.gap_extend                //
  ////////////////////////////////////////////////////////////////////////
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (typeof(query    ) === 'undefined') { return []; }
  if (typeof(subject  ) === 'undefined') { return []; }
  if ( Array.isArray(subject  )) { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  options = this.complete_options(options);
  let dist = this.create_diagonal_distribution(hsp_array);
  let stats = this.calculate_search_space(query, subject, options);
  let X1_raw_score = this.bit_score_to_raw_score(options.x_drop.X1, stats);
  let X2_raw_score = this.bit_score_to_raw_score(options.x_drop.X2, stats);
  ////////////////////////////////////////////////////////////////////////
  // UNGAPPED X-DROP /////////////////////////////////////////////////////
  if (!options.score.gapped) {
    for (let i = 0; i < hsp_array.length; i++) {
      if (hsp_array[i].keep) {
        let left_score      =   0;
        let right_score     =   0;
        let max_left_score  =   0;
        let max_right_score =   0;
        let left_identity   =   0;
        let right_identity  =   0;
        let left_gaps       =   0;
        let right_gaps      =   0;
        let max_left_index  = { query_index: hsp_array[i].query_start, subject_index: hsp_array[i].subject_start };
        let max_right_index = { query_index: hsp_array[i].query_start, subject_index: hsp_array[i].subject_start };
        if (hsp_array[i].score) { max_right_index = { query_index: hsp_array[i].query_end, subject_index: hsp_array[i].subject_end }; }
        // extend left
        let query_index   = hsp_array[i].query_start   - 1;
        let subject_index = hsp_array[i].subject_start - 1;
        while ((query_index >= 0) && (subject_index >= 0) && (left_score >= (max_left_score - X1_raw_score))) {
          let letter1 = query[query_index];
          let letter2 = subject.sequence[subject_index];
          if (letter1 === letter2) { left_identity++; }
          if (letter1 === '-') { left_gaps++; }
          left_score += options.score.matrix[letter1][letter2];
          if (left_score > max_left_score) {
            max_left_score = left_score;
            max_left_index.query_index   = query_index;
            max_left_index.subject_index = subject_index;
          } // end if
          query_index--;
          subject_index--;
        } // end while
        // extend right
        query_index   = hsp_array[i].query_end;
        subject_index = hsp_array[i].subject_end;
        while ((query_index < query.length) && (subject_index < subject.sequence.length) && (right_score >= (max_right_score - X1_raw_score))) {
          let letter1 = query[query_index];
          let letter2 = subject.sequence[subject_index];
          if (letter1 === letter2) { right_identity++; }
          if (letter1 === '-') { right_gaps++; }
          right_score += options.score.matrix[letter1][letter2];
          if (right_score > max_right_score) {
            max_right_score = right_score;
            max_right_index.query_index   = query_index;
            max_right_index.subject_index = subject_index;
          } // end if
          query_index++;
          subject_index++;
        } // end while
        if (!max_left_index.query_index  ) { max_left_index.query_index   = 0; }
        if (!max_left_index.subject_index) { max_left_index.subject_index = 0; }
        if (max_right_index.query_index   >= query.length  ) { max_right_index.query_index   = (query.length   - 1); }
        if (max_right_index.subject_index >= subject.length) { max_right_index.subject_index = (subject.length - 1); }
        hsp_array[i].query_start    =   max_left_index.query_index;
        hsp_array[i].query_end      =   max_right_index.query_index;
        hsp_array[i].subject_start  =   max_left_index.subject_index;
        hsp_array[i].subject_end    =   max_right_index.subject_index;
        hsp_array[i].query          =   query.substring(hsp_array[i].query_start, hsp_array[i].query_end);
        hsp_array[i].subject        =   subject.sequence.substring(hsp_array[i].subject_start, hsp_array[i].subject_end);
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
    //////////////////////////////////////////////////////////////////////
    // MERGE OVERLAPPING HSPs ////////////////////////////////////////////
    let merged = true;
    while (merged) {
      for (let i = 0; i < hsp_array.length; i++) {
        merged = false;
        if (hsp_array[i].keep) {
          let j = i - 1;
          while (j >= 0) {
            if (hsp_array[j].keep) {
              if (hsp_array[i].diagonal == hsp_array[j].diagonal) {
                //////////////////////////////////////////////////////////
                // MERGE AND FILTER HSPs /////////////////////////////////
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
    //////////////////////////////////////////////////////////////////
    // CALCULATE THE SCORES AND RETURN THE FUNCTION //////////////////
    hsp_array = this.filter_hsp_array(hsp_array);
    hsp_array = this.calculate_hsp_scores(hsp_array, query, subject, options);
    return hsp_array;
  } // end if
  //////////////////////////////////////////////////////////////////////
  // GAPPED X-DROP /////////////////////////////////////////////////////
  else {
    hsp_array = this.calculate_hsp_centroids(hsp_array, options, 'x-drop');
    for (let i = 0; i < hsp_array.length; i++) {
      if (hsp_array[i].bit_score >= options.x_drop.X2_trigger) {
        let left_side_query     =   '';
        let right_side_query    =   '';
        let left_side_subject   =   '';
        let right_side_subject  =   '';
        //////////////////////////////////////////////////////////////////
        // EXTEND TO THE RIGHT ///////////////////////////////////////////
        // initialize variables
        let row                   = 0;
        let column                = 0;
        let verticle_score        = 0;
        let diagonal_score        = 0;
        let horizontal_score      = 0;
        let best_score            = -Infinity;
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
        matrix[address].direction = 'diagonal';
        current_cell.address.i    = upper_limit;
        current_cell.address.j    = d - current_cell.address.i;
        // loop to calculate the scores along the antidiagonal
        while (d < (subject.sequence.length + query.length)) {
          if ((current_cell.address.i < query.length) && (current_cell.address.j < subject.sequence.length)) {
            let query_letter        = query[current_cell.address.i];
            let subject_letter      = subject.sequence[current_cell.address.j];
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
            if (horizontal_score === max_score) { current_cell.direction = 'horizontal'; }
            if (vertical_score   === max_score) { current_cell.direction = 'vertical';   }
            if (diagonal_score   === max_score) { current_cell.direction = 'diagonal';   }
            if (current_cell.score > -Infinity) { antidiagonal.push(this.copy_object(current_cell)); }
          } // end if
          current_cell.address.i++;
          current_cell.address.j = d - current_cell.address.i;
          if ((current_cell.address.i >   lower_limit) || (current_cell.address.j < hsp_array[i].centroid.subject) || (current_cell.address.i >= query.length)) {
            //  The antidiagonal is finished.
            //  Calculate the new upper and lower limits,
            //  transfer the antidiagonal cells to the matrix,
            //  and start a new antidiagonal
            if (antidiagonal.length) {
              upper_limit =  Infinity;
              lower_limit = -Infinity;
              best_score  = -Infinity;
              for (let k = 0; k < antidiagonal.length; k++) { if (antidiagonal[k].score > best_score) { best_score = antidiagonal[k].score; } }
              for (let k = 0; k < antidiagonal.length; k++) {
                if (antidiagonal[k].score >= (best_score - X2_raw_score)) {
                  if (antidiagonal[k].address.i < upper_limit) { upper_limit = antidiagonal[k].address.i; }
                  if (antidiagonal[k].address.i > lower_limit) { lower_limit = antidiagonal[k].address.i; }
                  address = antidiagonal[k].address.j.toString() + '-' + antidiagonal[k].address.i.toString();
                  matrix[address] = this.copy_object(antidiagonal[k]);
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
        // find the cell of the matrix with the highest score
        address = '';
        best_score = -Infinity;
        matrix_keys = Object.keys(matrix);
        for (let k = 0; k < matrix_keys.length; k++) {
          if (matrix[matrix_keys[k]].score > best_score) {
            best_score = matrix[matrix_keys[k]].score;
            address = matrix_keys[k];
            row = matrix[matrix_keys[k]].address.i;
            column = matrix[matrix_keys[k]].address.j;
            hsp_array[i].query_end   = matrix[matrix_keys[k]].address.i;
            hsp_array[i].subject_end = matrix[matrix_keys[k]].address.j;
          } // end if
        } // end for loop
        // check to see if the full query was extended
        // begin the trace-back
        if (best_score > -Infinity) {
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
        //////////////////////////////////////////////////////////////////
        // EXTEND TO THE LEFT ////////////////////////////////////////////
        // initialize variables
        row               = 0;
        column            = 0;
        verticle_score    = 0;
        diagonal_score    = 0;
        horizontal_score  = 0;
        best_score        = -Infinity;
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
            let query_letter        = query[current_cell.address.i];
            let subject_letter      = subject.sequence[current_cell.address.j];
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
            if (horizontal_score === max_score) { current_cell.direction = 'horizontal'; }
            if (vertical_score   === max_score) { current_cell.direction = 'vertical';   }
            if (diagonal_score   === max_score) { current_cell.direction = 'diagonal';   }
            if (current_cell.score > -Infinity) { antidiagonal.push(this.copy_object(current_cell)); }
          } // end if
          current_cell.address.i--;
          current_cell.address.j = d - current_cell.address.i;
          if ((current_cell.address.i <   upper_limit) || (current_cell.address.j > hsp_array[i].centroid.subject) || (current_cell.address.i < 0)) {
            //  The antidiagonal is finished.
            //  Calculate the new upper and lower limits,
            //  transfer the antidiagonal cells to the matrix,
            //  and start a new antidiagonal
            if (antidiagonal.length) {
              upper_limit =  Infinity;
              lower_limit = -Infinity;
              best_score  = -Infinity;
              for (let k = 0; k < antidiagonal.length; k++) { if (antidiagonal[k].score > best_score) { best_score = antidiagonal[k].score; } }
              for (let k = 0; k < antidiagonal.length; k++) {
                if (antidiagonal[k].score >= (best_score - X2_raw_score)) {
                  if (antidiagonal[k].address.i < upper_limit) { upper_limit = antidiagonal[k].address.i; }
                  if (antidiagonal[k].address.i > lower_limit) { lower_limit = antidiagonal[k].address.i; }
                  address = antidiagonal[k].address.j.toString() + '-' + antidiagonal[k].address.i.toString();
                  matrix[address] = this.copy_object(antidiagonal[k]);
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
        // find the cell of the matrix with the highest score
        address = '';
        best_score = -Infinity;
        matrix_keys = Object.keys(matrix);
        for (let k = 0; k < matrix_keys.length; k++) {
          if (matrix[matrix_keys[k]].score > best_score) {
            best_score = matrix[matrix_keys[k]].score;
            address = matrix_keys[k];
            row = matrix[matrix_keys[k]].address.i;
            column = matrix[matrix_keys[k]].address.j;
            hsp_array[i].query_start   = matrix[matrix_keys[k]].address.i;
            hsp_array[i].subject_start = matrix[matrix_keys[k]].address.j;
          } // end if
        } // end for loop
        // begin the trace-back
        if (best_score > -Infinity) {
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
        //////////////////////////////////////////////////////////
        if (left_side_query  ) { left_side_query   =   left_side_query.substring(0, left_side_query.length   - 1); }
        if (left_side_subject) { left_side_subject = left_side_subject.substring(0, left_side_subject.length - 1); }
        hsp_array[i].query   = left_side_query   + right_side_query;
        hsp_array[i].subject = left_side_subject + right_side_subject;
        hsp_array[i].gapped_alignment = true;
        hsp_array[i].changed = true;
      } // end if
    } // end for loop
    hsp_array = this.filter_hsp_array(hsp_array);
    hsp_array = this.calculate_hsp_scores(hsp_array, query, subject, options);
    return hsp_array;
  } // end else
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// CATEGORY: SECONDARY SINGLE-THREAD FUNCTIONS ////////////////////////////////
//  (b) secondary supporting functions that provide mathematical, string     //
//    manipulation, and matrix manipulation capabilities.                    //
//===========================================================================//
//  Functions:                                                               //
//      Alignment.bit_score_to_raw_score                                     //
//      Alignment.calculate_hsp_best_stats                                   //
//      Alignment.calculate_hsp_centroids                                    //
//      Alignment.calculate_hsp_scores                                       //
//      Alignment.calculate_lambda                                           //
//      Alignment.calculate_search_space                                     //
//      Alignment.complete_options                                           //
//      Alignment.copy_attributes                                            //
//      Alignment.copy_object                                                //
//      Alignment.create_diagonal_distribution                               //
//      Alignment.create_hsp_report                                          //
//      Alignment.create_matrix                                              //
//      Alignment.filter_hsp_array                                           //
//      Alignment.filter_hsp_array_by_p_value                                //
//      Alignment.flip_string                                                //
//      Alignment.rescale_matrix                                             //
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.bit_score_to_raw_score = function(bit_score, stats) {
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
  return (((bit_score * Math.log(2)) + Math.log(stats.k)) / stats.lambda);
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.calculate_hsp_best_stats = function(hsp_array) {
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
Alignment.prototype.calculate_hsp_centroids = function(hsp_array, options, method) {
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
Alignment.prototype.calculate_hsp_scores = function(hsp_array, query, subject, options) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (typeof(query    ) === 'undefined') { return []; }
  if (typeof(subject  ) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  options = this.complete_options(options);
  let stats = this.calculate_search_space(query, subject, options);
  for (let i = 0; i < hsp_array.length; i++) {
    if (hsp_array[i].keep && hsp_array[i].changed) {
      hsp_array[i].score    = 0;
      hsp_array[i].gaps     = 0;
      hsp_array[i].identity = 0;
      if (hsp_array[i].query && hsp_array[i].subject) {
        hsp_array[i].diagonal   = hsp_array[i].query_start - hsp_array[i].subject_start;
        let query_index         =   0;
        let subject_index       =   0;
        let previous_letter1    =   '';
        let previous_letter2    =   '';
        while ((query_index < hsp_array[i].query.length) && (subject_index < hsp_array[i].subject.length)) {
          let letter1 = hsp_array[i].query.charAt(query_index).toUpperCase();
          let letter2 = hsp_array[i].subject.charAt(subject_index).toUpperCase();
          if (letter1 === '-') {
            hsp_array[i].gaps++;
            if (previous_letter1 === '-') { hsp_array[i].score -= options.score.gap_extend; }
            else { hsp_array[i].score -= (options.score.gap_open + options.score.gap_extend); }
          } // end if
          else if (letter2 === '-') {
            if (previous_letter2 === '-') { hsp_array[i].score -= (options.score.gap_extend); }
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
Alignment.prototype.calculate_lambda = function(matrix, query_freq, subject_freq) {
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
Alignment.prototype.calculate_search_space = function(query, subject, options) {
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
  stats.m_prime = stats.m - stats.l;
  stats.n_prime = 0;
  if (options.search_space.num_sequences) { stats.n_prime = stats.n - (stats.l * options.search_space.num_sequences); }
  else { stats.n_prime = stats.n - (stats.l * subject.length); }
  if (stats.m_prime < (1 / stats.k)) { stats.m_prime = 1 / stats.k; }
  return stats;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.complete_options = function(options) {
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
Alignment.prototype.copy_attributes = function(new_obj, old_obj) {
  for (var attr in old_obj) { if (old_obj.hasOwnProperty(attr)) { new_obj[attr] = old_obj[attr]; } }
  return new_obj;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.copy_object = function(obj) {
  let new_obj = JSON.parse(JSON.stringify(obj));
  return new_obj;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.create_diagonal_distribution = function(hsp_array) {
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
Alignment.prototype.create_hsp_report = function(hsp_array, query, subject, options) {
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
    // and calculate the sum of scores
    let g = 0;
    let score_r = 0;    // sum of scores
    for (let i = 0; i < hsp_array.length; i++) { score_r = score_r + hsp_array[i].score; }
    for (let i = 1; i < hsp_array.length; i++) { g = g + Math.abs(hsp_array[i].query_start - hsp_array[(i - 1)].query_end); }
    if (!g) { g = 0; }
    // calculate the overall statistics
    let beta = 0.1; // gap decay constant
    let r = hsp_array.length;
    let sum_score = 0;
    if (g) { sum_score = (stats.lambda * score_r) - Math.log(stats.k * stats.m * stats.n) - ((r - 1) * (Math.log(stats.k) + (2 * Math.log(g)))) - Math.log(factorial(r)); }
    else { sum_score = (stats.lambda * score_r) - (r * Math.log(stats.k * stats.m * stats.n)) + Math.log(factorial(r)); }
    let sum_p_value = ((Math.exp(-1 * sum_score)) * Math.pow(sum_score, (r - 1))) / ( factorial(r) * factorial(r - 1));
    let corrected_p_value = sum_p_value / ( Math.pow(beta, (r - 1)) * (1 - beta));
    report.score     = sum_score;
    report.nat_score = (stats.lambda * report.score) - Math.log(stats.k);
    report.bit_score = report.nat_score / Math.log(2);
    report.expect    = (stats.n_prime / stats.n) * corrected_p_value;
    report.p_value   = corrected_p_value;
    report.threshold = 0.05;
    if (report.p_value < report.threshold) { report.significant = true; }
    report.hsp_gaps   = g;
    report.query      = query;
    report.subject    = subject.sequence;
    report.data       = subject;
    report.identity   = 0;
    report.characters = 0;
    for (let i = 0; i < hsp_array.length; i++) {
      let hsp = this.copy_attributes(new HSP(), hsp_array[i]);
      report.hsp.push(hsp);
      report.characters += hsp_array[i].characters;
      report.identity   += hsp_array[i].identity;
    } // end for loop
    report.percent_identity = (report.identity / report.characters) * 100;
    report.query_coverage = (report.characters / query.length) * 100;
    report.query_length = query.length;
  } // end else if (MULTIPLE HSPs)
  ////////////////////////////////////////////////////////////////////////
  // add the completed report to the array
  return report;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.create_matrix = function(length) {
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
Alignment.prototype.filter_hsp_array = function(hsp_array) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.filter_hsp_array_by_bit_score = function(hsp_array, threshold) {
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
Alignment.prototype.filter_hsp_array_by_expect = function(hsp_array, threshold) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  delete hsp_array;
  hsp_array = new_hsp_array;
  delete new_hsp_array;
  new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].expect < threshold && hsp_array[i].expect >= 0) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.filter_hsp_array_by_p_value = function(hsp_array, threshold) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
  let new_hsp_array = [];
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].keep) { new_hsp_array.push(hsp_array[i]); } }
  delete hsp_array;
  hsp_array = new_hsp_array;
  delete new_hsp_array;
  new_hsp_array = [];
  threshold = threshold / hsp_array.length;
  for (let i = 0; i < hsp_array.length; i++) { if (hsp_array[i].p_value < threshold && hsp_array[i].p_value >= 0) { new_hsp_array.push(hsp_array[i]); } }
  return new_hsp_array
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.flip_string = function(string) {
  if (typeof(string) === 'undefined') { string = ''; }
  let new_string = '';
  for (let i = (string.length - 1); i >= 0; i--) {
    new_string += string[i];
  } // end for loop
  return new_string;
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.rescale_matrix = function(query, subject, options) {
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
//      Alignment.blast                                                      //
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Alignment.prototype.blast = function(query, subject, options, workerNumber) {
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
      let job = { status: 'command', command: 'blast', query: query, subject: [subject[i]], options: options, workerNumber: workerNumber };
      this.add_job(job);
    } // end for loop
  } // end if
  else {
    //////////////////////////////////////////////////////////////////////
    // SETUP /////////////////////////////////////////////////////////////
    let report_array = [];
    let stats = this.calculate_search_space(query, subject, options);
    //////////////////////////////////////////////////////////////////
    // LOOP THROUGH subject ARRAY (SUBJECT SEQUENCES) ////////////////
    for (index = 0; index < subject.length; index++) {
      ////////////////////////////////////////////////////////////////////
      // SEED WORDS //////////////////////////////////////////////////////
      let hsp_array = this.seed(query, subject[index], options);
      if (!hsp_array.length) {
        report_array.push(new Report(options.batch));
        continue;
      } // end if
      query = query.toUpperCase();
      subject[index].sequence = subject[index].sequence.toUpperCase();
      ////////////////////////////////////////////////////////////////////
      // RESCALE THE MATRIX //////////////////////////////////////////////
      if (options.score.rescale_matrix) {
        options.score.matrix = this.rescale_matrix(query, subject[index], options);
      } // end if
      ////////////////////////////////////////////////////////////////////
      // EXTEND HSPs /////////////////////////////////////////////////////
      hsp_array = this.extend(hsp_array, query, subject[index], options);
      if (!hsp_array.length) {
        report_array.push(new Report(options.batch));
        continue;
      } // end if
      ////////////////////////////////////////////////////////////////////
      // EVALUATE HSPs ///////////////////////////////////////////////////
      hsp_array = this.evaluate(hsp_array, query, subject[index], options);
      if (!hsp_array.length) {
        report_array.push(new Report(options.batch));
        continue;
      } // end if
      ////////////////////////////////////////////////////////////////////
      // LINK HSPs ///////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////
      // CREATE REPORT ///////////////////////////////////////////////////
      let report = this.create_hsp_report(hsp_array, query, subject[index], options)
      //report.linked_hsp = this.link_HSPs(hsp_array, query, subject[index], options);
      report.batch = options.batch;
      report_array.push(report);
      ////////////////////////////////////////////////////////////////////
    } // end for loop
    //////////////////////////////////////////////////////////////////////
    let result = { status: 'complete', command: 'blast', result: report_array, workerNumber: workerNumber };
    postMessage(result);
  } // end else
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
