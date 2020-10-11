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
          this.get_genome_index_record()
          .then(() => {
            if (this.records.genome_index_record.percent_uploaded >= 100) {
              this.get_lifespan_estimator_record()
              .then(() => {
                this.states.lifespan_estimator.status = "loading";
                this.update();
              }); // end then
            } // end if (this.records.genome_index_record.percent_uploaded >= 100)
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
  state = new BioactionState("lifespan estimator", 5400); // 90 minute delay
  if (options.callback) { state.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { state.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { state.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const skin = options.skin(state.id, this, true);
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
    log_user("Task", "Started estimating lifespan for " + this.organism_name);
    skin.button.blur();
    this.save_lifespan_estimator_record();
    showSpinner();
    hide_progress_bar(true);
    hide_loading_box(true);
    const bioBlast = new blast(this.organism_name);
    this.mayne_blast(bioBlast)
    .then(() => {
      log_user("Task", "Finished estimating for " + this.organism_name);
      if (options.callback) { options.callback(this.records.lifespan_estimator_record.options.estimate, options.callback_arguments); }
    });
  }.bind(this)); // end event listener
  ////////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.get_lifespan_estimator_record = function() {
  return new Promise(function(resolve, reject) {
    let obj = { };
    obj.database   =   "moirai_db";
    obj.table      =   "mayne";
    obj.command    =   "select";
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
        if (typeof(db_record.records     ) !== 'undefined') { this.records.lifespan_estimator_record.num_uploaded           = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.year          = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.day           = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.hour          = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.minute        = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.records.lifespan_estimator_record.metadata.second        = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.records.lifespan_estimator_record.metadata.delta_second  = parseInt(db_record.delta_second); }
        if (db_record.options) { this.records.lifespan_estimator_record.options = JSON.parse(db_record.options); }
        else {
          this.records.lifespan_estimator_record.options = {
            cg: [],
            density: [],
            estimate: 0.0,
            length: [],
            percent_identity: [],
            raw_density: [],
            sequence: [],
            weight: []
          };
        } // end else
        this.records.lifespan_estimator_record.num_records = 42;
        this.records.lifespan_estimator_record.percent_uploaded = Math.floor((this.records.lifespan_estimator_record.num_uploaded / this.records.lifespan_estimator_record.num_records) * 100);
        if (typeof(this.records.lifespan_estimator_record.options.taxonomy) === "undefined") {
          get_standard_taxonomy(this.genus, this.species)
          .then((taxonomy) => {
            this.records.lifespan_estimator_record.options.taxonomy = taxonomy.class;
            if (mayne_class[taxonomy.class]) {
              this.records.lifespan_estimator_record.options.a = mayne_class[taxonomy.class].a;
              this.records.lifespan_estimator_record.options.b = mayne_class[taxonomy.class].b;
            } // end if
            else {
              this.records.lifespan_estimator_record.options.a = mayne_class["Mammalia"].a;
              this.records.lifespan_estimator_record.options.b = mayne_class["Mammalia"].b;
            } // end else
            this.save_lifespan_estimator_record()
            .then(() => {
              this.update();
              resolve();
            });
          }); // end then
        } // end if
        else { this.update(); resolve(); }
      } // end if
      else { this.update(); resolve(); }
    }); // end then
  }.bind(this)); // end Promise
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.mayne_blast = function(bioBlast) {
  return new Promise(function(resolve, reject) {
    hide_progress_bar(true);
    hide_loading_box(true);
    this.get_lifespan_estimator_record()
    .then(() => {
      if (this.records.lifespan_estimator_record.num_uploaded < 42) {
        const megablast_options = new MegaBlastOptions();
        megablast_options.culling_limit = 1;
        megablast_options.max_hsps = 1;
        console.log("Promoter: " + (this.records.lifespan_estimator_record.num_uploaded + 1) + " out of 42");
        bioBlast.megablast(mayne_promoter[this.records.lifespan_estimator_record.num_uploaded].sequence, megablast_options)
        .then(report => {
          console.log(report);
          console.log(" ");
          if (report.length) {
            if ((report[0].expect < Infinity) && report[0].hsp.length) {
              let sequence = "";
              for (let i = 0; i < report[0].hsp.length; i++) { sequence += report[0].hsp[i].subject.toUpperCase().replace(/-/g, ""); }
              let cg_array = sequence.match(/CG/g) || [];
              let cg = cg_array.length;
              let length = sequence.length;
              this.records.lifespan_estimator_record.options.percent_identity.push(report[0].percent_identity);
              if (length && (report[0].percent_identity > 70)) {
                let density = cg / length;
                const weight = mayne_promoter[this.records.lifespan_estimator_record.num_uploaded].weight;
                const raw_density = weight * density;
                this.records.lifespan_estimator_record.options.cg.push(cg);
                this.records.lifespan_estimator_record.options.density.push(density);
                this.records.lifespan_estimator_record.options.length.push(length);
                this.records.lifespan_estimator_record.options.raw_density.push(raw_density);
                this.records.lifespan_estimator_record.options.sequence.push(sequence);
                this.records.lifespan_estimator_record.options.weight.push(weight);
              } // end if (length && (report[0].percent_identity > 70))
              else {
                this.records.lifespan_estimator_record.options.cg.push(0);
                this.records.lifespan_estimator_record.options.density.push(0);
                this.records.lifespan_estimator_record.options.length.push(0);
                this.records.lifespan_estimator_record.options.raw_density.push(0);
                this.records.lifespan_estimator_record.options.sequence.push("");
                this.records.lifespan_estimator_record.options.weight.push(0);
              } // end else
            } // end if ((report[0].expect < Infinity) && report[0].hsp.length)
            else {
              this.records.lifespan_estimator_record.options.cg.push(0);
              this.records.lifespan_estimator_record.options.density.push(0);
              this.records.lifespan_estimator_record.options.length.push(0);
              this.records.lifespan_estimator_record.options.raw_density.push(0);
              this.records.lifespan_estimator_record.options.sequence.push("");
              this.records.lifespan_estimator_record.options.weight.push(0);
            } // end else
          } // end if (report.length)
          else {
            this.records.lifespan_estimator_record.options.cg.push(0);
            this.records.lifespan_estimator_record.options.density.push(0);
            this.records.lifespan_estimator_record.options.length.push(0);
            this.records.lifespan_estimator_record.options.raw_density.push(0);
            this.records.lifespan_estimator_record.options.sequence.push("");
            this.records.lifespan_estimator_record.options.weight.push(0);
          } // end else
          this.records.lifespan_estimator_record.num_uploaded++;
          this.save_lifespan_estimator_record()
          .then(() => {
            this.update();
            this.mayne_blast(bioBlast).then(resolve);
          }) // end then
          .catch(error => { setTimeout(() => { hideSpinner(); this.mayne_blast(bioBlast).then(resolve); }, 30000); });
        }) // end then
        .catch(error => { setTimeout(() => { hideSpinner(); this.mayne_blast(bioBlast).then(resolve); }, 30000); });
      } // end if
      else {
        // all blast searchers are complete
        // calculate the lifespan estimate
        let sum = 0;
        for (i = 0; i < this.records.lifespan_estimator_record.options.raw_density.length; i++) {
          sum = sum + this.records.lifespan_estimator_record.options.raw_density[i];
        } // end for loop
        sum += mayne_intercept;
        const ln_lifespan = -4.38996 + (2.57328 * sum) + (this.records.lifespan_estimator_record.options.a * sum) + this.records.lifespan_estimator_record.options.b;
        this.records.lifespan_estimator_record.options.estimate = Math.exp(1 + ln_lifespan);
        console.log("=============================");
        console.log("Lifespan estimate (in years):");
        console.log(this.records.lifespan_estimator_record.options.estimate);
        hideSpinner();
        this.save_lifespan_estimator_record().then(resolve);
      } // end else
    }) // end then
    .catch(error => { setTimeout(() => { hideSpinner(); this.mayne_blast(bioBlast).then(resolve); }, 30000); });
  }.bind(this)); // end promise
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
Bioaction.prototype.save_lifespan_estimator_record = function() {
  return new Promise(function(resolve, reject) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        if (this.responseText) { console.log(this.responseText); }
        resolve();
      } // end if
    }; // end function
    let send_message = "execute=true";
    send_message += "&command=save_lifespan_estimator_record";
    send_message += "&organism_name=" + this.organism_name;
    send_message += "&record=" + JSON.stringify(this.records.lifespan_estimator_record);
    xmlhttp.open("POST", current_base_url + "/bioinformatics/PHP/bioactions_lifespan_estimator", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }.bind(this)); // end Promise
}; // end prototype
///////////////////////////////////////////////////////////////////////////////
