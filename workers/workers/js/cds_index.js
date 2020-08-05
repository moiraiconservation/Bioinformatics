///////////////////////////////////////////////////////////////////////////////
// cds_index //////////////////////////////////////////////////////////////////
//  Receives an object containing a series of gene IDs and sequences and     //
//  creates an index of corresponding kmers and gene IDs.  For this          //
//  algorithm, a kmer size of 8 is used as the default.  Smaller kmer sizes  //
//  produce lists of corresponding protein IDs that are too long to be sent  //
//  reliably to the database without resulting in a "time out" error.        //
//  Larger kmer sizes produce enough letter permutations to cause the        //
//  algorithm to run out of memory.                                          //
///////////////////////////////////////////////////////////////////////////////
// IMPORTS ////////////////////////////////////////////////////////////////////
var current_base_url = 'https://www.moiraiconservation.org';
importScripts(current_base_url + '/js/math.js');
importScripts(current_base_url + '/bioinformatics/js/seg.js?version='+guid());
importScripts(current_base_url + '/bioinformatics/js/scoring_matrices.js?version='+guid());
importScripts(current_base_url + '/js/db_guard.js?version='+guid());
///////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////
var cds_index = [];
///////////////////////////////////////////////////////////////////////////////
onmessage = function(e) {
  var job = e.data || { };
  switch(job.command) {
  case 'create': {
      let kmer_size    = 8;
      let distribution = { };
      for (let k = 0; k < job.data.length; k++) {
        for (let j = kmer_size; j <= job.data[k].sequence.length; j++) {
          let kmer = job.data[k].sequence.substring(j - kmer_size, j);
          if (!distribution[kmer]) { distribution[kmer] = []; }
          distribution[kmer].push(job.data[k].id);
        } // end for loop
        let result = { status: 'step1', command: 'create', work: k };
        postMessage(result);
      } // end for loop
      let keys = Object.keys(distribution);
      let num_records = Object.keys(distribution).length;
      let result = { status: 'step2', command: 'create', work: num_records };
      postMessage(result);
      update_number_of_records(job.organism_name, num_records)
      .then(() => { send_records(distribution, keys, job.organism_name, job.num_uploaded); });
      break;
    } // end case
    default: { break; }
  } // end switch
} // end onmessage
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function update_number_of_records(organism_name, num_records) {
  return new Promise(function(resolve, reject) {
    try {
      let xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200 && this.responseText) { console.log(this.responseText); }
          resolve();
        } // end if
      }; // end function
      let send_message = "execute=true";
      send_message += "&command=update_num_records";
      send_message += "&num_records=" + num_records;
      send_message += "&id=" + organism_name.replace(/ /g, "_");
      xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/cds_index", true);
      xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xmlhttp.send(send_message);
    } // end try
    catch(err) {
      let result = { status: 'error', command: 'create', work: 'Could not connect to the database.  Please try again later.' };
      postMessage(result);
      resolve();
    } // end catch
  }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function send_records(distribution, keys, organism_name, index, chunk_size) {
  return new Promise(function(resolve, reject) {
    if (typeof(distribution ) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(keys         ) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(organism_name) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(index        ) === 'undefined') { index = 0; }
    if (typeof(chunk_size   ) === 'undefined') { chunk_size = 25; }
    if (index + chunk_size > keys.length) { chunk_size = keys.length - index; }
    if (index < keys.length) {
      send_records_loop(distribution, keys, organism_name, index, chunk_size);
      resolve();
    } // end if
    else {
      let result = { status: 'step4', command: 'create', work: 0 };
      postMessage(result);
      resolve();
    } // end else
  }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function send_records_loop(distribution, keys, organism_name, index, chunk_size) {
  if (typeof(distribution ) === 'undefined') { reject(Error('Missing argument')); }
  if (typeof(keys         ) === 'undefined') { reject(Error('Missing argument')); }
  if (typeof(organism_name) === 'undefined') { reject(Error('Missing argument')); }
  if (typeof(index        ) === 'undefined') { index = 0; }
  if (typeof(chunk_size   ) === 'undefined') { chunk_size = 50; }
  if (index < keys.length) {
    setTimeout(function() {
      const record = [];
      for (let i = index; i < (index + chunk_size); i++) {
        const new_record = { };
        new_record.kmer = keys[i];
        new_record.sequences = distribution[keys[i]].join();
        record.push(new_record);
      } // end for loop
      record_to_db(record, organism_name, index, chunk_size)
      .then((result) => {
        if (result.status === "success") {
          index = index + chunk_size;
          chunk_size++;
          if (chunk_size > 50) { chunk_size = 50; }
          send_records(distribution, keys, organism_name, index, chunk_size);
        } // end if
        else {
          chunk_size = chunk_size - 10;
          if (chunk_size <= 0) { chunk_size = 1; }
          send_records(distribution, keys, organism_name, index, chunk_size);
        } // end else
      });
    }, 100);
  } // end if
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function record_to_db(record, organism_name, index, chunk_size) {
  return new Promise(function(resolve, reject) {
    if (typeof(record) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(organism_name) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(index        ) === 'undefined') { index = 0; }
    if (typeof(chunk_size   ) === 'undefined') { chunk_size = 50; }
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          let result = { status: 'step3', command: 'create', work: { index: index, chunk_size: chunk_size } };
          postMessage(result);
          if (this.responseText) { console.log(this.responseText); }
          resolve({ status: "success" });
        } // end if
        else { resolve({ status: "failure" }); }
      } // end if
    }; // end function
    let send_message = "execute=true";
    send_message += "&command=cds_index_to_db";
    send_message += "&organism_name=" + organism_name.replace(/ /g, "_");
    send_message += "&num_uploaded=" + index;
    send_message += "&json=" + JSON.stringify(record);
    xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/cds_index", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////
