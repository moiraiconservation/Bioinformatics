///////////////////////////////////////////////////////////////////////////////
// genome_index ///////////////////////////////////////////////////////////////
// Yeah, so I've rewritten this entire file about six times now trying to    //
// find a workable strategy for effective genome indexing with a client-     //
// server model.  Here are some notes for this go around:                    //
// For genomes with 100,000 records or less, each kmer will be mapped 1:1    //
// with the record in which it was discovered.  For genomes with between     //
// 1000,000 and 200,000 records, each kmer will be mapped within 2 records;  //
// for between 200,000 and 300,000 records, each kmer will be mapped within  //
// 3 records; etc.  That's the only way to do it without running out of      //
// memory and crashing the browser.  Since the majority of eukaryotic        //
// genomes have general range of total nucleotides (a few billion), the      //
// large differences in the total number of records seems to be caused by    //
// the size of the scaffolds or contigs in the genome assembly, meaning that //
// genomes with more records in our database simply have many more records   //
// that fall below the standard 50,000 nucleotide-per-record benchmark.      //
// I'm hoping that combining neighboring records in the index in these large //
// fragmented genomes won't be much of a problem.  ... I'll probably scrap   //
// this idea and rewrite this damn file using a new strategy soon.           //
///////////////////////////////////////////////////////////////////////////////
// IMPORTS ////////////////////////////////////////////////////////////////////
var current_base_url = 'https://www.moiraiconservation.org';
importScripts(current_base_url + '/bioinformatics/js/codon_codes.js');
importScripts(current_base_url + '/js/math.js');
importScripts(current_base_url + '/js/db_guard.js?version='+guid());
///////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////
let batch               = 0;
let batch_size          = Infinity;
let compression_factor  = 1;
let distribution        = undefined;
let global_limit        = 0;
let global_offset       = 0;
let local_limit         = 0;
let local_offset        = 0;
let previous_seq        = "";
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
onmessage = function(e) {
  var job     = e.data      ||  { };
  var json    = job.json    ||  { };
  var options = job.options ||  { };
  var effective_num_records = 1;
  switch(job.command) {
    case "create": {
      batch_size      = job.limit;
      global_offset   = job.offset;
      global_limit    = job.limit;
      distribution    = new Array(Math.pow(4, options.kmer_size));
      compression_factor    = Math.ceil(global_limit / 100000);
      effective_num_records = Math.ceil(global_limit / compression_factor);
      let blob_length       = Math.ceil(effective_num_records / 52);
      for (let i = 0; i < distribution.length; i++) { distribution[i] = new Array(blob_length).fill(0); }
      postMessage({ status: "complete", command: "subtitle2", text: "Part 1 of 2" });
      postMessage({ status: "complete", command: "create", json: json, options: options, offset: global_offset, limit: global_limit });
      break;
    } // end case
    case "create_index": {
      postMessage({ status: 'complete', command: "show_progress_bar" });
      local_offset    =   job.offset;
      local_limit     =   job.limit;
      batch           =   job.batch;
      batch_size      =   job.batch_size;
      organism_name = JSON.parse(json[0]).table;
      update_genome_index_metadata(organism_name);
      for (let k = 0; k < job.data.length; k++) {
        let id = parseInt(job.data[k].id) - 1;
        let current_seq = previous_seq.substring(previous_seq.length - (options.kmer_size - 1)) + job.data[k].sequence;
        for (let j = options.kmer_size; j <= current_seq.length; j++) {
          let kmer = current_seq.substring(j - options.kmer_size, j);
          if (kmer) {
            let kmer_index = kmer_to_index(kmer);
            if (typeof(kmer_index) === "number") {
              distribution[kmer_index] = add_kmer_index(id, distribution[kmer_index], compression_factor);
            } // end if
          } // end if
        } // end for loop
        previous_seq = job.data[k].sequence;
      } // end for loop
      // check to see if we're done importing genome records
      if ((local_offset + local_limit) >= global_limit) {
        postMessage({ status: 'complete', command: "reset_progress_bar", amount: distribution.length });
        postMessage({ status: "complete", command: "update_progress_bar", amount: options.upload_start });
        send_genome_index_to_db(organism_name, options.upload_start)
        .then(() => {
          postMessage({ status: 'complete', command: "hide_progress_bar" });
          postMessage({ status: 'complete', command: "create_index", json: json, options: options, offset: local_offset, limit: local_limit, batch: batch, batch_size: batch_size });
        }); // end then
      } // end if
      else { postMessage({ status: 'complete', command: "create_index", json: json, options: options, offset: local_offset, limit: local_limit, batch: batch, batch_size: batch_size }); }
      break;
    } // end case
    default: { break; }
  } // end switch
} // end onmessage
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function add_kmer_index(id, address, compression_factor) {
  let id_prime = Math.floor(id / compression_factor);
  let block = Math.floor(id_prime / 52);
  let offset = id_prime % 52;
  let binary = address[block].toString(2).padStart(52, "0");
  if (binary.charAt(offset) === "0") {
    binary = binary.replaceAt(offset, "1");
    address[block] = parseInt(binary, 2);
  } // end if
  return address;
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function kmer_to_index(kmer) {
  if (!kmer) { return false; }
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
      case 'a': { value = 0; break; }
      case 'c': { value = 1; break; }
      case 'g': { value = 2; break; }
      case 't': { value = 3; break; }
      default: { return false; }
    } // end switch
    index = index + (value * factor);
    factor = factor * 4;
  } // end for loop
  return index;
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function send_genome_index_to_db(organism_name, start, chunk_size) {
  return new Promise(function(resolve, reject) {
    if (typeof(organism_name) === "undefined") { resolve(); }
    if (typeof(start) === "undefined") { start = 0; }
    if (typeof(chunk_szie) === "undefined") { chunk_size = 10; }
    let end = start + chunk_size;
    update_genome_index_metadata(organism_name, distribution.length)
    .then(() => {
      let current_text = end.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
      let total_text = distribution.length.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
      postMessage({ status: "complete", command: "text", text: "Saving Records" });
      postMessage({ status: "complete", command: "subtitle", text: "Saving record: " + current_text + " out of " + total_text });
      postMessage({ status: "complete", command: "subtitle2", text: "Part 2 of 2" });
      let sub_index = distribution.slice(start, end);
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.timeout = 60000;
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {
            if (this.responseText) { console.log(this.responseText); }
            start = end;
            end += chunk_size;
            if (end > distribution.length) { end = distribution.length; }
            if (start >= end) { update_genome_index_metadata(organism_name, distribution.length).then(resolve); }
            else {
              postMessage({ status: "complete", command: "update_progress_bar", amount: chunk_size });
              setTimeout(() => { send_genome_index_to_db(organism_name, start, chunk_size).then(resolve); }, 300);
            } // end else
          } // end if
          else {
            console.log("genome_index.js: Pausing for 3 minutes to allow server reset.");
            setTimeout(() => { console.log("genome_index.js: Resuming ..."); send_genome_index_to_db(organism_name, start, chunk_size).then(resolve); }, 180000);
          } // end else
        } // end if
      }; // end function
      xmlhttp.ontimeout = function() {
        console.log("genome_index.js: Pausing for 3 minutes to allow server reset.");
        setTimeout(() => { console.log("genome_index.js: Resuming ..."); send_genome_index_to_db(organism_name, start, chunk_size).then(resolve); }, 180000);
      }.bind(null, organism_name, start, chunk_size);
      let send_message = "execute=true";
      send_message += "&command=genome_index_to_db";
      send_message += "&organism_name=" + organism_name;
      send_message += "&json=" + JSON.stringify(sub_index);
      xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/genome_index", true);
      xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xmlhttp.send(send_message);
    }); // end then
  }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function update_genome_index_metadata(organism_name, num_records) {
  return new Promise(function(resolve, reject) {
    if (typeof(num_records) === "undefined") { num_records = 0; }
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
    send_message += "&num_records=" + num_records;
    xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/genome_index", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
// https://stackoverflow.com/a/1431113
String.prototype.replaceAt = function(index, replacement) {
  return this.substring(0, index) + replacement + this.substring((index + 1));
} // end function
///////////////////////////////////////////////////////////////////////////////
