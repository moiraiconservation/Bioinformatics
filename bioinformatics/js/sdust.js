///////////////////////////////////////////////////////////////////////////////
// SDUST //////////////////////////////////////////////////////////////////////
//  The SDUST algorithm is designed for masking low-complexity regions       //
//  within nucleotide sequences.  For a complete discussion, see following:  //
//    Morgulis, A., Gertz, E. M., Schäffer, A. A., & Agarwala, R. (2006).    //
//      A fast and symmetric DUST implementation to mask low-complexity DNA  //
//      sequences. Journal of Computational Biology, 13(5), 1028-1040.       //
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function sdust(sequence, options) {
  if (typeof(sequence) === 'undefined') { return { }; }
  if (typeof(options ) === 'undefined') { options = { }; }
  if (!options.window_length) {
    options.window_length =  64;
    if (sequence.length < options.window_length) { options.window_length = sequence.length; }
  } // end if
  if (!options.score_threshold) { options.score_threshold = 2; }
  let window_start = 0;
  let window_end = options.window_length;
  ////////////////////////////////////////////////////////////////////////
  // STEP 1 | FIND THE PERFECT INTERVALS IN THE FIRST WINDOW /////////////
  let w1 = sequence.slice(window_start, window_end);
  let subsequences = get_every_substring(w1);
  let perfect_intervals = find_perfect_intervals(subsequences);
  ////////////////////////////////////////////////////////////////////////
  // STEP 2 | MOVE THE WINDOW ACROSS THE SEQUENCE ////////////////////////
  window_start++;
  window_end++;
  while(window_end <= sequence.length) {
    let wk = sequence.slice(window_start, window_end);
    subsequences = get_every_suffix(wk, window_start);
    perfect_intervals = find_perfect_intervals(subsequences, perfect_intervals);
    window_start++;
    window_end++;
  } // end if
  /////////////////////////////////////////////////////////////////////////////
  // STEP 3 | MASK THE LOW COMPLEXITY REGIONS /////////////////////////////////
  for (let i = 0; i < perfect_intervals.length; i++) {
    let mask = sequence.substring(perfect_intervals[i].start, perfect_intervals[i].end).toLowerCase();
    let seq1 = sequence.substring(0, perfect_intervals[i].start);
    let seq2 = sequence.substring(perfect_intervals[i].end);
    sequence = seq1 + mask + seq2;
  } // end for loop
  return sequence;
  /////////////////////////////////////////////////////////////////////////////
  // METHOD ///////////////////////////////////////////////////////////////////
  function calculate_score(str) {
    if (str.length <= 3) { return 0; }
    const triplets = count_triplets(str);
    let numerator = 0;
    for (let i = 0; i < triplets.length; i++) {
      numerator = numerator + ((triplets[i] * (triplets[i] - 1)) / 2);
    } // end for loop
    let score = numerator / (str.length - 3);
    return score;
  } // end method
  /////////////////////////////////////////////////////////////////////////////
  // METHOD ///////////////////////////////////////////////////////////////////
  function count_triplets(str) {
    const triplets = [];
    for (let i = 0; i < 64; i++) { triplets.push(0); }
    for (let i = 0; i <= (str.length - 3); i++) {
      let triplet = str.slice(i, i + 3);
      triplets[triplet_to_index(triplet)]++;
    } // end if
    return triplets;
  } // end if
  /////////////////////////////////////////////////////////////////////////////
  // METHOD ///////////////////////////////////////////////////////////////////
  function find_perfect_intervals(seq_array, interval_array) {
    if (typeof(interval_array) === "undefined") { interval_array = []; }
    let intervals = [];
    for (let i = 0; i < interval_array.length; i++) { intervals.push(interval_array[i]); }
    for (let i = 0; i < seq_array.length; i++) {
      seq_array[i].remove = false;
      seq_array[i].score = calculate_score(seq_array[i].str);
      if (seq_array[i].score > options.score_threshold) {
        intervals.push(seq_array[i]);
      } // end if
    } // end for loop
    for (let i = 0; i < intervals.length; i++) {
      for (let j = 0; j < intervals.length; j++) {
        if (j != i) {
          if (intervals[j].remove == false) {
            // check to see if intervals[i] is a subsequence of intervals[j]
            if ((intervals[i].start >= intervals[j].start) && (intervals[i].end <= intervals[j].end)) {
              if (intervals[i].score > intervals[j].score) { intervals[j].remove = true; }
            } // end if
            // check to see if intervals[j] is a subsequence of intervals[i]
            else if ((intervals[j].start >= intervals[i].start) && (intervals[j].end <= intervals[i].end)) {
              if (intervals[j].score > intervals[i].score) { intervals[i].remove = true; }
            } // end else if
          } // end if
        } // end for loop
      } // end for loop
    } // end for loop
    const perfect_intervals = [];
    while (intervals.length) {
      let interval = intervals.pop();
      if (interval.remove == false) { perfect_intervals.push(interval); }
    } // end while loop
    return perfect_intervals;
  } // end method
  /////////////////////////////////////////////////////////////////////////////
  // METHOD ///////////////////////////////////////////////////////////////////
  function get_every_substring(str, offset) {
    if (typeof(offset) === 'undefined') { offset = 0; }
    var i, j, result = [];
    for (i = 0; i < str.length; i++) {
      for (j = i + 1; j < str.length; j++) {
        let obj = { };
        obj.str = str.slice(i, j);
        obj.start = i + offset;
        obj.end = j + offset;
        result.push(obj);
      } // end for loop
    } // end for loop
    return result;
  } // end method
  /////////////////////////////////////////////////////////////////////////////
  // METHOD ///////////////////////////////////////////////////////////////////
  function get_every_suffix(str, offset) {
    if (typeof(offset) === 'undefined') { offset = 0; }
    var i, j, result = [];
    for (i = 0; i < str.length; i++) {
      let obj = { };
      obj.str = str.slice(i, str.length);
      obj.start = i + offset;
      obj.end = str.length + offset;
      result.push(obj);
    } // end for loop
    return result;
  } // end method
  /////////////////////////////////////////////////////////////////////////////
  // METHOD ///////////////////////////////////////////////////////////////////
  function index_to_triplet(index) {
    triplet = '';
    denominator = 4;
    while (index > 0) {
      remainder = index % denominator;
      switch (remainder) {
        case 0: { triplet = 'A' + triplet; break; }
        case 1: { triplet = 'C' + triplet; break; }
        case 2: { triplet = 'G' + triplet; break; }
        case 3: { triplet = 'T' + triplet; break; }
        default: { break; }
      } // end switch
      index = (index - remainder) / 4;
    } // end while
    triplet = triplet.padStart(3, 'A');
    return triplet;
  } // end function
  /////////////////////////////////////////////////////////////////////////////
  // METHOD ///////////////////////////////////////////////////////////////////
  function triplet_to_index(triplet) {
    let index = 0;
    let factor = 1;
    for (let i = (triplet.length - 1); i >= 0; i--) {
      let value = 0;
      let letter = triplet[i];
      switch(letter) {
        case 'A': { value = 0; break; }
        case 'C': { value = 1; break; }
        case 'G': { value = 2; break; }
        case 'T': { value = 3; break; }
        default: { break; }
      } // end switch
      index = index + (value * factor);
      factor = factor * 4;
    } // end for loop
    return index;
  } // end function
  /////////////////////////////////////////////////////////////////////////////
} // end function
