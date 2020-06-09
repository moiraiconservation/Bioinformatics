///////////////////////////////////////////////////////////////////////////////
// CLIENT_TABLE ///////////////////////////////////////////////////////////////
//  This worker script is designed to serve as a wrapper for database table  //
//  access.  For each of this script, a single database table can be either  //
//  downloaded and stored locally on the client's computer, in which case    //
//  all access is performed on a local array, or the table can be accessed   //
//  on the server, in which case commands are filtered through db_guard.js   //
//  and db_guard.php for secure access.  The script is designed so that      //
//  either option is indistinguishable in terms of script interaction, with  //
//  the exception of an initial command for loading a table locally, and     //
//  additional commands related to features for structuring and transforming //
//  local tables, which is not possible though MySQL server database         //
//  queries.  As such, the commands recognized by this script can be divided //
//  into four categories:                                                    //
//      (1) Commands that can be applied to either client-side or server-    //
//          side database tables.                                            //
//      (2) Commands that only can be applied to client-side database        //
//          tables.                                                          //
//      (3) Commands that can only be applied to server-side database        //
//          tables.                                                          //
//      (4) Commands that do not interact with tables.                       //
//===========================================================================//
//  Command list:                                                            //
//    connect, load, ping, select, structure                                 //
///////////////////////////////////////////////////////////////////////////////
// IMPORTS ////////////////////////////////////////////////////////////////////
var current_base_url = 'https://www.moiraiconservation.org';
importScripts(current_base_url + '/js/math.js');
importScripts(current_base_url + '/js/db_guard.js?version='+guid());
importScripts(current_base_url + '/bioinformatics/js/seg.js?version='+guid());
importScripts(current_base_url + '/bioinformatics/js/binary_search_tree.js?version='+guid());
///////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES ///////////////////////////////////////////////////////////
var client_table            = { };
client_table.table          = [];
client_table.tree           = new BinarySearchTree();
client_table.table_name     = '';
client_table.database_name  = '';
client_table.structure      = 'none';
client_table.location       = 'server';
///////////////////////////////////////////////////////////////////////////////
// MESSAGES ///////////////////////////////////////////////////////////////////
onmessage = function(e) {
  var job = e.data || { };
  switch(job.command) {
    //////////////////////////////////////////////////////////////////////
    //  Category 3: Command that can only be applied to server-side     //
    //  database tables.                                                //
    //==================================================================//
    //  The "connect" command is designed to establish an initial       //
    //  connection to the server-side database.  This command locks     //
    //  the worker script into server-side mode, and only can be        //
    //  performed once for each instance of this script.                //
    //////////////////////////////////////////////////////////////////////
    case 'connect': {
      if (client_table.table.length ||
          client_table.table_name   ||
          client_table.database_name) { postMessage({ status: 'complete', command: 'connect', table_size: table.length }); }
      else {
        let obj = { };
        obj.database  = job.database  ||  '';
        obj.table     = job.table     ||  '';
        obj.command   = "connect"     ||  '';
        let json = JSON.stringify(obj);
        db_guard(json)
        .then(responseText => {
          client_table.database_name  = obj.database;
          client_table.table_name     = obj.table;
          client_table.location       = 'server'
          postMessage(JSON.parse(responseText));
        }); // end then
      } // end else
      break;
    } // end case
    //////////////////////////////////////////////////////////////////////
    //  Category 2: Command that only can be applied to client-side     //
    //  database tables.                                                //
    //==================================================================//
    //  The "load" command instructs the script to load a single        //
    //  instance of a database table into local memory as an array.     //
    //  This command locks the worker script into client-side mode,     //
    //  and only can be performed once for each instance of this        //
    //  script.                                                         //
    //////////////////////////////////////////////////////////////////////
    case 'load': {
      if (client_table.table.length ||
          client_table.table_name   ||
          client_table.database_name) { postMessage({ status: 'complete', command: 'load', table_size: table.length }); }
      else {
        let obj = { options: { } };
        obj.database    = job.database    ||  '';
        obj.table       = job.table       ||  '';
        obj.command     = "select_all"    ||  '';
        obj.limit       = job.limit       ||  '';
        obj.block_size  = job.block_size  ||  '';
        if (job.options) { obj.options = JSON.parse(JSON.stringify(job.options)); }
        console.log(obj);
        let json = JSON.stringify(obj);
        db_guard(json)
        .then(responseText => {
          client_table.table = JSON.parse(responseText);
          client_table.table_name = job.table;
          client_table.database_name = job.database;
          client_table.location = 'client';
          postMessage({ status: 'complete', command: 'load', table_size: client_table.table.length });
        });
      } // end else
      break;
    } // end case
    //////////////////////////////////////////////////////////////////////
    //  Category 4: Command that does not interact with tables          //
    //==================================================================//
    //  The "ping" command simply responds with a message that the      //
    //  command was received.                                           //
    //////////////////////////////////////////////////////////////////////
    case 'ping': {
      postMessage({ status: 'complete', command: 'ping' });
      break;
    } // end case
    //////////////////////////////////////////////////////////////////////
    //  Category 1: Command that can be applied to either client-       //
    //  side or server-side database tables.                            //
    //==================================================================//
    //  The "select" command functions like the MySQL "select"          //
    //  query command.  The script will implement different             //
    //  versions of this command depending on whether the table is      //
    //  client-side or server side, and depending on the specific       //
    //  structure of the table if it resides client-side.               //
    //////////////////////////////////////////////////////////////////////
    case 'select': {
      if (client_table.location === 'server') {
        let obj = Object.assign({}, job);
        obj.command   = 'select_all';
        obj.database  = client_table.database_name;
        obj.table     = client_table.table_name;
        let json = JSON.stringify(obj);
        db_guard(json)
        .then(responseText => {
          let record_array = JSON.parse(responseText);
          postMessage({ status: 'complete', command: 'select', record: record_array });
        });
      } // end if
      else {
        let record_array = [];
        switch(client_table.structure) {
          case 'none': {
            for (let i = 0; i < job.where.length; i++) {
              record_array.push(client_table.table.find((element) => {
                if (element[job.where[i].key] == job.where[i].value) {
                  if (job.column) {
                    let obj ={ };
                    for (let j = 0; j < job.column.length; j++) {
                      if (element[job.column[j].key]) { obj[job.column[j].key] = element[job.column[j].key]; }
                    } // end for loop
                    return obj;
                  } // end if
                  else { return element; }
                } // end if
              })); // end find
            } // end for loop
            postMessage({ status: 'complete', command: 'select', record: record_array });
            break;
          } // end case
          case 'auto_increment': {
            let record_array = [];
            for (let i = 0; i < job.where.length; i++) {
              let row = parseInt(job.where[i].value);
              if (job.column) {
                let obj ={ };
                for (let j = 0; j < job.column.length; j++) {
                  if (client_table.table[row]) { obj[job.column[j].key] = client_table.table[row][job.column[j].key]; }
                } // end for loop
                record_array.push(obj);
              } // end if
              else { record_array.push(client_table.table[row]); }
            } // end for loop
            postMessage({ status: 'complete', command: 'select', record: record_array });
            break;
          } // end case
          case 'tree': {
            let record_array = [];
            for (let i = 0; i < job.where.length; i++) {
              let nodeRecord = client_table.tree.search(job.where[i].value, job.where[i].key);
              if (nodeRecord) {
                if (nodeRecord.data) {
                  if (job.column) {
                    let obj ={ };
                    for (let j = 0; j < job.column.length; j++) {
                      obj[job.column[j].key] = nodeRecord.data[job.column[j].key];
                    } // end for loop
                    record_array.push(obj);
                  } // end if
                  else { record_array.push(nodeRecord.data); }
                } // end if
              } // end if
              else { record_array.push({ }); }
            } // end for loop
            postMessage({ status: 'complete', command: 'select', record: record_array });
            break;
          } // end case
            default: { break; }
        } // end switch
      } // end else
      break;
    } // end case
    case 'structure': {
      ////////////////////////////////////////////////////////////////////
      //  Category 1: Command that can be applied to either client-     //
      //  side or server-side database tables.                          //
      //================================================================//
      //  This command restructures the client-side table depending     //
      //  on the job.type parameter.  The possible types are as         //
      //  follows:                                                      //
      //      auto_increment......Re-orders the table such that the     //
      //                          array index of each record            //
      //                          corresponds to the "AUTO_INCREMENT"   //
      //                          row element specified by              //
      //                          job.column.                           //
      //      tree................Re-orders the table as a binary       //
      //                          search tree.                          //
      ////////////////////////////////////////////////////////////////////
      if (client_table.location === 'client') {
        switch(job.type) {
          case 'auto_increment': {
            if (job.column && client_table.table.length) {
              let column = job.column;
              client_table.table.sort(function(a, b) {
                if (parseInt(a[column]) < parseInt(b[column])) { return -1; }
                if (parseInt(a[column]) > parseInt(b[column])) { return  1; }
                return 0;
              }); // end sort
              for (let i = 0; i < client_table.table.length; i++) {
                let key = parseInt(client_table.table[i][column]);
                if (i < key) {
                  let obj = { };
                  obj[column] = i;
                  client_table.table.splice(i, 0, obj);
                } // end if
              } // end for loop
              client_table.structure = 'auto_increment';
            } // end if
            postMessage({ status: 'complete', command: 'structure', type: 'auto_increment' });
            break;
          } // end case
          case 'tree': {
            if (client_table.structure == 'tree') { postMessage({ status: 'complete', command: 'structure', type: 'tree' }); }
            else {
              while (client_table.table.length) {
                client_table.tree.insert(client_table.table.pop(), 'kmer');
              } // end while
              client_table.structure = 'tree';
              postMessage({ status: 'complete', command: 'structure', type: 'tree' });
            } // end else
            break;
          } // end case
          default: { break; }
        } // end switch
      } // end if
      break;
    } // end case
    //////////////////////////////////////////////////////////////////////
    //  Category 2: Command that only can be applied to client-side     //
    //  database tables.                                                //
    //==================================================================//
    //  The "transform" command will take the function supplied in      //
    //  job.transformation and apply it to all rows within the          //
    //  column(s) specified by the job.column array.  The               //
    //  appropriate table entries are then updated to represent the     //
    //  returned value of the function.  As an example, the initial     //
    //  use case for this command was to apply the SEG alogrith for     //
    //  low-complexity filtering to all protein sequences in a          //
    //  table.                                                          //
    //////////////////////////////////////////////////////////////////////
    case 'transform': {
      if (client_table.location === 'client') {
        let algorithm = undefined;
        if (!job.options) { job.options = { }; }
        if (job.transformation == 'seg') { algorithm = seg; }
        if (algorithm) {
          for (let i = 0; i < client_table.table.length; i++) {
            for (let j = 0; j < job.column.length; j++) {
              client_table.table[i][job.column[j].key] = algorithm(client_table.table[i][job.column[j].key], job.options);
              postMessage({ status: 'progress', command: 'transform', amount: 1 });
            } // end for loop
          } // end for loop
        } // end if
        postMessage({ status: 'complete', command: 'transform' });
      } // end if
      break;
    } // end case
    default: { break; }
  } // end switch
} // end function
///////////////////////////////////////////////////////////////////////////////
