///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS STATISTICS //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_proteome_statistics = function(options) {
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
  const registration = new BioactionRegistration("proteome_statistics", undefined, "proteome_statistics");
  this.add_registration(registration);
  ////////////////////////////////////////////////////////////////////////
  // CREATE THE STATE ////////////////////////////////////////////////////
  state = new BioactionState("proteome statistics", 0);
  if (options.callback) { state.callback = options.callback; }
  if (options.callback_arguments && options.callback_arguments.length) { state.callback_arguments = options.callback_arguments; }
  if (options.initial_status) { state.status = options.initial_status; }
  if (!options.skin) { options.skin = this.default_skin; }
  const skin = options.skin(state.id, this);
  state.skin = skin;
  state.update_record = function() { };
  this.states.proteome_statistics = state;
  state.skin.update(state);
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE SKIN ELEMENTS ////////////////////////////////////////////
  skin.tile.style.border = "transparent";
  skin.tile.style.borderTop = "1px solid " + theme['base']['dark'];
  skin.tile.style.backgroundColor = "transparent";
  skin.tile.style.boxShadow = "none";
  skin.tile.style.webkitBoxShadow = "none";
  skin.tile.style.mozBoxShadow = "none";
  skin.lock.style.display = "none";
  skin.lock_bar.style.display = "none";
  skin.lock_text.style.display = "none";
  skin.status.style.display = "none";
  skin.text.style.display = "block";
  let title = 'Protein Statistics';
  if (options.note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  skin.title.innerHTML = title;
  skin.text.innerHTML = "For all proteins contained within the table (either all proteins, or those proteins matching the search term):  This action calculates and displays the distribution of protein sequence lengths for the organism, as well as the relevant descriptive statistics.  The total abundance of all amino acids found within the proteins is also calculated and displayed.";
  skin.button.innerHTML = "Calculate";
  ////////////////////////////////////////////////////////////////////////
  // INITIALIZE THE ELEMENT //////////////////////////////////////////////
  if (options.element_id) {
    document.getElementById(options.element_id).appendChild(skin.area);
    this.html_elements.proteome_import = document.getElementById(options.element_id);
    this.html_elements.proteome_import.style.display = "block";
  } // end if
  else { document.body.appendChild(skin.area); }
  let tooltip = { };
  tooltip.filter = "Disregard proteins from the statistical analysis that are labeled as either hypothetical, low quality, or partial.";
  let option = '';
  option += '<div id="slider-text">';
  option += '<div class="center">';
  option += '<p class="standard-text">Filter <i class="fa fa-question-circle color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + tooltip.filter + '"></i></p>';
  option += '</div>'; // end center
  option += '</div>'; // end slider-text
  option += '<div class="center">';
  option += '<label class="switch">';
  option += '<input type="checkbox" id="slider-checkbox-' + state.id + '-' + this.id + '" value="1">';
  option += '<span class="slider slider-on-off round"></span>';
  option += '</label>';
  option += '</div>'; // end center
  option += '<div class="center">';
  option += '<div id="slider-subtitle">';
  option += '</div>'; // end slider-subtitle
  option += '</div>'; // end center
  skin.option.innerHTML = option;
  $('[data-toggle="tooltip"]').tooltip();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  skin.button.addEventListener("click", function() {
    skin.button.blur();
    let filter = false;
    let element_check = document.getElementById('slider-checkbox-' + state.id + '-' + this.id);
    if (element_check) { filter = element_check.checked; }
    let obj = { };
    obj.database  = 'proteome_db';
    obj.table     = this.organism_name.replace(/ /g, '_');
    obj.command   = "select_all";
    obj.columns   = [ { key: "defline" }, { key: "sequence" } ];
    obj.limit     = this.records.proteome_record.num_records;
    if (options.list) {
      if (options.list.length < this.records.proteome_record.num_records) {
        obj.where = [];
        for (let i = 0; i < options.list.length; i++) {
          obj.where.push({ key: "id", value: options.list[i].id });
        } // end for loop
        obj.limit = options.list.length;
      } // end if
    } // end if
    let json = JSON.stringify(obj);
    create_loading_box(this.loading_box_text.working, true, 15000, true);
    db_guard(json)
    .then(responseText => {
      if (responseText) {
        let data = JSON.parse(responseText);
        let distribution = [];
        let aa = { };
        for (let i = 0; i < data.length; i++) {
          if (filter) {
            if (!data[i].defline.toLowerCase().includes("hypothetical") &&
                !data[i].defline.toLowerCase().includes("low quality") &&
                !data[i].defline.toLowerCase().includes("partial")) {
              distribution.push(data[i].sequence.length);
              for (let j = 0; j < data[i].sequence.length; j++) {
                if (!aa[data[i].sequence[j]]) { aa[data[i].sequence[j]] = 1; }
                else { aa[data[i].sequence[j]]++; }
              } // end for loop
            } // end if
          } // end if
          else {
            distribution.push(data[i].sequence.length);
            for (let j = 0; j < data[i].sequence.length; j++) {
              if (!aa[data[i].sequence[j]]) { aa[data[i].sequence[j]] = 1; }
              else { aa[data[i].sequence[j]]++; }
            } // end for loop
          } // end else
        } // end for loop
        let aa_distribution = [];
        Object.keys(aa).forEach(function(key) {
          let new_aa_record = { };
          new_aa_record.amino_acid = key;
          new_aa_record.count = aa[key];
          new_aa_record.name = letter_to_amino_acid(key);
          aa_distribution.push(new_aa_record);
        }); // end forEach
        aa_distribution.sort(function(a, b) {
          if (a.amino_acid < b.amino_acid) { return -1; }
          if (a.amino_acid > b.amino_acid) { return  1; }
          return 0;
        });
        let stats = new STATS();
        stats.load(distribution);
        let description = stats.description();
        if (options.callback) { hide_loading_box(true); options.callback(distribution, description, aa_distribution); }
      } // end if
    });
  }.bind(this));
  //////////////////////////////////////////////////////////////////////
} // end method
///////////////////////////////////////////////////////////////////////////////////////////////////
