///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS LIFESPAN_ESTIMATOR //////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_lifespan_estimator = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.records.ncbi_record.genome_url) {
      this.get_genome_record()
      .then(() => {
        if (this.records.genome_record.percent_uploaded >= 100) {
          this.get_cds_record()
          .then(() => {
            if (this.records.cds_record.percent_uploaded >= 100) {
              this.states.lifespan_estimator.status = "loading";
              this.update();
            } // end if
          }); // end then
        } // end if (this.records.genome_record.percent_uploaded >= 100)
      }); // end then
    } // end if (this.records.ncbi_record.genome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_lifespan_estimator = function(options) {
  if (typeof(options) === "undefined") { options = new BioactionOptions; }
  ////////////////////////////////////////////////////////////////////////
  // REMOVE ANY PRE-EXISTING ELEMENTS ////////////////////////////////////
  if (options.element_id) {
    let element_check = document.getElementById(options.element_id);
    if (element_check) {
      while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
      element_check.innerHTML = '';
    } // end if
    else { return; }
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // REGISTER the BIOACTION WITH PARENT OBJECT ///////////////////////////
  const registration = new BioactionRegistration("lifespan_estimator", "lifespan_estimator_record", "lifespan_estimator");
  this.add_registration(registration);
  ////////////////////////////////////////////////////////////////////////
  // CREATE THE STATE ////////////////////////////////////////////////////
  state = new BioactionState("lifespan estimator", 1800); // 30 minute delay
  if (options.callback) { state.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { state.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { state.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const skin = options.skin(state.id, this);
  state.skin = skin;
  state.update_record = this.get_lifespan_estimator_record;
  this.states.lifespan_estimator = state;
  state.skin.update(state);
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Estimate Lifespan';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  skin.title.innerHTML = title;
  skin.text.innerHTML = "";
  skin.button.innerHTML = 'Estimate <i class="fa fa-angle-right" aria-hidden="true"></i>';
  skin.button.style.display = "none";
  if (skin.organism_name) { skin.organism_name.innerHTML = this.organism_name; }
  if (skin.common_name) {
    if (this.common_name) { skin.common_name.innerHTML = "(" + this.common_name + ")"; }
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE THE ELEMENT //////////////////////////////////////////////
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(skin.area);
    this.html_elements.lifespan_estimator = document.getElementById(options.element_id);
    this.html_elements.lifespan_estimator.style.display = "block";
  } // end if
  else { document.body.appendChild(skin.area); }
  $('[data-toggle="tooltip"]').tooltip();
  skin.update(this.states.lifespan_estimator);
  this.activate_lifespan_estimator();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENER ////////////////////////////////////////////////////
  skin.button.addEventListener("click", function() {
    skin.button.blur();
    hideSpinner();
    hide_progress_bar(true);
    hide_loading_box(true);
    create_loading_box("Connecting to Databases", true);
    const alignment = new Worker(current_base_url + '/workers/js/alignment.js?version='    + guid());
    const cds_db    = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
    const genome_db = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
    this.get_genome_record()
    .then(() => {
      const self = this;
      const options = new AlignmentOptions(NUC_3_4, self.records.genome_record);
      options.score.gap_open     = 4;
      options.score.gap_extend   = 2;
      options.expect_threshold_1 = 10.00;
      options.expect_threshold_2 = 0.001;
      options.seed.filter_low_complexity = false;
      options.seed.word_size = 5;
      options.x_drop.X2_trigger = 15;
      const distance_to_promoter = 100;
      let mayne_index = 0;
      for (let i = 0; i < mayne_promoter.length; i++) {
        mayne_promoter[i].alignment = { };
        mayne_promoter[i].matched_genes = [];
      } // end for loop
      let job = { command: 'connect', database: 'cds_db', table: self.organism_name.replace(/ /g, '_') };
      cds_db.postMessage(job);
      ////////////////////////////////////////////////////////////////////
      // ALIGNMENT MESSAGES /////////////////////////////////////////////
      alignment.onmessage = function(e) {
        switch(e.data.status) {
          case 'complete': {
            switch(e.data.command) {
              case 'blast': {
                hide_loading_box(true);
                if (e.data.result.length) {
                  console.log("Promoter " + (mayne_index + 1) + " out of " + mayne_promoter.length);
                  if ((e.data.result[0].expect < options.expect_threshold_2) && (e.data.result[0].expect >= 0)) {
                    mayne_promoter[mayne_index].alignment = e.data.result[0];
                    console.log("Query Coverage: " + (mayne_promoter[mayne_index].alignment.query_coverage).toFixed(2) + "% ");
                    console.log("HSPs: " + e.data.result[0].hsp.length);
                    console.log("Expect: " + mayne_promoter[mayne_index].alignment.expect);
                    console.log(e.data.result[0].hsp);
                  } // end if
                  /*
                  else {
                    console.log("Trying something different ... ");
                    const db_source = { database: "genome_db",       table: self.organism_name.replace(/ /g, '_') };
                    const db_index  = { database: "genome_index_db", table: self.organism_name.replace(/ /g, '_') };
                    let job = {
                      command:    "alignment_free_sequence_selection",
                      query:      reverse_complement(mayne_promoter[mayne_index].sequence),
                      db_source:  db_source,
                      db_index:   db_index,
                      options:    options
                    }; // end object
                    alignment.postMessage(job);
                    console.log(dfghj.fghj);
                  } // end else
                  */
                  console.log(" ");
                } // end if
                mayne_index++;
                if (mayne_index < mayne_promoter.length) {
                  create_loading_box("Finding Next Promoter", true);
                  let job = { command: 'select', where: [{ key: "gene", value: mayne_promoter[mayne_index].gene_name }] };
                  cds_db.postMessage(job);
                } // end if
                else { calculate_lifespan(self); }
                break;
              } // end case
              default: { break; }
            } // end switch
            break;
          } // end case
          default: { break; }
        } // end switch
      } // end function
      ////////////////////////////////////////////////////////////////////
      // CDS MESSAGES ////////////////////////////////////////////////////
      cds_db.onmessage = function(e) {
        switch(e.data.status) {
          case 'complete': {
            switch(e.data.command) {
              case 'connect': {
                loading_box_text("Connecting to Genome Database");
                job = { command: 'connect', database: 'genome_db', table: self.organism_name.replace(/ /g, '_') };
                genome_db.postMessage(job);
                break;
              } // end case
              case 'select': {
                loading_box_text("Finding Promoter Region of Genome");
                const accession = [];
                const gene_domain = [];
                const gene_map = { start: 0, end: 0 };;
                if (e.data.record.length) {
                  // find the genome accession number and location
                  mayne_promoter[mayne_index].matched_genes = e.data.record;
                  for (let i = 0; i < e.data.record.length; i++) {
                    let location = e.data.record[i].location;
                    let cds_accession = e.data.record[i].accession;
                    let cds_accession_parts = cds_accession.split("|");
                    let genome_accession_parts = cds_accession_parts[1].split("_");
                    accession.push(genome_accession_parts[0] + "_" + genome_accession_parts[1]);
                    gene_domain.push(parse_location(location));
                  } // end if
                  // Find the first start location and the last end location
                  // for all the isoforms of the gene
                  let lowest_start = Infinity;
                  let highest_end  = -Infinity;
                  for (let i = 0; i < gene_domain.length; i++) {
                    if (gene_domain[i].start < lowest_start) { lowest_start = gene_domain[i].start; }
                    if (gene_domain[i].end > highest_end) { highest_end = gene_domain[i].end; }
                  } // end for loop
                  gene_map.start = lowest_start;
                  gene_map.end   = highest_end;
                  // Let's take a completely agnostic approach to dealing with
                  // the possible plus/minus locations of the promoter and
                  // simply expand our predicted gene location in BOTH
                  // directions by a distance equal to the length of the
                  // promoter.
                  gene_map.end += (mayne_promoter[mayne_index].sequence.length + distance_to_promoter);
                  gene_map.start -= (mayne_promoter[mayne_index].sequence.length + distance_to_promoter);
                  mayne_promoter[mayne_index].location = gene_map;
                  get_contig_map(self.organism_name.replace(" ", "_"), accession)
                  .then(contig_map => {
                    mayne_promoter[mayne_index].contig_map = contig_map;
                    // figure out where the gene is within the contig
                    let job = { command: 'select', where: [] };
                    for (let i = 0; i < contig_map.length; i++) {
                      let chosen_domain = [];
                      for (let j = 0; j < contig_map[i].length; j++) {
                        let map_hit = false;
                        if ((gene_map.start >= contig_map[i][j].start) && (gene_map.start <= contig_map[i][j].end)) { map_hit = true; } // contig_map[i] contains gene_map.start
                        if ((gene_map.end   >= contig_map[i][j].start) && (gene_map.end   <= contig_map[i][j].end)) { map_hit = true; } // contig_map[i] contains gene_map.end
                        if ((gene_map.start <= contig_map[i][j].start) && (gene_map.end   >= contig_map[i][j].end)) { map_hit = true; } // gene_map contains contig_map[i]
                        if (map_hit) { chosen_domain.push(contig_map[i][j]); }
                      } // end for loop
                      if (chosen_domain.length > 1) { job.where.push({ key: "id", value: chosen_domain[(chosen_domain.length - 1)].id }); }
                      job.where.push({ key: "id", value: chosen_domain[0].id });
                    } // end for loop
                    mayne_promoter[mayne_index].job = job;
                    genome_db.postMessage(job);
                  }); // end then
                } // end if (e.data.record.length)
                else {
                  mayne_index++;
                  if (mayne_index < mayne_promoter.length) {
                    create_loading_box("Finding Next Promoter", true);
                    let job = { command: 'select', where: [{ key: "gene", value: mayne_promoter[mayne_index].gene_name }] };
                    cds_db.postMessage(job);
                  } // end if
                } // end if
              } // end case
              default: { break; }
            } // end switch
            break;
          } // end case
          default: { break; }
        } // end switch
      } // end function
      ////////////////////////////////////////////////////////////////////
      // GENOME MESSAGES /////////////////////////////////////////////////
      genome_db.onmessage = function(e) {
        switch(e.data.status) {
          case 'complete': {
            switch(e.data.command) {
              case 'connect': {
                let job = { command: 'select', where: [{ key: "gene", value: mayne_promoter[mayne_index].gene_name }] };
                cds_db.postMessage(job);
                break;
              } // end case
              case 'select': {
                if (e.data.record.length) {
                  loading_box_text("Performing BLAST Search for Promoter " + (mayne_index + 1) + " of " + (mayne_promoter.length));
                  let records = JSON.parse(JSON.stringify(e.data.record));
                  records.sort(function(a, b) {
                    if (parseFloat(a.id) < parseFloat(b.id)) { return -1; }
                    else { return 1; }
                  }); // end sort
                  let sequence = mayne_promoter[mayne_index].sequence;
                  let subjects = [{ sequence: "" }];
                  for (let i = 0; i < records.length; i++) { subjects[0].sequence += records[i].sequence.toUpperCase(); }
                  // As part of our entirely agnostic approach to the possible
                  // plus/minus locations for the promoter, we're concatenating
                  // the reverse complement to our initial subject sequence.
                  subjects[0].sequence += reverse_complement(subjects[0].sequence);
                  options.search_space.num_characters = subjects[0].sequence.length;
                  options.search_space.num_sequences = 1;
                  job = { status: 'command', command: 'blast', query: sequence, subject: subjects, options: options };
                  alignment.postMessage(job);
                } // end if
                break;
              } // end case
              default: { break; }
            } // end switch
            break;
          } // end case
          default: { break; }
        } // end switch
      } // end function
      ////////////////////////////////////////////////////////////////////
    }); // end then
    //////////////////////////////////////////////////////////////////////
  }.bind(this));
  ////////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// FUNCTION ///////////////////////////////////////////////////////////////////
function calculate_lifespan(self) {
  loading_box_text("Calculating Lifespan");
  let sum = 0;
  for (let i = 0; i < mayne_promoter.length; i++) {
    let cg = 0;
    let density = 0;
    let length = 0;
    var HSPs;
    if (mayne_promoter[i].alignment.expect) {
      if (mayne_promoter[i].alignment.linked_hsp.length) {
        HSPs = mayne_promoter[i].alignment.linked_hsp
      } // end if
      else { HSPs = mayne_promoter[i].alignment.hsp; }
      for (let j = 0; j < HSPs.length; j++) {
        HSPs[j].subject = HSPs[j].subject.toUpperCase();
        HSPs[j].subject = HSPs[j].subject.replace(/-/g, "");
        cg += (HSPs[j].subject.match(/CG/g) || []).length;
        length += HSPs[j].subject.length;
      } // end for loop
      if (mayne_promoter[i].alignment.percent_identity >= 70.00) { density = cg / length; }
      else { console.log("Percent Identity is too low!"); cg = 0; length = 0; }
    } // end if
    const weight = mayne_promoter[i].weight;
    const raw_density = weight * density;
    sum += raw_density;
    console.log("Promoter " + (i + 1) + " out of " + mayne_promoter.length);
    console.log("Gene: " + mayne_promoter[i].gene_name);
    console.log("Weight: " + mayne_promoter[i].weight);
    console.log("# CGs: " + cg);
    console.log("Length: " + length);
    console.log("Density: " + density);
    if (mayne_promoter[i].alignment.linked_hsp) {
      if (mayne_promoter[i].alignment.linked_hsp.length) {
        console.log("Using linked HSPs");
      } // end if
    } // end if
    console.log(" ");
  } // end for loop
  sum += mayne_intercept;
  get_standard_taxonomy(self.genus, self.species)
  .then((taxonomy) => {
    let a = -0.92888; // set default to Mammalia
    let b = 2.33508;  // set default to Mammalia
    if (mayne_class[taxonomy.class]) {
      a = mayne_class[taxonomy.class].a;
      b = mayne_class[taxonomy.class].b;
    } // end if
    const ln_lifespan = -4.38996 + (2.57328 * sum) + (a * sum) + b;
    const lifespan = Math.exp(ln_lifespan);
    console.log("================================");
    console.log("Predicted Lifespan: " + lifespan);
    self.actions.lifespan_estimator.percent_complete = 100;
    self.actions.lifespan_estimator.skin.update(self.actions.lifespan_estimator);
    if (self.actions.lifespan_estimator.callback) {
      if (self.actions.lifespan_estimator.callback_arguments) {
        self.actions.lifespan_estimator.callback(lifespan, ...self.actions.lifespan_estimator.callback_arguments);
      } // end if
      else { self.actions.lifespan_estimator.callback(lifespan); }
    } // end if
    hide_loading_box(true);
    //age_estimate_to_db(fg);
  }); // end then
} // end function
////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_lifespan_estimator_record = function() {
  return new Promise(function(resolve, reject) {
    let obj = { };
    obj.database   =   'moirai_db';
    obj.table      =   'mayne';
    obj.command    =   'select';
    obj.where      =   [ { key: "organism_name", value: this.organism_name } ];
    let json = JSON.stringify(obj);
    db_guard(json)
    .then(responseText => {
      if (responseText) {
        if (this.records.lifespan_estimator_record) { delete this.records.lifespan_estimator_record; }
        this.records.lifespan_estimator_record = new BioactionRecord;
        this.records.lifespan_estimator_record.estimate = 0.00;
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.estimate    ) !== 'undefined') { this.records.lifespan_estimator_record.estimate               = parseFloat(db_record.estimate); }
        if (typeof(db_record.owner       ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.owner         = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.records.lifespan_estimator_record.num_records            = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.year          = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.day           = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.hour          = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.minute        = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.second        = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.records.lifespan_estimator_record.metadata.delta_second  = parseInt(db_record.delta_second); }
        if (db_record.options) { this.records.lifespan_estimator_record.options = JSON.parse(db_record.options); }
        if (this.records.lifespan_estimator_record.num_records) {
          this.records.lifespan_estimator_record.num_uploaded = this.records.lifespan_estimator_record.num_records;
          this.records.lifespan_estimator_record.percent_uploaded = 100;
        } // end if
      } // end if
    })
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
