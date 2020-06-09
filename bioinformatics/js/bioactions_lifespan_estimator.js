///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS LIFESPAN ESTIMATOR //////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.activate_lifespan_estimator = function() {
  this.get_ncbi_record()
  .then(() => {
    if (this.ncbi_record.genome_url) {
      this.get_genome_record()
      .then(() => {
        if (this.genome_record.percent_uploaded >= 100) {
          this.get_cds_record()
          .then(() => {
            if (this.cds_record.percent_uploaded >= 100) {
              this.actions.lifespan_estimator.status = "loading";
              this.update();
            } // end if
          }); // end then
        } // end if (this.genome_record.percent_uploaded >= 100)
      }); // end then
    } // end if (this.ncbi_record.genome_url)
  }); // end then
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_lifespan_estimator = function(options) {
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
  if (options.callback) { this.actions.lifespan_estimator.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { this.actions.lifespan_estimator.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { this.actions.lifespan_estimator.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const action = options.skin(this.actions.lifespan_estimator.id, this);
  this.actions.lifespan_estimator.skin = action;
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  let title = 'Estimate Lifespan';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  action.title.innerHTML = title;
  action.text.innerHTML = "";
  action.button.innerHTML = 'Estimate <i class="fa fa-angle-right" aria-hidden="true"></i>';
  action.button.style.display = "none";
  if (action.organism_name) { action.organism_name.innerHTML = this.organism_name; }
  if (action.common_name) {
    if (this.common_name) { action.common_name.innerHTML = "(" + this.common_name + ")"; }
  } // end if
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(action.area);
    this.html_element.lifespan_estimator = document.getElementById(options.element_id);
    this.html_element.lifespan_estimator.style.display = "block";
  } // end if
  else { document.body.appendChild(action.area); }
  $('[data-toggle="tooltip"]').tooltip();
  action.update(this.actions.lifespan_estimator);
  this.activate_lifespan_estimator();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENER ////////////////////////////////////////////////////
  action.button.addEventListener("click", function() {
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
      const options = new AlignmentOptions(NUC_2_3, self.genome_record);
      //options.seed.exact_match = false;
      options.expect_threshold_1 = 10.00;
      options.expect_threshold_2 = 0.001;
      options.seed.filter_low_complexity = true;
      options.seed.word_size = 11;
      //options.x_drop.X2_trigger = 1;
      //options.x_drop.X2 = 100;
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
                  console.log(mayne_promoter[mayne_index]);
                  if ((e.data.result[0].expect < options.expect_threshold_2) && (e.data.result[0].expect >= 0)) {
                    mayne_promoter[mayne_index].alignment = e.data.result[0];
                    console.log("Query Coverage: " + (mayne_promoter[mayne_index].alignment.query_coverage).toFixed(2) + "% ");
                    console.log("HSPs: " + e.data.result[0].hsp.length);
                    console.log("Expect: " + mayne_promoter[mayne_index].alignment.expect);
                    console.log(e.data.result[0].hsp);
                  } // end if
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
                  } // end if
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
                const cds_domain = [];
                const chosen_domain = [];
                if (e.data.record.length) {
                  // find the genome accession number and location
                  mayne_promoter[mayne_index].matched_genes = e.data.record;
                  const location = e.data.record[0].location;
                  const cds_accession = e.data.record[0].accession;
                  const cds_accession_parts = cds_accession.split("|");
                  const genome_accession_parts = cds_accession_parts[1].split("_");
                  const accession = genome_accession_parts[0] + "_" + genome_accession_parts[1];
                  const gene_map = parse_location(location);
                  mayne_promoter[mayne_index].location = gene_map;
                  if (gene_map.complement) { gene_map.end += mayne_promoter[mayne_index].sequence.length; }
                  else { gene_map.start -= mayne_promoter[mayne_index].sequence.length; }
                  get_contig_map(self.organism_name.replace(" ", "_"), accession)
                  .then(contig_map => {
                    mayne_promoter[mayne_index].contig_map = contig_map;
                    // figure out where the gene is within the contig
                    for (let i = 0; i < contig_map.length; i++) {
                      let map_hit = false;
                      if ((gene_map.start >= contig_map[i].start) && (gene_map.start <= contig_map[i].end)) { map_hit = true; } // contig_map[i] contains gene_map.start
                      if ((gene_map.end   >= contig_map[i].start) && (gene_map.end   <= contig_map[i].end)) { map_hit = true; } // contig_map[i] contains gene_map.end
                      if ((gene_map.start <= contig_map[i].start) && (gene_map.end   >= contig_map[i].end)) { map_hit = true; } // gene_map contains contig_map[i]
                      if (map_hit) { cds_domain.push(contig_map[i]); }
                    } // end for loop
                    // Get either the first or the last genome region,
                    // depending on if the gene is on the + or - strand.
                    // Also, check for the edge case where the promoter region
                    // falls between two separate records of the contig and add
                    // the next record over as well.
                    if (gene_map.complement) {
                      chosen_domain.push(cds_domain[cds_domain.length - 1]);
                      if ((gene_map.end - mayne_promoter[mayne_index].sequence.length) < cds_domain[cds_domain.length - 1].start) {
                        chosen_domain.push(cds_domain[cds_domain.length - 2]);
                      } // end if
                    } // end if
                    else {
                      chosen_domain.push(cds_domain[0]);
                      if ((gene_map.start + mayne_promoter[mayne_index].sequence.length) > cds_domain[0].end) {
                        chosen_domain.push(cds_domain[1]);
                      } // end if
                    } // end else
                    let job = { command: 'select', where: [] };
                    for (let i = 0; i < chosen_domain.length; i++) {
                      job.where.push({ key: "id", value: chosen_domain[i].id });
                      // expand the search range (this actually improves the results)
                      // TODO: update the code below to work as intended even
                      //  when more than one id is already in the array.
                      // [ Note: Current record for Chelonoidis abingdonii is
                      //  18 promoters identified. ]
                      if (gene_map.complement) {
                        job.where.push({ key: "id", value: chosen_domain[i].id + 1 });
                      } // end if
                      else {
                        job.where.push({ key: "id", value: chosen_domain[i].id - 1 });
                      } // end if
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
                  let sequence = "";
                  let subjects = [{ sequence: "" }];
                  for (let i = 0; i < records.length; i++) { console.log(records[i].defline); subjects[0].sequence += records[i].sequence.toUpperCase(); }
                  if (mayne_promoter[mayne_index].location.complement) {
                    console.log("Complement");
                    sequence = reverse_complement(mayne_promoter[mayne_index].sequence);
                  } // end if
                  else { sequence = mayne_promoter[mayne_index].sequence; }
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
        cg += (HSPs[j].subject.match(/CG/g) || []).length;
        length += HSPs[j].subject.length;
      } // end for loop
      if (mayne_promoter[i].alignment.percent_identity >= 70.00) { density = cg / length; }
      else { console.log("Percent Identity is too low!"); cg = 0; length = 0; }
    } // end if
    const weight = mayne_promoter[i].weight;
    const raw_density = weight * density;
    sum += raw_density;
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
