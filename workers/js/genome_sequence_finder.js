///////////////////////////////////////////////////////////////////////////////
// SEQUENCE_FINDER.JS /////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// IMPORTS ////////////////////////////////////////////////////////////////////
var current_base_url = 'https://www.moiraiconservation.org';
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function GenomeFinderOptions(organism_name) {
  this.kmer_size      = 28;
  this.organism_name  = organism_name || "";
  this.result         = [];
  this.query          = "";
} // end object
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
function GenomeFinderOptions_Full(organism_name) {
  this._command           = "";
  this._data              = [];
  this._distribution      = [];
  this._kmer_kmer_list    = [];
  this._kmer_list         = [];
  this._genome            = { _database: "genome_db", _num_records: 0, _table: organism_name.replace(/ /g, '_') }
  this._index             = { _compression_factor: 1, _database: "genome_index_db", _num_records: 0, _table: organism_name.replace(/ /g, '_') }
  this._quick_scan_result = [];
  this.kmer_size          = 28;
  this.organism_name      = organism_name || "";
  this.result             = [];
  this.query              = "";
} // end object
///////////////////////////////////////////////////////////////////////////////
onmessage = function(e) {
  const database_delay = 0; /// in milliseconds: 0 = fuck tha database; 100 = speedy; 300 = considerate
  const job = e.data || { };
  switch(job.command) {
    case "find": {
      let options = new GenomeFinderOptions_Full(job.options.organism_name);
      options.kmer_size = job.options.kmer_size;
      options.query = job.options.query;
      get_num_records(options)
      .then(response => {
        options = response;
        let query_word_index = options.kmer_size;
        ////////////////////////////////////////////////////////////////
        // CREATE THE KMER LIST ////////////////////////////////////////
        options.query = options.query.toUpperCase();
        while (query_word_index <= options.query.length) {
          let kmer = options.query.substring(query_word_index - options.kmer_size, query_word_index);
          let kmer_index = options._kmer_list.indexOf(kmer);
          if (kmer_index === -1) { options._kmer_list.push(kmer); }
          query_word_index++;
        } // end while
        ////////////////////////////////////////////////////////////////
        // CREATE THE KMER KMER LIST ///////////////////////////////////
        for (let i = 0; i < options._kmer_list.length; i++) {
          const new_index_entry = { kmer: options._kmer_list[i], parts: [] };
          query_word_index = 8;
          while (query_word_index <= options._kmer_list[i].length) {
            let kmer = options._kmer_list[i].substring(query_word_index - 8, query_word_index);
            let kmer_index = kmer_to_index(kmer);
            if (typeof(kmer_index) === "number") {
              let kmer_obj = new_index_entry.parts.find(x => x.kmer === kmer);
              if (typeof(kmer_obj) === "undefined") { new_index_entry.parts.push({ index: kmer_index, kmer: kmer }); }
            } // end if
            query_word_index++;
          } // end while
          options._kmer_kmer_list.push(new_index_entry);
        } // end for loop
        ////////////////////////////////////////////////////////////////
        // QUICK SCAN //////////////////////////////////////////////////
        postMessage({ status: "progress", command: "find", target: "progress_bar", action: "create", text: "Quick Scan", amount: options._kmer_kmer_list.length });
        quick_scan(options)
        .then(quick_scan_result => {
          options = quick_scan_result;
          //////////////////////////////////////////////////////////////
          // COMPILE THE DISTRIBUTION //////////////////////////////////
          postMessage({ status: "progress", command: "find", target: "progress_bar", action: "create", text: "Compiling", amount: options._quick_scan_result.length });
          for (let i = 0; i < options._quick_scan_result.length; i++) {
            for (let j = 0; j < options._quick_scan_result[i].ids.length; j++) {
              let record = options._distribution.find(x => x.id === options._quick_scan_result[i].ids[j]);
              if (record) {
                let dist_index = options._distribution.indexOf(record);
                let kmer_index = options._distribution[dist_index].kmers.indexOf(options._quick_scan_result[i].kmer);
                if (kmer_index === -1) { options._distribution[dist_index].kmers.push(options._quick_scan_result[i].kmer); }
              } // end if
              else { options._distribution.push({ id: options._quick_scan_result[i].ids[j], kmers: [ options._quick_scan_result[i].kmer ] })
              } // end if
            } // end for loop
            let index_text = i.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
            let limit_text = options._quick_scan_result.length.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
            let subtitle_text = "Record: " + index_text + " out of " + limit_text;
            postMessage({ status: "progress", command: "find", target: "progress_bar", action: "subtitle", text: subtitle_text });
            postMessage({ status: "progress", command: "find", target: "progress_bar", action: "update", amount: 1 });
          } // end for loop
          options._distribution.sort(function(a, b) { if (a.id < b.id) { return -1; } else { return 1; } });
          //////////////////////////////////////////////////////////////
          // FULL SCAN /////////////////////////////////////////////////
          postMessage({ status: "progress", command: "find", target: "progress_bar", action: "create", text: "Full Scan", amount: options._distribution.length });
          full_scan(options).then(full_scan_result => {
            let new_options = new GenomeFinderOptions(full_scan_result.organism_name);
            new_options.kmer_size = full_scan_result.kmer_size;
            new_options.result = full_scan_result.result;
            new_options.query = full_scan_result.query;
            postMessage({ status: "progress", command: "find", target: "progress_bar", action: "hide" });
            postMessage({ status: "complete", command: "find", result: new_options });
          })
          .catch(error => { console.log(error); });
        }).catch(error => { console.log(error); });
      })
      .catch(error => { console.log(error); });
      //////////////////////////////////////////////////////////////////
      // METHOD ////////////////////////////////////////////////////////
      function full_scan(options, offset) {
        return new Promise(function(resolve, reject) {
          if (typeof(offset) === "undefined") { offset = 0; options.result = []; }
          let chunk_size = 50;
          let offset_text = offset.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
          let limit_text = options._distribution.length.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
          let subtitle_text = "Record: " + offset_text + " out of " + limit_text;
          postMessage({ status: "progress", command: "find", target: "progress_bar", action: "subtitle", text: subtitle_text });
          if (offset >= options._distribution.length) { resolve(options); }
          else {
            let temp_options = new GenomeFinderOptions_Full(options.organism_name);
            temp_options._command = "full_scan";
            temp_options._data = options._distribution.slice(offset, (offset + chunk_size));
            temp_options.kmer_size = options.kmer_size;
            temp_options.query = options.query;
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
              if (this.readyState == 4 && this.status == 200) {
                if (this.responseText) {
                  result = JSON.parse(this.responseText);
                  for (let i = 0; i < result.result.length; i++) {
                    let record = options.result.find(x => x.id === result.result[i]);
                    if (typeof(record) !== "undefined") {
                      let record_index = options.result.indexOf(record);
                      options.result[record_index].num_kmers++;
                    } // end if
                    else { options.result.push({ id: result.result[i], num_kmers: 1 }); }
                  } // end for loop
                  offset += chunk_size;
                  postMessage({ status: "progress", command: "find", target: "progress_bar", action: "update", amount: chunk_size });
                  if (database_delay) { setTimeout(() => { full_scan(options, offset).then(new_options => resolve(new_options)); }, database_delay ).catch(error => { console.log(error); }); }
                  else { full_scan(options, offset).then(new_options => resolve(new_options)).catch(error => { console.log(error); }); }
                } // end if
                else {
                  offset += chunk_size;
                  full_scan(options, offset).then(new_options => resolve(new_options)).catch(error => { console.log(error); });
                } // end else
              } // end if
            }; // end function
            let send_message = "execute=true";
            send_message += "&options=" + JSON.stringify(temp_options);
            xmlhttp.open("POST", current_base_url + "/workers/PHP/genome_sequence_finder", true);
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlhttp.send(send_message);
          } // end else
        }); // end promise
      } // end function
      //////////////////////////////////////////////////////////////////
      // METHOD ////////////////////////////////////////////////////////
      function get_num_records(options) {
        return new Promise(function(resolve, reject) {
          options._command = "num_records";
          let xmlhttp = new XMLHttpRequest();
          xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText) {
                const response = JSON.parse(this.responseText);
                response._command = "";
                response._index._compression_factor = Math.ceil(response._genome._num_records / 100000);
                resolve(response);
              } // end if
            } // end if
          }; // end function
          let send_message = "execute=true";
          send_message += "&options=" + JSON.stringify(options);
          xmlhttp.open("POST", current_base_url + "/workers/PHP/genome_sequence_finder", true);
          xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
          xmlhttp.send(send_message);
        }); // end promise
      } // end function
      //////////////////////////////////////////////////////////////////
      // METHOD ////////////////////////////////////////////////////////
      function quick_scan(options, offset) {
        return new Promise(function(resolve, reject) {
          if (typeof(offset) === "undefined") { offset = 0; options.result = []; }
          let offset_text = offset.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
          let limit_text = options._kmer_kmer_list.length.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
          let subtitle_text = "Record: " + offset_text + " out of " + limit_text;
          postMessage({ status: "progress", command: "find", target: "progress_bar", action: "subtitle", text: subtitle_text });
          if (offset >= options._kmer_kmer_list.length) { resolve(options); }
          else {
            let temp_options = new GenomeFinderOptions_Full(options.organism_name);
            temp_options._command = "quick_scan";
            temp_options.kmer_size = options.kmer_size;
            temp_options.query = options.query;
            if (options._kmer_kmer_list[offset]) { temp_options._data = options._kmer_kmer_list[offset].parts; }
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
              if (this.readyState == 4 && this.status == 200) {
                if (this.responseText) {
                  let id_map = [];
                  let result = JSON.parse(this.responseText).result;
                  for (let i = 0; i < result.length; i++) {
                    result[i].sequences = JSON.parse(result[i].sequences);
                    let binary = "";
                    for (let j = 0; j < result[i].sequences.length; j++) {
                      binary += result[i].sequences[j].toString(2).padStart(52, "0");
                    } // end for loop
                    id_map.push(binary);
                  } // end for loop
                  let new_record = { kmer: "", ids: [] };
                  if (options._kmer_kmer_list[offset]) { new_record.kmer = options._kmer_kmer_list[offset].kmer; }
                  for (let i = 0; i < id_map[0].length; i++) { // 54,860 binary digits
                    let tally = 0;
                    for (let j = 0; j < id_map.length; j++) { // 21 kmers, 8 nucleotides long
                      if (id_map[j].charAt(i) === "1") { tally++; }
                    } // end for loop
                    if (tally === id_map.length) {
                      for (let k = 1; k <= options._index._compression_factor; k++) {
                        new_record.ids.push(((i * options._index._compression_factor) + k));
                      } // end for loop
                    } // end if
                  } // end for loop
                  options._quick_scan_result.push(new_record);
                  offset++;
                  postMessage({ status: "progress", command: "find", target: "progress_bar", action: "update", amount: 1 });
                  if (database_delay) { setTimeout(() => { quick_scan(options, offset).then(resolve); }, database_delay ).catch(error => { console.log(error); }); }
                  else { quick_scan(options, offset).then(resolve).catch(error => { console.log(error); }); }
                } // end if
              } // end if
            }; // end function
            let send_message = "execute=true";
            send_message += "&options=" + JSON.stringify(temp_options);
            xmlhttp.open("POST", current_base_url + "/workers/PHP/genome_sequence_finder", true);
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlhttp.send(send_message);
          } // end else
        }); // end promise
      } // end function
      //////////////////////////////////////////////////////////////////
      break;
    } // end case
    case "get_sequences": {
      get_sequences(job.options)
      .then(result => {
        let new_options = new GenomeFinderOptions(result.organism_name);
        new_options.kmer_size = result.kmer_size;
        new_options.result = result.result;
        new_options.query = result.query;
        postMessage({ status: "complete", command: "get_sequences", result: new_options });
      })
      .catch(error => { console.log(error); });
      ////////////////////////////////////////////////////////////////////
      // METHOD //////////////////////////////////////////////////////////
      function get_sequences(options) {
        return new Promise(function(resolve, reject) {
          let temp_options = new GenomeFinderOptions_Full(options.organism_name);
          temp_options._command = "get_sequences";
          temp_options._data = options.result;
          temp_options.kmer_size = options.kmer_size;
          temp_options.query = options.query;
          let xmlhttp = new XMLHttpRequest();
          xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
              if (this.responseText) {
                const response = JSON.parse(this.responseText);
                response._command = "";
                resolve(response);
              } // end if
            } // end if
          }; // end function
          let send_message = "execute=true";
          send_message += "&options=" + JSON.stringify(temp_options);
          xmlhttp.open("POST", current_base_url + "/workers/PHP/genome_sequence_finder", true);
          xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
          xmlhttp.send(send_message);
        }); // end promise
      } // end function
      ////////////////////////////////////////////////////////////////////
      break;
    } // end case
    default: { break; }
  } // end switch
} // end onmessage
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
      case 'a': { value = 0; break; }
      case 'C': { value = 1; break; }
      case 'c': { value = 1; break; }
      case 'G': { value = 2; break; }
      case 'g': { value = 2; break; }
      case 'T': { value = 3; break; }
      case 't': { value = 3; break; }
      default: { return false; }
    } // end switch
    index = index + (value * factor);
    factor = factor * 4;
  } // end for loop
  return index;
} // end function
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
String.prototype.replaceAt = function(index, replacement) {
  return this.substr(0, index) + replacement + this.substr(index + replacement.length);
} // end function
///////////////////////////////////////////////////////////////////////////////
