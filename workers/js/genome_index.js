///////////////////////////////////////////////////////////////////////////////
// genome_index ///////////////////////////////////////////////////////////////
//  Receives an object containing a series of genome IDs and sequences and   //
//  creates an index of corresponding kmers and genome IDs.  For this        //
//  algorithm, a kmer size of 8 is used as the default.  Smaller kmer sizes  //
//  produce lists of corresponding genome IDs that are too long to be sent   //
//  reliably to the database without resulting in a "time out" error.        //
//  Larger kmer sizes produce enough letter permutations to cause the        //
//  algorithm to run out of memory.                                          //
///////////////////////////////////////////////////////////////////////////////
// IMPORTS ////////////////////////////////////////////////////////////////////
var current_base_url = 'https://www.moiraiconservation.org';
importScripts(current_base_url + '/js/math.js');
importScripts(current_base_url + '/js/db_guard.js?version='+guid());
///////////////////////////////////////////////////////////////////////////////
// GENOME KMER DISTRIBUTION PARAMETERS ////////////////////////////////////////
//  The following parameters are based on the distribution of total genome   //
//  database table entry sequence IDs attributed to each kmer.  These        //
//  parameters were calculated using the Sebastes aleutianus genome as a     //
//  reference (NCBI) for kmer sizes of 7, 8, 9, 10, and 11.  Any individual  //
//  kmers that end up with more associated sequence indices than the         //
//  specified threshold will be removed from the final pool of kmers.        //
//  Calculation of the threshold is as follows:                              //
//      global_limit * parameters[k][“median”]                               //
//  Where parameters[k][“median”] is the median distribution value specified //
//  in the parameters object, and k is the kmer word size, and global_limit  //
//  is the total number of individual genome database table entries in for   //
//  the organism.                                                            //
//  Our database divides contig and scaffold genome sequences into           //
//  sequential regions of 50,000 nucleotides each and stores each region as  //
//  a separate database table entry.  For example, an imported genome FASTA  //
//  file consisting of 2 billion nucleotides would be stored as a series of  //
//  40,000 sequential table entries, each consisting of 50,000 nucleotides.  //
//  Therefore in this instance global_limit would equal 40,000.  The purpose //
//  for this entire approach is to keep the kmer sequence index record for   //
//  the organism from growing to an unmanageable size by removing sequence   //
//  IDs that match to all or most kmers, indicating that the kmer itself is  //
//  not very useful in a BLAST search for finding appropriate high-scoring   //
//  sequence pairs.                                                          //
//  In other words, think of the analogy of an index in a book.  Let’s say   //
//  that you pick up a 348-page book and wanted to find the page that        //
//  contains the phrase “Now is the time for all good men to come to the aid //
//  of the country of Andorra.”  You turn to the index and start finding the //
//  pages that each word is found on.  You discover that the word “the” is   //
//  found on all 348 pages, which means that the word “the” is not useful at //
//  all for finding the phrase and can be ignored.  The word “Andorra”       //
//  however only appears on page 291, meaning that page 291 is likely the    //
//  location of the phrase.  For our purposes, the phrase is the query       //
//  sequence to be used in a BLAST search, the kmers are the words, the book //
//  pages are the sequential collection of 50,000-nucleotide database        //
//  entries, and the index is what this program builds.  Kmers (words) that  //
//  appear on all or most pages (database entries) are not useful for        //
//  finding phrases (queries), and can be left out of the index.             //
//===========================================================================//
//  Note:  The runtime for retrieving records is 2 hours and 36 minutes on   //
//  my computer.  That doesn't even include the time necessary for saving    //
//  the indices to the database.                                             //
///////////////////////////////////////////////////////////////////////////////
var parameters = {
   "7": { "mean": 0.6181, "median": 0.6528, "stdev": 0.2211, "iqr": 0.3872, "mad": 0.1852 },
   "8": { "mean": 0.2513, "median": 0.2251, "stdev": 0.1492, "iqr": 0.2382, "mad": 0.1133 },
   "9": { "mean": 0.0021, "median": 0.0000, "stdev": 0.0384, "iqr": 0.0000, "mad": 0.0000 },
  "10": { "mean": 0.0000, "median": 0.0000, "stdev": 0.0000, "iqr": 0.0000, "mad": 0.0000 },
  "11": { "mean": 0.0000, "median": 0.0000, "stdev": 0.0000, "iqr": 0.0000, "mad": 0.0000 }
};
///////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////
var t0, t1;
var report          =   false;
const alphabet      =   4;
const kmer_size     =   8;
var total_kmers     =   Math.pow(alphabet, kmer_size);
var distribution    =   new Array(total_kmers);
var batch           =   0;
var batch_size      =   Infinity;
var global_offset   =   0;
var global_limit    =   0;
var local_offset    =   0;
var local_limit     =   0;
var threshold       =   parameters[kmer_size]["median"];
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
onmessage = function(e) {
  var job             =   e.data      ||  { };
  var json            =   job.json    ||  { };
  var options         =   job.options ||  { };
  switch(job.command) {
    case 'create': {
      t0 = performance.now();
      batch_size      = job.limit;
      global_offset   = job.offset;
      global_limit    = job.limit;
      for (let i = 0; i < distribution.length; i++) { distribution[i] = []; }
      let result = { status: 'complete', command: 'create', json: json, options: options, offset: global_offset, limit: global_limit };
      postMessage(result);
      break;
    } // end case
    case 'update': {
      local_offset    =   job.offset;
      local_limit     =   job.limit;
      batch           =   job.batch;
      batch_size      =   job.batch_size;
      organism_name = JSON.parse(json[0]).table;
      update_metadata(organism_name);
      for (let k = 0; k < job.data.length; k++) {
        for (let j = kmer_size; j <= job.data[k].sequence.length; j++) {
          let kmer = job.data[k].sequence.substring(j - kmer_size, j);
          if (!(/[a-z]/.test(kmer)) && kmer.match(/^[A\C\T\G]+$/g)) {
            let index = kmer_to_index(kmer);
            if (distribution[index] !== 'X') {
                if (distribution[index].length) {
                  let last_id = distribution[index].pop();
                  distribution[index].push(last_id);
                  if (job.data[k].id !== last_id) { distribution[index].push(job.data[k].id); }
                } // end if
                else { distribution[index].push(job.data[k].id); }
                if (threshold && (distribution[index].length >= (global_limit * threshold))) { distribution[index] = 'X'; }
              } // end if
            } // end if
        } // end for loop
      } // end for loop
      let result = { status: 'complete', command: 'update', json: json, options: options, offset: local_offset, limit: local_limit, batch: batch, batch_size: batch_size };
      if ((local_offset + local_limit) >= global_limit) {
        for (i = 0; i < distribution.length; i++) { if (distribution[i] === 'X') { distribution[i] = []; } }
        postMessage({ status: 'complete', command: 'reset', amount: distribution.length })
        postMessage({ status: 'complete', command: 'text', text: 'Saving Indices' })
        reset_table(organism_name)
        .then(() => {
          send_records(distribution, organism_name, kmer_size, result, distribution.length)
          .then(() => {
            t1 = performance.now();
            let stopwatch = ((t1 - t0) / 1000) / 60;
            if (report) {
              console.log("Execution time: " + stopwatch + " minutes");
            } // end if
          });
        }); // end then
      } // end if
      else { postMessage(result); }
      break;
    } // end case
    default: { break; }
  } // end switch
} // end onmessage
///////////////////////////////////////////////////////////////////////////////
// FUNCTIONS //////////////////////////////////////////////////////////////////
function send_records(distribution, organism_name, kmer_size, result, total, index, chunk_size) {
  return new Promise(function(resolve, reject) {
    // now with adaptive chuncking
    if (typeof(distribution ) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(organism_name) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(result       ) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(total        ) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(index        ) === 'undefined') { index = 0; }
    if (typeof(chunk_size   ) === 'undefined') { chunk_size = 50; }
    const max_chunk_size = 50;
    const min_chunk_size = 1;
    if (distribution.length) {
      update_metadata(organism_name);
      if (chunk_size > distribution.length) { chunk_size = distribution.length; }
      let chunk_dist = distribution.splice(0, chunk_size);
      let xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {
            if (this.responseText) { console.log(this.responseText); }
            index += chunk_size;
            let text = 'Saving index ' + index + ' out of ' + total;
            postMessage({ status: 'complete', command: 'update_progress_bar', amount: chunk_size });
            postMessage({ status: 'complete', command: 'subtitle', text: text })
            // we're good, so increase the chunk size
            chunk_size = chunk_size++;
            if (chunk_size > max_chunk_size) { chunk_size = max_chunk_size; }
          } // end if
          else {
            // decrease the chunck size, put the chunk back at the beginning of
            // the distribution, and try again
            chunk_size = chunk_size - 10;
            if (chunk_size < min_chunk_size) { chunk_size = min_chunk_size; }
            distribution = chunk_dist.concat(distribution);
          } // end else
          send_records(distribution, organism_name, kmer_size, result, total, index, chunk_size)
          .then(() => { resolve(); });
        } // end if
      }; // end function
      let send_message = "execute=true";
      send_message += "&command=genome_index_to_db";
      send_message += "&organism_name=" + organism_name.replace(/ /g, "_");
      send_message += "&index=" + index;
      send_message += "&kmer_size=" + kmer_size;
      send_message += "&json=" + JSON.stringify(chunk_dist);
      xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/genome_index", true);
      xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xmlhttp.send(send_message);
    } // end if
    else { update_metadata(organism_name); postMessage(result); resolve(); }
  }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function update_metadata(organism_name) {
  return new Promise(function(resolve, reject) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200 && this.responseText) { console.log(this.responseText); }
        resolve();
      } // end if
    }; // end function
    let send_message = "execute=true";
    send_message += "&command=update_metadata";
    send_message += "&id=" + organism_name.replace(/ /g, "_");
    xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/genome_index", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function reset_table(organism_name) {
  return new Promise(function(resolve, reject) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200 && this.responseText) { console.log(this.responseText); }
        resolve();
      } // end if
    }; // end function
    let send_message = "execute=true";
    send_message += "&command=reset_table";
    send_message += "&organism_name=" + organism_name.replace(/ /g, "_");
    xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/genome_index", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function kmer_to_index(kmer) {
  let index = 0;
  let factor = 1;
  for (let i = (kmer.length - 1); i >= 0; i--) {
    let value = 0;
    let letter = kmer[i];
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
///////////////////////////////////////////////////////////////////////////////
