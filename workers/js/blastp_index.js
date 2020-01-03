///////////////////////////////////////////////////////////////////////////////////////////////////
// BLASTP_INDEX ///////////////////////////////////////////////////////////////////////////////////
//  Receives an object containing a series of protein IDs and sequences and creates an index of  //
//  corresponding kmers and protein IDs.  For this algorithm, a kmer size of 4 is used as the    //
//  default.  Smaller kmer sizes produce lists of corresponding protein IDs that are too long    //
//  to be sent reliably to the database without resulting in a "time out" error.  Larger kmer    //
//  sizes produce enough letter permutations to cause the algorithm to run out of memory.        //
///////////////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS ////////////////////////////////////////////////////////////////////////////////////////
var current_base_url = 'https://www.moiraiconservation.org';
importScripts(current_base_url + '/js/math.js');
importScripts(current_base_url + '/bioinformatics/js/seg.js?version='+guid());
importScripts(current_base_url + '/bioinformatics/js/scoring_matrices.js?version='+guid());
importScripts(current_base_url + '/js/db_guard.js?version='+guid());
///////////////////////////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////////////////////////
var blastp_index = [];
///////////////////////////////////////////////////////////////////////////////////////////////////
onmessage = function(e) {
    var job = e.data || { };
    switch(job.command) {
        case 'create': {
            let kmer_size    = 4;
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
///////////////////////////////////////////////////////////////////////////////////////////////////
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
            xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/blastp_index", true);
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
///////////////////////////////////////////////////////////////////////////////////////////////////
function send_records(distribution, keys, organism_name, index) {
    return new Promise(function(resolve, reject) {
        if (typeof(distribution ) === 'undefined') { reject(Error('Missing argument')); }
        if (typeof(keys         ) === 'undefined') { reject(Error('Missing argument')); }
        if (typeof(organism_name) === 'undefined') { reject(Error('Missing argument')); }
        if (typeof(index        ) === 'undefined') { index = 0; }
        let chunk_size = 10000;
        if (index < keys.length) {
            send_records_loop(distribution, keys, organism_name, index);
            resolve();
        } // end if
        else {
            let result = { status: 'step4', command: 'create', work: 0 };
            postMessage(result);
            resolve();
        } // end else
    }); // end promise
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
function send_records_loop(distribution, keys, organism_name, index) {
    if (typeof(distribution ) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(keys         ) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(organism_name) === 'undefined') { reject(Error('Missing argument')); }
    if (typeof(index        ) === 'undefined') { index = 0; }
    if (index < keys.length) {
        setTimeout(function() {
            let record = { };
            record.kmer = keys[index];
            record.sequences = distribution[keys[index]];
            record_to_db(record, organism_name, index)
            .then(function() {
                index++;
                send_records(distribution, keys, organism_name, index);
            });
        }, 100);
    } // end if
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
function record_to_db(record, organism_name, index) {
    return new Promise(function(resolve, reject) {
            try {
            if (typeof(record) === 'undefined') { reject(Error('Missing argument')); }
            if (typeof(organism_name) === 'undefined') { reject(Error('Missing argument')); }
            if (typeof(index        ) === 'undefined') { index = 0; }
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        let result = { status: 'step3', command: 'create', work: index };
                        postMessage(result);
                        if (this.responseText) { console.log(this.responseText); }
                        resolve();
                    } // end if
                    else {
                        record_to_db(record, organism_name, index)
                        .then(() => { resolve(); });
                    } // end else
                } // end if
            }; // end function
            let send_message = "execute=true";
            send_message += "&command=blastp_index_to_db";
            send_message += "&organism_name=" + organism_name.replace(/ /g, "_");
            send_message += "&num_uploaded=" + index;
            send_message += "&json=" + JSON.stringify(record);
            xmlhttp.open("POST", "https://www.moiraiconservation.org/workers/PHP/blastp_index", true);
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
///////////////////////////////////////////////////////////////////////////////////////////////////
