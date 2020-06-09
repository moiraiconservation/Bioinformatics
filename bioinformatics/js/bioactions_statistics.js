///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS STATISTICS //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.create_proteome_statistics = function(element_id, list, callback, note) {
  if (element_id) {
    let element_check = document.getElementById(element_id);
    if (element_check) {
      while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
      element_check.innerHTML = '';
    } // end if
    else { return; }
  } // end if
  ////////////////////////////////////////////////////////////////////////
  // REGISTER VARIABLES WITH PARENT OBJECT ///////////////////////////////
  if (callback) { this.actions.proteome_statistics.callback = callback; }
  let action = this.default_skin(this.actions.proteome_statistics.id, this);
  this.actions.proteome_statistics.skin = action;
  action.tile.style.border = "transparent";
  action.tile.style.borderTop = "1px solid " + theme['base']['dark'];
  action.tile.style.backgroundColor = "transparent";
  action.tile.style.boxShadow = "none";
  action.tile.style.webkitBoxShadow = "none";
  action.tile.style.mozBoxShadow = "none";
  let title = 'Protein Statistics';
  if (note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
  action.title.innerHTML = title;
  action.text.innerHTML = "For all proteins contained within the table (either all proteins, or those proteins matching the search term):  This action calculates and displays the distribution of protein sequence lengths for the organism, as well as the relevant descriptive statistics.  The total abundance of all amino acids found within the proteins is also calculated and displayed.";
  action.button.innerHTML = "Calculate";
  if (element_id) {
    document.getElementById(element_id).appendChild(action.area);
    this.html_element.proteome_import = document.getElementById(element_id);
    this.html_element.proteome_import.style.display = "block";
  } // end if
  else { document.body.appendChild(action.area); }
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
  option += '<input type="checkbox" id="slider-checkbox-' + this.actions.proteome_statistics.id + '-' + this.id + '" value="1">';
  option += '<span class="slider slider-on-off round"></span>';
  option += '</label>';
  option += '</div>'; // end center
  option += '<div class="center">';
  option += '<div id="slider-subtitle">';
  option += '</div>'; // end slider-subtitle
  option += '</div>'; // end center
  action.option.innerHTML = option;
  $('[data-toggle="tooltip"]').tooltip();
  //////////////////////////////////////////////////////////////////////
  // EVENT LISTENERS ///////////////////////////////////////////////////
  action.button.addEventListener("click", function() {
    action.button.blur();
    let filter = false;
    let element_check = document.getElementById('slider-checkbox-' + this.actions.proteome_statistics.id + '-' + this.id);
    if (element_check) { filter = element_check.checked; }
    let obj = { };
    obj.database  = 'proteome_db';
    obj.table     = this.organism_name.replace(/ /g, '_');
    obj.command   = "select_all";
    obj.columns   = [ { key: "defline" }, { key: "sequence" } ];
    obj.limit     = this.proteome_record.num_records;
    if (list) {
      if (list.length < this.proteome_record.num_records) {
        obj.where = [];
        for (let i = 0; i < list.length; i++) {
          obj.where.push({ key: "id", value: list[i].id });
        } // end for loop
        obj.limit = list.length;
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
        if (callback) { hide_loading_box(true); callback(distribution, description, aa_distribution); }
      } // end if
    });
  }.bind(this));
  //////////////////////////////////////////////////////////////////////
} // end method
///////////////////////////////////////////////////////////////////////////////////////////////////
