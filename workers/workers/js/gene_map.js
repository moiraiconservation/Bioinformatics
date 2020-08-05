///////////////////////////////////////////////////////////////////////////////////////////////////
// GENE_MAP ///////////////////////////////////////////////////////////////////////////////////////
//  TODO: Worker description
///////////////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS ////////////////////////////////////////////////////////////////////////////////////////
var current_base_url = 'https://www.moiraiconservation.org';
importScripts(current_base_url + '/js/math.js');
importScripts(current_base_url + '/js/db_guard.js?version='+guid());
///////////////////////////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////////////////////////
var t0, t1;
var report  =   false;
///////////////////////////////////////////////////////////////////////////////////////////////////
onmessage = function(e) {
    var job             =   e.data      ||  { };
    var json            =   job.json    ||  { };
    var options         =   job.options ||  { };
    switch(job.command) {
        case 'create': {
            t0 = performance.now();
            break;
        } // end case
        default: { break; }
    } // end switch
} // end onmessage
///////////////////////////////////////////////////////////////////////////////////////////////////
