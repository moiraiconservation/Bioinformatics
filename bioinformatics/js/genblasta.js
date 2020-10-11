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
// FUNCTION ////////////////////////////////////////////////////////
function genblasta(hsp_array, query, subject, options) {
  if (typeof(hsp_array) === 'undefined') { return []; }
  if (typeof(query    ) === 'undefined') { return []; }
  if (typeof(subject  ) === 'undefined') { return []; }
  if (typeof(options  ) === 'undefined') { return []; }
  if ( Array.isArray(subject  )) { return []; }
  if (!Array.isArray(hsp_array)) { return []; }
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
  return hsp_array;
} // end function
///////////////////////////////////////////////////////////////////////////////
