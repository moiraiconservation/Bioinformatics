///////////////////////////////////////////////////////////////////////////////
// genome_index ///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// IMPORTS ////////////////////////////////////////////////////////////////////
var current_base_url = 'https://www.moiraiconservation.org';
importScripts(current_base_url + '/bioinformatics/js/codon_codes.js');
importScripts(current_base_url + '/js/math.js');
importScripts(current_base_url + '/js/db_guard.js?version='+guid());
///////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////
let batch         = 0;
let batch_size    = Infinity;
let distribution  = undefined;
let global_limit  = 0;
let global_offset = 0;
let local_limit   = 0;
let local_offset  = 0;
let previous_seq  = "";
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
onmessage = function(e) {
  var job     = e.data      ||  { };
  var json    = job.json    ||  { };
  var options = job.options ||  { };
  switch(job.command) {
    case "create": {
      batch_size      = job.limit;
      global_offset   = job.offset;
      global_limit    = job.limit;
      distribution = new Array(Math.pow(2, options.kmer_size));
      for (let i = 0; i < distribution.length; i++) {
        distribution[i] = new Array(Math.ceil(global_limit / 32));
        distribution[i].fill(0);
      } // end for loop
      postMessage({ status: "complete", command: "subtitle2", text: "Calculating ..."});
      let result = { status: "complete", command: "create", json: json, options: options, offset: global_offset, limit: global_limit };
      postMessage(result);
      break;
    } // end case
    case "create_index": {
      var t0 = performance.now();
      postMessage({ status: "complete", command: "subtitle2", text: "Calculating ..."});
      local_offset    =   job.offset;
      local_limit     =   job.limit;
      batch           =   job.batch;
      batch_size      =   job.batch_size;
      organism_name = JSON.parse(json[0]).table;
      update_metadata(organism_name);
      for (let k = 0; k < job.data.length; k++) {
        let id = parseInt(job.data[k].id) - 1;
        let current_seq = previous_seq.substring(previous_seq.length - (options.kmer_size - 1)) + job.data[k].sequence;
        let current_seq_rc = reverse_complement(current_seq);
        current_seq = compress_alphabet(current_seq);
        current_seq_rc = compress_alphabet(current_seq_rc);
        for (let j = options.kmer_size; j <= current_seq.length; j++) {
          let kmer = current_seq.substring(j - options.kmer_size, j);
          let kmer_rc = current_seq_rc.substring(j - options.kmer_size, j);
          // Positive Strand
          if (kmer === kmer.toUpperCase()) {
            let kmer_index = kmer_to_index_compressed(kmer);
            distribution[kmer_index] = add_kmer_index(id, distribution[kmer_index]);
          } // end if
          // negative strand
        } // end for loop
        previous_seq = job.data[k].sequence;
      } // end for loop
      var t1 = performance.now();
      console.log("Function took " + ((t1 - t0) / 1000) + " seconds.");
      let result = { status: 'complete', command: "create_index", json: json, options: options, offset: local_offset, limit: local_limit, batch: batch, batch_size: batch_size };
      postMessage(result);
      /*
      send_genome_index_to_db(options.table, index)
      .then(() => {
      });
      */
      break;
    } // end case
    case "update": {
      let result = { status: 'complete', command: 'update' };
      postMessage(result);
      break;
    } // end case
    default: { break; }
  } // end switch
} // end onmessage
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function add_kmer_index(id, address) {
  let block = Math.floor(id / 32);
  let offset = id % 32;
  let binary = dec2bin(address[block]).padStart(32, "0");
  if (binary.charAt(offset) === "0") {
    binary = binary.replaceAt(id, "1");
    address[block] = parseInt(binary, 2);
  } // end if
  return address;
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function dec2bin(dec) { return (dec >>> 0).toString(2); }
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function kmer_to_index(kmer) {
  let index = 0;
  let factor = 1;
  for (let i = (kmer.length - 1); i >= 0; i--) {
    let value = 0;
    let letter = kmer.charAt(i);
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
// FUNCTION ///////////////////////////////////////////////////////////////////
function kmer_to_index_compressed(kmer) {
  let index = 0;
  let factor = 1;
  for (let i = (kmer.length - 1); i >= 0; i--) {
    let value = 0;
    let letter = kmer.charAt(i);
    switch(letter) {
      case 'S': { value = 0; break; }
      case 'W': { value = 1; break; }
      default: { break; }
    } // end switch
    index = index + (value * factor);
    factor = factor * 2;
  } // end for loop
  return index;
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function send_genome_index_to_db(organism_name, index, start, chunk_size) {
  return new Promise(function(resolve, reject) {
    if (typeof(organism_name) === "undefined") { resolve(); }
    if (typeof(start) === "undefined") { start = 0; }
    if (typeof(chunk_szie) === "undefined") { chunk_size = 10000; }
    let end = start + chunk_size;
    let sub_index = index.slice(start, end);
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          if (this.responseText) { console.log(this.responseText); }
          start = end;
          end += chunk_size;
          if (end > index.length) { end = index.length; }
          if (start >= end) { resolve(); }
          else {
            let start_text = start.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
            let total_text = index.length.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
            let job = { status: "complete", command: "subtitle2", text: "Saving " + start_text + " out of " + total_text};
            postMessage(job);
            setTimeout(function() { send_genome_index_to_db(organism_name, index, start, chunk_size).then(resolve); }.bind(null, organism_name, index, start, chunk_size), 300);
          } // end else
        } // end if
        else { console.log("Nope!"); resolve(); }
      } // end if
    }; // end function
    let send_message = "execute=true";
    send_message += "&command=genome_index_to_db";
    send_message += "&organism_name=" + organism_name;
    send_message += "&json=" + JSON.stringify(sub_index);
    xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/genome_index", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
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
// PROTOTYPE //////////////////////////////////////////////////////////////////
// https://stackoverflow.com/a/1431113
String.prototype.replaceAt = function(index, replacement) {
  return this.substr(0, index) + replacement + this.substr(index + replacement.length);
} // end function
///////////////////////////////////////////////////////////////////////////////
