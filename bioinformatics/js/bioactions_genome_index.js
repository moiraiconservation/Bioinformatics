///////////////////////////////////////////////////////////////////////////////
// BIOACTION genome_index ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_genome_index = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.ncbi_record.genome_url) {
      this.get_genome_record()
      .then(() => {
        if (this.genome_record.percent_uploaded >= 100) {
          this.get_genome_index_record()
          .then(() => {
            this.actions.genome_index.status = "loading";
            this.update();
          });
        } // end if
      }); // end then
    } // end if (this.ncbi_record.genome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_genome_index = function(options) {
  if (typeof(options) === "undefined") { options = new BioactionOptions; }
  if (options.element_id) {
    let element_check = document.getElementById(options.element_id);
    if (element_check) {
      while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
      element_check.innerHTML = '';
    } // end if
    else { return; }
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // REGISTER VARIABLES WITH PARENT OBJECT ///////////////////////////////
  if (options.callback) { this.actions.genome_index.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { this.actions.genome_index.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { this.actions.genome_index.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const action = options.skin(this.actions.genome_index.id, this);
  this.actions.genome_index.skin = action;
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Index Genome';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  action.title.innerHTML = title;
  action.text.innerHTML = "Before genomes can be searched for sequence similarities, each genome must be indexed for ease of use.  This process looks for kmers (short nucleotide sequences) of length 8 and records their place in the genome.  This length is shorter than is often used in bioinformatic techniques (often a length of 11 nucleotides is used).  This shorter length was chosen to keep the total database table creation time acceptably short.  To compensate for the shorter kmer size, the upper half of the kmer distribution (the more frequently-found kmers) is discarded."
  action.button.innerHTML = 'Index <i class="fa fa-angle-right" aria-hidden="true"></i>';
  action.button.style.display = "none";
  if (action.organism_name) { action.organism_name.innerHTML = this.organism_name; }
  if (action.common_name) {
    if (this.common_name) { action.common_name.innerHTML = "(" + this.common_name+ ")"; }
  } // end if
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(action.area);
    this.html_element.genome_index = document.getElementById(options.element_id);
    this.html_element.genome_index.style.display = "block";
  } // end if
  else { document.body.appendChild(action.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.activate_genome_index();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  action.button.addEventListener("click", function() {
    action.button.blur();
    this.genome_index_record.metadata.delta_second = 1;
    hide_loading_box(true);
    create_loading_box("Updating records", true);
    let obj = { };
    let metaObj = { };
    let bioWorker = new Worker(current_base_url + '/workers/js/genome_index.js?version=' + guid());
    try {
      metaObj.command     = "update_metadata";
      metaObj.database    = "genome_index_db";
      metaObj.table       = this.organism_name.replace(/ /g, "_");
      metaObj.num_records = 65536;
      metaObj.status      = "success";
      update_metadata(metaObj)
      .then(() => {
        this.update();
        hide_loading_box(true);
        create_loading_box("Finding records", true);
        obj = { };
        obj.database   =    "genome_index_db";
        obj.table      =    "table_metadata";
        obj.command    =    "select";
        obj.where      =    [ { key: "id", value: this.organism_name.replace(/ /g, "_") } ];
        let json       =    JSON.stringify(obj);
        db_guard(json)
        .then(responseText => {
          hide_loading_box(true);
          create_loading_box("Finding records", true);
          if (responseText) {
            let record = JSON.parse(responseText);
            this.genome_index_record.num_records = record.records;
            obj = { };
            obj.database        =   'genome_db';
            obj.table           =   this.organism_name.replace(/ /g, '_');
            obj.command         =   "count";
            db_guard(JSON.stringify(obj))
            .then(responseText => {
              let response = JSON.parse(responseText);
              obj.limit = parseInt(response['COUNT(*)']);
              obj.database        =   'genome_db';
              obj.table           =   this.organism_name.replace(/ /g, '_');
              obj.command         =   "select_all";
              obj.columns         =   [ { key: "id" }, { key: "sequence" } ];
              obj.block_size      =   50;
              obj.options         =   { };
              obj.options.progress_bar    =   true;
              obj.options.delete          =   true;
              obj.options.worker          =   true;
              let json = JSON.stringify(obj);
              db_guard(json, bioWorker)
              .then(responseText => {
                hide_loading_box(true);
                hide_progress_bar(true);
              }); // end then
            });
          } // end if
        }); // end then
      }); // end then
    } // end try
    catch(err) { hide_loading_box(true); console.log("Error!"); return; }
  }.bind(this)); // end event listener
  //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_gene_map = function(element_id, callback, note) {
  if (element_id) {
    let element_check = document.getElementById(element_id);
    if (element_check) {
      while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
      element_check.innerHTML = '';
    } // end if
    else { return; }
  } // end if
  else { element_id = false; }
  if (callback) { this.actions.gene_map.callback = callback; }
  let action = this.default_skin(this.actions.gene_map.id, this);
  this.actions.gene_map.skin = action;
  let title = 'Map Genes';
  if (note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  action.title.innerHTML = title;
  action.text.innerHTML = "Before protein records can be searched for sequence similarities, the protein records must be indexed for ease of use.  ";
  action.text.innerHTML += "This process looks for kmers (short amino acid sequences) of length 4 and records the ID of the protein sequence in which they were found.  ";
  action.text.innerHTML += "If the browser tab or window is closed after the indexing process has started, any progress will be saved and the process can be resumed from this page.";
  action.button.innerHTML = "Map";
  action.button.style.display = "none";
  action.status.innerHTML = '<div class="loading"><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div></div>';
  let tooltip = { };
  tooltip.cache = "This is an option to cache the relevant database tables prior to mapping gene.  When this option is turned on, a sizable amount of information will be downloaded to your computer at the beginning of the process.  Caching sometimes speeds the overall mapping process on computers with a slower Internet connection.  However, caching may cause the browser to crash or become unresponsive if runtime memory is limited.";
  let option_area = '';
  option_area += '<div id="slider-text">';
  option_area += '<div class="center">';
  option_area += '<p class="standard-text">Cache <i class="fa fa-question-circle color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + tooltip.cache + '"></i></p>';
  option_area += '</div>'; // end center
  option_area += '</div>'; // end slider-text
  option_area += '<div class="center">';
  option_area += '<label class="switch">';
  option_area += '<input type="checkbox" id="slider-checkbox-' + this.actions.gene_map.id + '-' + this.id + '" value="1">';
  option_area += '<span class="slider round"></span>';
  option_area += '</label>';
  option_area += '</div>'; // end center
  option_area += '<div class="center">';
  option_area += '<div id="slider-subtitle">';
  option_area += '</div>'; // end slider-subtitle
  option_area += '</div>'; // end center
  action.option.innerHTML = option_area;
  action.option.style.display = "block";
  if (element_id) {
    document.getElementById(element_id).appendChild(action.area);
    this.html_element.gene_map = document.getElementById(element_id);
    this.html_element.gene_map.style.display = "block";
  } // end if
  else { document.body.appendChild(action.area); }
  $('[data-toggle="tooltip"]').tooltip();
  this.get_gene_map_record();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  action.button.addEventListener("click", function() {
    action.button.blur();
    this.gene_map_record.metadata.delta_second = 1;
    hide_loading_box(true);
    create_loading_box("Updating records", true);
    //////////////////////////////////////////////////////////////////
    // FUNCTION OPTIONS //////////////////////////////////////////////
    let gene_map_options = { };
    gene_map_options.cache = 0;
    let element_check = document.getElementById('slider-checkbox-' + this.actions.gene_map.id + '-' + this.id);
    if (element_check) { gene_map_options.cache = element_check.checked; }
    //////////////////////////////////////////////////////////////////
    let current_id      =   1;
    let current_defline =   '';
    var alphabet        =   4;
    var kmer_size       =   8;
    var distribution    =   new Array(this.genome_record.num_records + 1);
    let total_kmers     =   0;
    let kmers_received  =   0;
    let obj             =   { };
    let metaObj         =   { };
    let organism        =   { };
    organism.name           =   this.organism_name;
    organism.ncbi_record    =   this.ncbi_record;
    organism.proteome_record =   this.proteome_record;
    organism.genome_record  =   this.genome_record;
    organism.mrca_proteome  =   this.mrca_proteome;
    let proteome_db = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
    let genome_db   = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
    let genome_index_db   = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
    let alignment   = new Worker(current_base_url + '/workers/js/alignment.js?version='    + guid());
    metaObj.command     = "update_metadata";
    metaObj.database    = "gene_map_db";
    metaObj.table       = this.organism_name.replace(/ /g, "_");
    metaObj.num_records = this.mrca_proteome.proteome_record.num_records ? this.mrca_proteome.proteome_record.num_records : this.proteome_record.num_records;
    metaObj.status      = "success";
    update_metadata(metaObj)
    .then(() => { this.update(); });
    hide_loading_box(true);
    hide_progress_bar(true);
    if (gene_map_options.cache) {
      hide_loading_box(true);
      hide_progress_bar(true);
      create_loading_box("Loading Proteins", true);
      let job = { command: 'load', database: 'proteome_db', table: this.mrca_proteome.organism_name.replace(/ /g, '_'), limit: this.mrca_proteome.proteome_record.num_records, progress_bar: true };
      proteome_db.postMessage(job);
    } // end if
    else {
      hide_loading_box(true);
      hide_progress_bar(true);
      create_loading_box("Connecting to Databases", true);
      job = { command: 'connect', database: 'proteome_db', table: this.mrca_proteome.organism_name.replace(/ /g, '_') };
      proteome_db.postMessage(job);
    } // end else
    //////////////////////////////////////////////////////////////////
    // PROTEOME_DB MESSAGES //////////////////////////////////////////
    proteome_db.onmessage = function(e) {
      switch(e.data.status) {
        case 'complete': {
          switch(e.data.command) {
            case 'connect': {
              let job = { command: 'connect', database: 'genome_db', table: organism.name.replace(/ /g, '_') };
              genome_db.postMessage(job);
              break;
            } // end case 'connect'
            case 'load': {
              let job = { command: 'structure', type: 'auto_increment', column: 'id' };
              proteome_db.postMessage(job);
              break;
            } // end case 'load'
            case 'structure': {
              hide_loading_box(true);
              hide_progress_bar(true);
              create_loading_box("Loading Genome", true);
              let job = { command: 'load', database: 'genome_db', table: organism.name.replace(/ /g, '_'), limit: organism.genome_record.num_records, block_size: 50, progress_bar: true };
              genome_db.postMessage(job);
              break;
            } // end case 'structure'
            case 'select': {
              current_defline = e.data.record[0].defline;
              let protein = e.data.record[0].sequence;
              let dna = reverse_translate(protein, reverse_codon_vert)
              total_kmers = dna[0].length - kmer_size;
              kmers_received = 0;
              create_progress_bar("Finding Kmers", true, total_kmers);
              for (let i = 0; i < distribution.length; i++) { distribution[i] = 0; }
              for (let j = kmer_size; j <= dna[0].length; j++) {
                let kmer = dna[0].substring(j - kmer_size, j);
                let expanded_kmers = decompress_dna(kmer);
                let job = { command: 'select', where: [] };
                for (let k = 0; k < expanded_kmers.length; k++) {
                  job.where.push({ key: 'kmer', value: expanded_kmers[k] });
                } // end for loop
                genome_index_db.postMessage(job);
              } // end for loop
              break;
            } // end case 'select'
            default: { break; }
          } // end switch (e.data.command)
          break;
        } // end case 'complete'
        default: { break; }
      } // end switch (e.data.status)
    } // end onmessage
    //////////////////////////////////////////////////////////////////
    // GENOME_DB MESSAGES ////////////////////////////////////////////
    genome_db.onmessage = function(e) {
      switch(e.data.status) {
        case 'complete': {
          switch(e.data.command) {
            case 'connect': {
              let job = { command: 'connect', database: 'genome_index_db', table: organism.name.replace(/ /g, '_') };
              genome_index_db.postMessage(job);
              break;
            } // end case 'connect'
            case 'load': {
              let job = { command: 'structure', type: 'auto_increment', column: 'id' };
              genome_db.postMessage(job);
              break;
            } // end case 'load'
            case 'structure': {
              hide_loading_box(true);
              hide_progress_bar(true);
              create_loading_box("Loading Genome Index", true);
              let job = { command: 'load', database: 'genome_index_db', table: organism.name.replace(/ /g, '_'), limit: organism.genome_index_record.num_records, block_size: 50, progress_bar: true };
              genome_index_db.postMessage(job);
              break;
            } // end case 'structure'
            default: { break; }
          } // end switch (e.data.command)
          break;
        } // end case 'complete'
        default: { break; }
      } // end switch (e.data.status)
    } // end onmessage
    //////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////
    // genome_index_db MESSAGES ////////////////////////////////////////////
    genome_index_db.onmessage = function(e) {
      switch(e.data.status) {
        case 'complete': {
          switch(e.data.command) {
            case 'connect': {
              hide_loading_box(true);
              hide_progress_bar(true);
              let job = { command: 'select', where: [{ key: 'id', value: current_id }] };
              proteome_db.postMessage(job);
              break;
            } // end case 'connect'
            case 'load': {
              hide_loading_box(true);
              hide_progress_bar(true);
              create_loading_box("Organizing Genome indices");
              let job = { command: 'structure', type: 'tree', column: 'kmer' };
              genome_index_db.postMessage(job);
              break;
            } // end case 'load'
            case 'structure': {
              hide_loading_box(true);
              hide_progress_bar(true);
              let job = { command: 'select', where: [{ key: 'id', value: current_id }] };
              proteome_db.postMessage(job);
              break;
            } // end case 'structure'
            case 'select': {
              let index_array = e.data.record;
              for (let i = 0; i < index_array.length; i++) {
                let raw_indices = index_array[i].sequences;
                if (raw_indices !== "") {
                  let indices = raw_indices.split(',');
                  for (let j = 0; j < indices.length; j++) {
                    distribution[indices[j]]++;
                  } // end for loop
                } // end if
              } // end for loop
              update_progress_bar(1);
              progress_bar_subtitle(kmers_received + " out of " + total_kmers);
              if (kmers_received >= total_kmers) {
                let stats = new STATS();
                stats.load(distribution);
                let desc = stats.description();
                let modal_text = '';
                modal_text += '<div class="desktop-site">';
                modal_text += '<div class="center"><p class="standard-text"><b>Kmer Density Histogram</b></p></div>';
                modal_text += '<div id="histogram"></div>';
                modal_text += '</div>'; // end desktop-site
                modal_text += '<div id="histogram-statistics">';
                modal_text += '<p><b>Number of DNA Records:</b> ' + desc.n  + '</p>';
                modal_text += '<p><b>Descriptive Statistics</b></p>';
                modal_text += '<details>';
                modal_text += '<summary>';
                modal_text += '</summary>';
                modal_text += '<blockquote>';
                modal_text += '<p class="standard-text">';
                modal_text += '<b>Protein Lengths</b>';
                modal_text += '</p>';
                modal_text += '<p class="standard-text">';
                modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.mode + '"></span>  ';
                modal_text += '<b>Mode:</b> ';
                modal_text += desc.mode.toString().replace(/,/g, ', ');
                modal_text += '</p>';
                modal_text += '<p class="standard-text">';
                modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.median + '"></span>  ';
                modal_text += '<b>Median:</b> ';
                modal_text += desc.median;
                modal_text += '</p>';
                modal_text += '<p class="standard-text">';
                modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.mean + '"></span>  ';
                modal_text += '<b>Mean:</b> ';
                modal_text += desc.mean.toFixed(2);
                modal_text += '</p>';
                modal_text += '<p class="standard-text">';
                modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.min + '"></span>  ';
                modal_text += '<b>Minimum:</b> ';
                modal_text += desc.min;
                modal_text += '</p>';
                modal_text += '<p class="standard-text">';
                modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.max + '"></span>  ';
                modal_text += '<b>Maximum:</b> ';
                modal_text += desc.max;
                modal_text += '</p>';
                if (desc.quartile.q1) {
                  modal_text += '<p class="standard-text">';
                  modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.quartile + '"></span>  ';
                  modal_text += '<b>1st Quartile:</b> ';
                  modal_text += desc.quartile.q1;
                  modal_text += '</p>';
                } // end if
                if (desc.quartile.q3) {
                  modal_text += '<p class="standard-text">';
                  modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.quartile + '"></span>  ';
                  modal_text += '<b>3rd Quartile:</b> ';
                  modal_text += desc.quartile.q3;
                  modal_text += '</p>';
                } // end if
                if (desc.quartile.iqr) {
                  modal_text += '<p class="standard-text">';
                  modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.iqr + '"></span>  ';
                  modal_text += '<b>Interquartile Range:</b> ';
                  modal_text += desc.quartile.iqr;
                  modal_text += '</p>';
                } // end if
                if (desc.stdev) {
                  modal_text += '<p class="standard-text">';
                  modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.stdev + '"></span>  ';
                  modal_text += '<b>Standard Deviation:</b> ';
                  modal_text += desc.stdev.toFixed(2);
                  modal_text += '</p>';
                } // end if
                modal_text += '<p class="standard-text">';
                modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.mad + '"></span>  ';
                modal_text += '<b>Median Absolute Deviation:</b> ';
                modal_text += desc.mad.toFixed(2);
                modal_text += '</p>';
                if (desc.skew) {
                  modal_text += '<p class="standard-text">';
                  modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.skew + '"></span>  ';
                  modal_text += '<b>Skew:</b> ';
                  modal_text += desc.skew.skew.toFixed(2);
                  modal_text += '</p>';
                  modal_text += '<p class="standard-text">';
                  modal_text += desc.skew.description;
                  modal_text += '</p>';
                } // end if
                if (desc.kurtosis) {
                  modal_text += '<p class="standard-text">';
                  modal_text += '<span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + stats.tooltip.kurtosis + '"></span>  ';
                  modal_text += '<b>Kurtosis:</b> ';
                  modal_text += desc.kurtosis.kurtosis.toFixed(2);
                  modal_text += '</p>';
                  modal_text += '<p class="standard-text">';
                  modal_text += desc.kurtosis.description;
                  modal_text += '</p>';
                } // end if
                modal_text += '</blockquote>';
                modal_text += '</details>';
                modal_text += '</div>'; // end histigram-statistics
                hide_loading_box(true);
                create_modal(modal_text);
                let histogram_options = { };
                histogram_options.x_label = "Number of Matched Kmers";
                histogram_options.y_label = "Number of DNA Records";
                bar_distribution = [];
                for (let i = 0; i < distribution.length; i++) {
                  let new_aa_record = { };
                  new_aa_record.amino_acid = i;
                  new_aa_record.count = ((distribution[i] - desc.mean) / desc.stdev).toFixed(2);
                  new_aa_record.name = i;
                  bar_distribution.push(new_aa_record);
                } // end for loop
                //d3_histogram(distribution, 'histogram', histogram_options);
                d3_bar_graph(bar_distribution, 'histogram', histogram_options)
                $('[data-toggle="tooltip"]').tooltip();
                let max_record = 0;
                let max_number = 0;
                for (let i = 0; i < distribution.length; i++) {
                  if (distribution[i] > max_number) { max_number = distribution[i]; max_record = i; }
                } // end for loop
                console.log("-5: " + distribution[max_record - 5] + "(z score: " + ((distribution[max_record - 5] - 1517.93) / 420.33) + ")");
                console.log("-4: " + distribution[max_record - 4] + "(z score: " + ((distribution[max_record - 4] - 1517.93) / 420.33) + ")");
                console.log("-3: " + distribution[max_record - 3] + "(z score: " + ((distribution[max_record - 3] - 1517.93) / 420.33) + ")");
                console.log("-2: " + distribution[max_record - 2] + "(z score: " + ((distribution[max_record - 2] - 1517.93) / 420.33) + ")");
                console.log("-1: " + distribution[max_record - 1] + "(z score: " + ((distribution[max_record - 1] - 1517.93) / 420.33) + ")");
                console.log("    " + distribution[max_record    ] + "(z score: " + ((distribution[max_record    ] - 1517.93) / 420.33) + ")");
                console.log("+1: " + distribution[max_record + 1] + "(z score: " + ((distribution[max_record + 1] - 1517.93) / 420.33) + ")");
                console.log("+2: " + distribution[max_record + 2] + "(z score: " + ((distribution[max_record + 2] - 1517.93) / 420.33) + ")");
                console.log("+3: " + distribution[max_record + 3] + "(z score: " + ((distribution[max_record + 3] - 1517.93) / 420.33) + ")");
                console.log("+4: " + distribution[max_record + 4] + "(z score: " + ((distribution[max_record + 4] - 1517.93) / 420.33) + ")");
                console.log("+5: " + distribution[max_record + 5] + "(z score: " + ((distribution[max_record + 5] - 1517.93) / 420.33) + ")");
              } // end if
              else { kmers_received++; }
              break;
            } // end case
            default: { break; }
          } // end switch (e.data.command)
          break;
        } // end case 'complete'
        default: { break; }
      } // end switch (e.data.status)
    } // end onmessage
    //////////////////////////////////////////////////////////////////
  }.bind(this)); // end event listener
  //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
