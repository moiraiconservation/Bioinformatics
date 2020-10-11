///////////////////////////////////////////////////////////////////////////////
// SEQUENCE_FINDER.JS /////////////////////////////////////////////////////////
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
function GenomeFinder() {
  this._worker = new Worker(current_base_url + '/workers/js/genome_sequence_finder.js?version=' + guid());
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this._call_worker = function(command, options) {
    return new Promise(function(resolve, reject) {
      this._worker.postMessage({ command: command, options: options });
      this._worker.onmessage = function(e) {
        switch (e.data.status) {
          case "complete": {
            switch (e.data.command) {
              case "find": {
                resolve(e.data.result);
                break;
              } // end case
              case "get_sequences": {
                resolve(e.data.result);
                break;
              } // end case
              default: { break; }
            } //end switch
            break;
          } // end case
          case "progress": {
            switch (e.data.target) {
              case "progress_bar": {
                switch (e.data.action) {
                  case "create":   { create_progress_bar(e.data.text, true, e.data.amount); break; }
                  case "hide":     { hide_progress_bar(true); break; }
                  case "subtitle": { progress_bar_subtitle(e.data.text); break; }
                  case "update":   { update_progress_bar(e.data.amount); break; }
                  default: { break; }
                } // end switch
                break;
              } // end case
              default: { break; }
            } // end switch
            break;
          } // end case
          default: { break; }
        } // end switch
      }; // end onmessage
    }.bind(this)); // end promise
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.close = function() {
    this._worker.terminate();
    this._worker = undefined;
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.find = function(options) {
    return new Promise(function(resolve, reject) {
      this._call_worker("find", options)
      .then(positive => {
        let options_rc = new GenomeFinderOptions(options.organism_name);
        options_rc.kmer_size = options.kmer_size;
        options_rc.query = reverse_complement(options.query);
        this._call_worker("find", options_rc)
        .then(negative => {
          options.result = { positive: positive.result, negative: negative.result };
          resolve(options);
        }); // end then
      }); // end then
    }.bind(this)); // end promise
  } // end method
  ////////////////////////////////////////////////////////////////////////
  // METHOD //////////////////////////////////////////////////////////////
  this.get_sequences = function(options) {
    return new Promise(function(resolve, reject) {
      options.result.positive.sort(function(a, b) {
        if (a.num_kmers > b.num_kmers) { return -1; }
        if (a.num_kmers < b.num_kmers) { return  1; }
        return 0;
      }); // end sort
      options.result.negative.sort(function(a, b) {
        if (a.num_kmers > b.num_kmers) { return -1; }
        if (a.num_kmers < b.num_kmers) { return  1; }
        return 0;
      }); // end sort
      // reduce the total number of sequences to the top 64
      // to avoid overloading the server
      options.result.positive = options.result.positive.slice(0, 32);
      options.result.negative = options.result.negative.slice(0, 32);
      this._call_worker("get_sequences", options)
      .then(new_options => {
        for (let i = 0; i < new_options.result.negative.length; i++) {
          new_options.result.negative[i] = reverse_complement(new_options.result.negative[i]);
        } // end for loop
        resolve(new_options);
      }); // end then
    }.bind(this)); // end promise
  } // end method
  ////////////////////////////////////////////////////////////////////////
} // end function
///////////////////////////////////////////////////////////////////////////////
