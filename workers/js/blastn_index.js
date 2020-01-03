///////////////////////////////////////////////////////////////////////////////////////////////////
// BLASTN_INDEX ///////////////////////////////////////////////////////////////////////////////////
//  Receives an object containing a series of genome IDs and sequences and creates an index of   //
//  corresponding kmers and genome IDs.  For this algorithm, a kmer size of 8 is used as the     //
//  default.  Smaller kmer sizes produce lists of corresponding genome IDs that are too long     //
//  to be sent reliably to the database without resulting in a "time out" error.  Larger kmer    //
//  sizes produce enough letter permutations to cause the algorithm to run out of memory.        //
///////////////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS ////////////////////////////////////////////////////////////////////////////////////////
var current_base_url = 'https://www.moiraiconservation.org';
importScripts(current_base_url + '/js/math.js');
importScripts(current_base_url + '/js/db_guard.js?version='+guid());
///////////////////////////////////////////////////////////////////////////////////////////////////
// GENOME KMER DISTRIBUTION PARAMETERS ////////////////////////////////////////////////////////////
//  The following parameters are based on the distribution of total sequence IDs attributed to   //
//  each kmer.  These parameters were calculated using the Sebastes aleutianus genome as a       //
//  reference (NCBI) for kmer sizes of 7, 8, 9, 10, and 11.                                      //
///////////////////////////////////////////////////////////////////////////////////////////////////
var parameters = {
     "7": { "mean": 0.6181, "median": 0.6528, "stdev": 0.2211, "iqr": 0.3872, "mad": 0.1852 },
     "8": { "mean": 0.2513, "median": 0.2251, "stdev": 0.1492, "iqr": 0.2382, "mad": 0.1133 },
     "9": { "mean": 0.0021, "median": 0.0000, "stdev": 0.0384, "iqr": 0.0000, "mad": 0.0000 },
    "10": { "mean": 0.0000, "median": 0.0000, "stdev": 0.0000, "iqr": 0.0000, "mad": 0.0000 },
    "11": { "mean": 0.0000, "median": 0.0000, "stdev": 0.0000, "iqr": 0.0000, "mad": 0.0000 }
};
///////////////////////////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////////////////////////
var t0, t1;
var report          =   false;
var alphabet        =   4;
var kmer_size       =   8;
var total_kmers     =   Math.pow(alphabet, kmer_size);
var distribution    =   new Array(total_kmers);
var batch           =   0;
var batch_size      =   Infinity;
var global_offset   =   0;
var global_limit    =   0;
var local_offset    =   0;
var local_limit     =   0;
var threshold       =   parameters[kmer_size]["median"];
///////////////////////////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////
function send_records(distribution, organism_name, kmer_size, result, total, index, chunk_size) {
    return new Promise(function(resolve, reject) {
        if (typeof(distribution ) === 'undefined') { reject(Error('Missing argument')); }
        if (typeof(organism_name) === 'undefined') { reject(Error('Missing argument')); }
        if (typeof(result       ) === 'undefined') { reject(Error('Missing argument')); }
        if (typeof(total        ) === 'undefined') { reject(Error('Missing argument')); }
        if (typeof(index        ) === 'undefined') { index = 0; }
        if (typeof(chunk_size   ) === 'undefined') { chunk_size = 50; }
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
                    } // end if
                    else { console.log("database error"); }
                    send_records(distribution, organism_name, kmer_size, result, total, index, chunk_size)
                    .then(() => { resolve(); });
                } // end if
            }; // end function
            let send_message = "execute=true";
            send_message += "&command=blastn_index_to_db";
            send_message += "&organism_name=" + organism_name.replace(/ /g, "_");
            send_message += "&index=" + index;
            send_message += "&kmer_size=" + kmer_size;
            send_message += "&json=" + JSON.stringify(chunk_dist);
            xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/blastn_index", true);
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlhttp.send(send_message);
        } // end if
        else { update_metadata(organism_name); postMessage(result); resolve(); }
    }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
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
        xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/blastn_index", true);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.send(send_message);
    }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
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
        xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/blastn_index", true);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.send(send_message);
    }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////////////////////
