///////////////////////////////////////////////////////////////////////////////////////////////////
// BIOACTIONS /////////////////////////////////////////////////////////////////////////////////////
//
// JavaScript dependencies:
//      core.js
//      file_guard.js
//      statistics.js
//      custom_d3.js
//      scoring_matrices.js
//
// PHP dependencies:
//      db_guard.php
//      file_guard.php
//      get_organism_list.php
//      MRCA_finder.php
//
///////////////////////////////////////////////////////////////////////////////////////////////////
// BIOACTION OBJECT ///////////////////////////////////////////////////////////////////////////////
function Bioaction() {
    //////////////////////////////////////////////////////////////////////
    // INITIALIZE VARIABLES //////////////////////////////////////////////
    this.id         =   guid();
    this.genus      =   '';
    this.species    =   '';
    // loading box text
    this.loading_box_text           =  { };
    this.loading_box_text.working   =   [];
    this.loading_box_text.working.push('Working');
    this.loading_box_text.working.push('Still working');
    this.loading_box_text.working.push("Calculating");
    this.loading_box_text.working.push("Still calculating");
    this.loading_box_text.working.push("Processing");
    this.loading_box_text.working.push("Still processing");
    this.loading_box_text.working.push("Contemplating existence");
    this.loading_box_text.working.push("Contemplating ethics and morality");
    this.loading_box_text.working.push("Really just daydreaming now ...");
    this.loading_box_text.working.push("Solving world hunger");
    this.loading_box_text.working.push("Proving P = NP");
    this.loading_box_text.working.push("Still proving P = NP.  Wow, this is really hard.");
    this.loading_box_text.working.push("Giving up proving P = NP");
    this.loading_box_text.working.push("Thinking about food now");
    this.loading_box_text.working.push("Wait, I was supposed to be doing something ...");
    // universal tooltips
    this.locked_tooltip = 'This record is either in the process of being updated by another user, or this record was last updated recently and needs a few minutes to reset.  Unlocking will occur automatically when the proper records are available.  You do not need to reload the page.';
    //////////////////////////////////////////////////////////////////////
    // METHODS ///////////////////////////////////////////////////////////
    this.reset = function() {
        this.reset_ncbi_record();
        this.reset_protein_record();
        this.reset_blastp_record();
        this.reset_blastn_record();
        this.reset_genome_record();
        this.reset_cross_species_protein_map_record();
        this.reset_gene_map_record();
        this.reset_html_elements();
        this.reset_last_focus();
        this.reset_actions();
        this.reset_tables();
        this.reset_mrca();
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_ncbi_record = function() {
        this.ncbi_record                            =   { };
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_protein_record = function() {
        this.protein_record                         =   { };
        this.protein_record.num_records             =   0;
        this.protein_record.num_uploaded            =   0;
        this.protein_record.percent_uploaded        =   0;
        this.protein_record.metadata                =   { };
        this.protein_record.metadata.owner          =   false;
        this.protein_record.metadata.year           =   0;
        this.protein_record.metadata.day            =   0;
        this.protein_record.metadata.hour           =   0;
        this.protein_record.metadata.minute         =   0;
        this.protein_record.metadata.second         =   0;
        this.protein_record.metadata.delta_second   =   0;
        this.protein_record.options                 =   undefined;
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_blastp_record = function() {
        this.blastp_record                          =   { };
        this.blastp_record.num_records              =   0;
        this.blastp_record.num_uploaded             =   0;
        this.blastp_record.percent_uploaded         =   0;
        this.blastp_record.metadata                 =   { };
        this.blastp_record.metadata.owner           =   false;
        this.blastp_record.metadata.year            =   0;
        this.blastp_record.metadata.day             =   0;
        this.blastp_record.metadata.hour            =   0;
        this.blastp_record.metadata.minute          =   0;
        this.blastp_record.metadata.second          =   0;
        this.blastp_record.metadata.delta_second    =   0;
        this.blastp_record.options                  =   undefined;
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_blastn_record = function() {
        this.blastn_record                          =   { };
        this.blastn_record.num_records              =   0;
        this.blastn_record.num_uploaded             =   0;
        this.blastn_record.percent_uploaded         =   0;
        this.blastn_record.metadata                 =   { };
        this.blastn_record.metadata.owner           =   false;
        this.blastn_record.metadata.year            =   0;
        this.blastn_record.metadata.day             =   0;
        this.blastn_record.metadata.hour            =   0;
        this.blastn_record.metadata.minute          =   0;
        this.blastn_record.metadata.second          =   0;
        this.blastn_record.metadata.delta_second    =   0;
        this.blastn_record.options                  =   undefined;
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_genome_record = function() {
        this.genome_record                          =   { };
        this.genome_record.num_records              =   0;
        this.genome_record.num_uploaded             =   0;
        this.genome_record.percent_uploaded         =   0;
        this.genome_record.metadata                 =   { };
        this.genome_record.metadata.owner           =   false;
        this.genome_record.metadata.year            =   0;
        this.genome_record.metadata.day             =   0;
        this.genome_record.metadata.hour            =   0;
        this.genome_record.metadata.minute          =   0;
        this.genome_record.metadata.second          =   0;
        this.genome_record.metadata.delta_second    =   0;
        this.genome_record.options                  =   undefined;
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_cross_species_protein_map_record = function() {
        this.cross_species_protein_map_record                                   =   { };
        this.cross_species_protein_map_record.num_records                       =   0;
        this.cross_species_protein_map_record.num_uploaded                      =   0;
        this.cross_species_protein_map_record.percent_uploaded                  =   0;
        this.cross_species_protein_map_record.species1                          =   { };
        this.cross_species_protein_map_record.species1.num_records              =   0;
        this.cross_species_protein_map_record.species1.num_uploaded             =   0;
        this.cross_species_protein_map_record.species1.percent_uploaded         =   0;
        this.cross_species_protein_map_record.species1.metadata                 =   { };
        this.cross_species_protein_map_record.species1.metadata.owner           =   false;
        this.cross_species_protein_map_record.species1.metadata.year            =   0;
        this.cross_species_protein_map_record.species1.metadata.day             =   0;
        this.cross_species_protein_map_record.species1.metadata.hour            =   0;
        this.cross_species_protein_map_record.species1.metadata.minute          =   0;
        this.cross_species_protein_map_record.species1.metadata.second          =   0;
        this.cross_species_protein_map_record.species1.metadata.delta_second    =   0;
        this.cross_species_protein_map_record.species1.options                  =   undefined;
        this.cross_species_protein_map_record.species2                          =   { };
        this.cross_species_protein_map_record.species2.num_records              =   0;
        this.cross_species_protein_map_record.species2.num_uploaded             =   0;
        this.cross_species_protein_map_record.species2.percent_uploaded         =   0;
        this.cross_species_protein_map_record.species2.metadata                 =   { };
        this.cross_species_protein_map_record.species2.metadata.owner           =   false;
        this.cross_species_protein_map_record.species2.metadata.year            =   0;
        this.cross_species_protein_map_record.species2.metadata.day             =   0;
        this.cross_species_protein_map_record.species2.metadata.hour            =   0;
        this.cross_species_protein_map_record.species2.metadata.minute          =   0;
        this.cross_species_protein_map_record.species2.metadata.second          =   0;
        this.cross_species_protein_map_record.species2.metadata.delta_second    =   0;
        this.cross_species_protein_map_record.species2.options                  =   undefined;
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_mrca = function() {
        this.mrca_proteome                                          =   { };
        this.mrca_proteome.organism_name                            =   '';
        this.mrca_proteome.time                                     =   Infinity;
        this.mrca_proteome.ncbi_record                              =   { };
        this.mrca_proteome.protein_record                           =   { };
        this.mrca_proteome.protein_record.num_records               =   0;
        this.mrca_proteome.protein_record.num_uploaded              =   0;
        this.mrca_proteome.protein_record.percent_uploaded          =   0;
        this.mrca_proteome.protein_record.metadata                  =   { };
        this.mrca_proteome.protein_record.metadata.owner            =   false;
        this.mrca_proteome.protein_record.metadata.year             =   0;
        this.mrca_proteome.protein_record.metadata.day              =   0;
        this.mrca_proteome.protein_record.metadata.hour             =   0;
        this.mrca_proteome.protein_record.metadata.minute           =   0;
        this.mrca_proteome.protein_record.metadata.second           =   0;
        this.mrca_proteome.protein_record.metadata.delta_second     =   0;
        this.mrca_proteome.protein_record.options                   =   undefined;
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_gene_map_record = function() {
        this.gene_map_record                        =   { };
        this.gene_map_record.num_records            =   0;
        this.gene_map_record.num_uploaded           =   0;
        this.gene_map_record.percent_uploaded       =   0;
        this.gene_map_record.metadata               =   { };
        this.gene_map_record.metadata.owner         =   false;
        this.gene_map_record.metadata.year          =   0;
        this.gene_map_record.metadata.day           =   0;
        this.gene_map_record.metadata.hour          =   0;
        this.gene_map_record.metadata.minute        =   0;
        this.gene_map_record.metadata.second        =   0;
        this.gene_map_record.metadata.delta_second  =   0;
        this.gene_map_record.options                =   undefined;
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_html_elements = function() {
        if (this.html_element) {
            Object.values(this.html_element).forEach(element => {
                while (element.firstChild) { element.removeChild(element.firstChild); }
                element.innerHTML = '';
            }); // end forEach
        } // end if
        this.html_element = { };
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_last_focus = function() {
        this.last_focus = '';
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_actions = function() {
        // protein import
        this.actions                                            =   { };
        this.actions.protein_import                             =   { };
        this.actions.protein_import.description                 =   'protein import';
        this.actions.protein_import.id                          =   guid();
        this.actions.protein_import.callback                    =   undefined;
        this.actions.protein_import.timer                       =   undefined;
        this.actions.protein_import.cleanup                     =   undefined;
        this.actions.protein_import.status                      =   'loading';
        this.actions.protein_import.percent_complete            =   0;
        this.actions.protein_import.lock_delay                  =   300;    // 5 minute delay
        // protein statistics
        this.actions.protein_statistics                         =   { };
        this.actions.protein_statistics.description             =   'statistics';
        this.actions.protein_statistics.id                      =   guid();
        this.actions.protein_statistics.callback                =   undefined;
        this.actions.protein_statistics.timer                   =   undefined;
        this.actions.protein_statistics.status                  =   'loading';
        this.actions.protein_statistics.percent_complete        =   0;
        this.actions.protein_statistics.lock_delay              =   0;      // 0 minute delay
        // BLASTp index
        this.actions.blastp_index                               =   { };
        this.actions.blastp_index.description                   =   'BLASTp index';
        this.actions.blastp_index.id                            =   guid();
        this.actions.blastp_index.callback                      =   undefined;
        this.actions.blastp_index.timer                         =   undefined;
        this.actions.blastp_index.status                        =   'loading';
        this.actions.blastp_index.percent_complete              =   0;
        this.actions.blastp_index.lock_delay                    =   1800;   // 30 minute delay
        // BLASTn index
        this.actions.blastn_index                               =   { };
        this.actions.blastn_index.description                   =   'BLASTn index';
        this.actions.blastn_index.id                            =   guid();
        this.actions.blastn_index.callback                      =   undefined;
        this.actions.blastn_index.timer                         =   undefined;
        this.actions.blastn_index.status                        =   'loading';
        this.actions.blastn_index.percent_complete              =   0;
        this.actions.blastn_index.lock_delay                    =   300;   // 5 minute delay
        // genome import
        this.actions.genome_import                              =   { };
        this.actions.genome_import.description                  =   'genome import';
        this.actions.genome_import.id                           =   guid();
        this.actions.genome_import.callback                     =   undefined;
        this.actions.genome_import.timer                        =   undefined;
        this.actions.genome_import.cleanup                      =   undefined;
        this.actions.genome_import.status                       =   'loading';
        this.actions.genome_import.percent_complete             =   0;
        this.actions.genome_import.lock_delay                   =   300;   // 5 minute delay
        // cross-species protein map
        this.actions.cross_species_protein_map                  =   { };
        this.actions.cross_species_protein_map.description      =   'cross-species protein map';
        this.actions.cross_species_protein_map.id               =   guid();
        this.actions.cross_species_protein_map.callback         =   undefined;
        this.actions.cross_species_protein_map.timer            =   undefined;
        this.actions.cross_species_protein_map.status           =   'loading';
        this.actions.cross_species_protein_map.percent_complete =   0;
        this.actions.cross_species_protein_map.lock_delay       =   1800; // 30 minute delay (1800)
        this.actions.cross_species_protein_map.species1         =   undefined;
        this.actions.cross_species_protein_map.species2         =   undefined;
        // gene map
        this.actions.gene_map                                   =   { };
        this.actions.gene_map.description                       =   'gene map';
        this.actions.gene_map.id                                =   guid();
        this.actions.gene_map.callback                          =   undefined;
        this.actions.gene_map.timer                             =   undefined;
        this.actions.gene_map.cleanup                           =   undefined;
        this.actions.gene_map.status                            =   'loading';
        this.actions.gene_map.percent_complete                  =   0;
        this.actions.gene_map.lock_delay                        =   60; // 300;   // 5 minute delay
    } // end function
    //////////////////////////////////////////////////////////////////////
    this.reset_tables = function() {
        this.tables                                 =   { };
        this.tables.protein                         =   { };
        this.tables.protein.id                      =   '';
        this.tables.protein.page                    =   0;
        this.tables.protein.term                    =   '';
        this.tables.protein.data                    =   { };
    } // end function
    //////////////////////////////////////////////////////////////////////
    // ACTIONS ///////////////////////////////////////////////////////////
    this.reset();
    //////////////////////////////////////////////////////////////////////
}; // end constructor
///////////////////////////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPE GETTERS / SETTERS //////////////////////////////////////////////////////////
Bioaction.prototype = {
    // get organism name
    get organism_name() {
        if (this.genus && this.species) { return this.genus + ' ' + this.species; }
        else if (this.genus) { return this.genus; }
        else if (this.species) { return this.species; }
        else { return ''; }
    },
    // set organism name
    set organism_name(name) {
        if (name) {
            this.reset();
            name = this.format_organism_name(name);
            let split_name = name.split(" ");
            this.genus   = split_name[0];
            this.species = split_name[1];
        } // end if
        else {
            this.genus   = '';
            this.species = '';
            this.reset();
        } // end else
    } // end set
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
// BIOACTION PROTOTYPES ///////////////////////////////////////////////////////////////////////////
Bioaction.prototype.format_organism_name = function(str) {
    str = str.trim();
    str = str.replace(/_/g, ' ');
    str = str.replace(/ +(?= )/g,'');
    str = str.toLowerCase();
    str = str.charAt(0).toUpperCase() + str.slice(1);
    return str;
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.evaluate_lock = function(action, record) {
    if (typeof(action) == 'undefined') { return; }
    if (typeof(record) == 'undefined') { return; }
    let button      =   document.getElementById("button-"   + this.id + "-" + action.id);
    let status      =   document.getElementById("status-"   + this.id + "-" + action.id);
    let metadata    =   document.getElementById("metadata-" + this.id + "-" + action.id);
    let option      =   document.getElementById("option-"   + this.id + "-" + action.id);
    if ((record.metadata.delta_second !== 0) || (record.metadata.year == 0)) {
        //console.log(action.status, action.description);
        if (button && status) {
            // the action has not started, or the action has started and it's not locked
            if ((!record.num_uploaded && !record.metadata.delta_second) ||
                (isFinite(record.percent_uploaded) && (record.percent_uploaded < 100) && (record.metadata.delta_second >= action.lock_delay))) {
                if ((action.status !== 'button') || (record.percent_uploaded > action.percent_complete)) {
                    action.status = 'button';
                    action.percent_complete = record.percent_uploaded;
                    button.style.display = 'block';
                    status.innerHTML     = '<p class="standard-text" style="color: gray;">' + record.percent_uploaded + '% complete</p>';
                } // end if
                if (option) { option.style.display === 'block'; }
                if (typeof(action.timer) === 'undefined') {
                    if (action.id === this.actions.protein_import.id           ) { action.timer = setInterval(function() { this.get_protein_record();                   }.bind(this), 5000); }
                    if (action.id === this.actions.blastp_index.id             ) { action.timer = setInterval(function() { this.get_blastp_record();                    }.bind(this), 5000); }
                    if (action.id === this.actions.blastn_index.id             ) { action.timer = setInterval(function() { this.get_blastn_record();                    }.bind(this), 5000); }
                    if (action.id === this.actions.genome_import.id            ) { action.timer = setInterval(function() { this.get_genome_record();                    }.bind(this), 5000); }
                    if (action.id === this.actions.gene_map.id                 ) { action.timer = setInterval(function() { this.get_gene_map_record();                  }.bind(this), 5000); }
                    if (action.id === this.actions.cross_species_protein_map.id) { action.timer = setInterval(function() { this.get_cross_species_protein_map_record(); }.bind(this), 5000); }
                } // end if
            } // end if
            // the action is running and it's locked
            else if (isFinite(record.percent_uploaded) && (record.percent_uploaded < 100) && (record.metadata.delta_second < action.lock_delay)) {
                button.style.display = 'none';
                if (option) { option.style.display = 'none'; }
                if ((action.status !== 'locked') || (record.percent_uploaded > action.percent_complete)) {
                    action.status = 'locked';
                    action.percent_complete = record.percent_uploaded;
                    let lock_text    =  '<br><h4 class="ellipsis"><i class="fa fa-lock" aria-hidden="true"></i> ';
                    lock_text       +=  'Locked <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + this.locked_tooltip + '"></span></h4>';
                    lock_text       +=  '<p class="standard-text" style="color: gray;">' + record.percent_uploaded + '% complete</p>';
                    status.innerHTML = lock_text;
                } // end if
                $('[data-toggle="tooltip"]').tooltip();
                if (typeof(action.timer) === 'undefined') {
                    if (action.id === this.actions.protein_import.id           ) { action.timer = setInterval(function() { this.get_protein_record();                   }.bind(this), 5000); }
                    if (action.id === this.actions.blastp_index.id             ) { action.timer = setInterval(function() { this.get_blastp_record();                    }.bind(this), 5000); }
                    if (action.id === this.actions.blastn_index.id             ) { action.timer = setInterval(function() { this.get_blastn_record();                    }.bind(this), 5000); }
                    if (action.id === this.actions.genome_import.id            ) { action.timer = setInterval(function() { this.get_genome_record();                    }.bind(this), 5000); }
                    if (action.id === this.actions.gene_map.id                 ) { action.timer = setInterval(function() { this.get_gene_map_record();                  }.bind(this), 5000); }
                    if (action.id === this.actions.cross_species_protein_map.id) { action.timer = setInterval(function() { this.get_cross_species_protein_map_record(); }.bind(this), 5000); }
                } // end if
            } // end else if
            // the action has completed
            else if (isFinite(record.percent_uploaded) && (record.percent_uploaded >= 100)) {
                button.style.display = 'none';
                if (action.status !== 'complete') {
                    action.status = 'complete';
                    action.percent_complete = 100;
                    status.innerHTML = '<p class="color-primary-foundation standard-text"><b>100% complete</b></p>';
                    if (metadata) {
                        if (record.metadata.day && record.metadata.year) {
                            metadata.innerHTML = 'Completed: ' + getDateFromDayNum(record.metadata.day, record.metadata.year);;
                        } // end if
                    } // end if
                } // end if
                if (typeof(action.timer) !== 'undefined') {
                    clearInterval(action.timer);
                    action.timer = undefined;
                } // end if
                if (option) { option.style.display = 'none'; }
                if (action.callback) { action.callback(); }
            } // end else if
        } // end if
    } // end if
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.update = function() {
    //////////////////////////////////////////////////////////////////////
    // CLEAR ANY UNUSED TIMERS ///////////////////////////////////////////
    if (!document.getElementById(this.html_element.protein_import) && (typeof(this.actions.protein_import.timer) !== 'undefined')) { clearInterval(this.actions.protein_import.timer); this.actions.protein_import.timer = undefined; }
    if (!document.getElementById(this.html_element.blastp_index  ) && (typeof(this.actions.blastp_index.timer  ) !== 'undefined')) { clearInterval(this.actions.blastp_index.timer  ); this.actions.blastp_index.timer   = undefined; }
    if (!document.getElementById(this.html_element.blastn_index  ) && (typeof(this.actions.blastn_index.timer  ) !== 'undefined')) { clearInterval(this.actions.blastn_index.timer  ); this.actions.blastn_index.timer   = undefined; }
    if (!document.getElementById(this.html_element.genome_import ) && (typeof(this.actions.genome_import.timer ) !== 'undefined')) { clearInterval(this.actions.genome_import.timer ); this.actions.genome_import.timer  = undefined; }
    if (!document.getElementById(this.html_element.gene_map      ) && (typeof(this.actions.gene_map.timer      ) !== 'undefined')) { clearInterval(this.actions.gene_map.timer      ); this.actions.gene_map.timer       = undefined; }
    if (!document.getElementById(this.html_element.cross_species_protein_map) && (typeof(this.actions.cross_species_protein_map.timer) !== 'undefined')) { clearInterval(this.actions.cross_species_protein_map.timer); this.actions.cross_species_protein_map.timer = undefined; }
    //////////////////////////////////////////////////////////////////////
    // UPDATE PAGE ORGANISM NAME /////////////////////////////////////////
    let page_organism_name = document.getElementById("page-organism-name");
    if (page_organism_name) { page_organism_name.innerHTML = this.organism_name; }
    //////////////////////////////////////////////////////////////////////
    // EVALUATE THE SIMPLE ACTION LOCKS //////////////////////////////////
    if (this.html_element.protein_import && (this.actions.protein_import.status !== 'complete')) { this.evaluate_lock(this.actions.protein_import, this.protein_record ); }
    if (this.html_element.blastp_index   && (this.actions.blastp_index.status   !== 'complete')) { this.evaluate_lock(this.actions.blastp_index,   this.blastp_record  ); }
    if (this.html_element.blastn_index   && (this.actions.blastn_index.status   !== 'complete')) { this.evaluate_lock(this.actions.blastn_index,   this.blastn_record  ); }
    if (this.html_element.genome_import  && (this.actions.genome_import.status  !== 'complete')) { this.evaluate_lock(this.actions.genome_import,  this.genome_record  ); }
    if (this.html_element.gene_map       && (this.actions.gene_map.status       !== 'complete')) { this.evaluate_lock(this.actions.gene_map,       this.gene_map_record); }
    //////////////////////////////////////////////////////////////////////
    // EVALUATE THE COMPLEX ACTION LOCKS /////////////////////////////////
    let newObj = { };
    newObj.metadata = { };
    newObj.num_records           = this.cross_species_protein_map_record.species1.num_records + this.cross_species_protein_map_record.species2.num_records;
    newObj.num_uploaded          = this.cross_species_protein_map_record.species1.num_uploaded + this.cross_species_protein_map_record.species2.num_uploaded;
    newObj.percent_uploaded      = this.cross_species_protein_map_record.species1.percent_uploaded + this.cross_species_protein_map_record.species2.percent_uploaded;
    newObj.metadata.year         = this.cross_species_protein_map_record.species2.metadata.year ? this.cross_species_protein_map_record.species2.metadata.year : this.cross_species_protein_map_record.species1.metadata.year;
    newObj.metadata.day          = this.cross_species_protein_map_record.species2.metadata.day ? this.cross_species_protein_map_record.species2.metadata.day : this.cross_species_protein_map_record.species1.metadata.day;
    newObj.metadata.delta_second = this.cross_species_protein_map_record.species2.metadata.delta_second ? this.cross_species_protein_map_record.species2.metadata.delta_second : this.cross_species_protein_map_record.species1.metadata.delta_second;
    if (this.html_element.cross_species_protein_map && (this.actions.cross_species_protein_map.status !== 'complete')) { this.evaluate_lock(this.actions.cross_species_protein_map, newObj); }
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.get_ncbi_record = function() {
    return new Promise(function(resolve, reject) {
        let obj    = { };
        obj.database   =   'moirai_db';
        obj.table      =   'ncbi_genome';
        obj.command    =   'select';
        obj.where      =   [ { "key": "organism_name", "value": this.organism_name } ];
        let json = JSON.stringify(obj);
        db_guard(json)
        .then(responseText => {
            if (responseText && (responseText !== '{ }')) {
                this.ncbi_record = JSON.parse(responseText);
            } // end if
        }) // end then
        .then(() => { this.update(); resolve(); });
    }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.get_protein_record = function() {
    return new Promise(function(resolve, reject) {
        let obj1 = { };
        let obj2 = { };
        obj1.database   =   'protein_db';
        obj1.table      =   'table_metadata';
        obj1.command    =   'select';
        obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
        obj2.database   =   'protein_db';
        obj2.table      =   this.organism_name.replace(/ /g, '_');
        obj2.command    =   "count";
        let json1 = JSON.stringify(obj1);
        let json2 = JSON.stringify(obj2);
        db_guard(json1)
        .then(responseText => {
            if (responseText) {
                this.reset_protein_record();
                let db_record = JSON.parse(responseText);
                if (typeof(db_record.owner       ) !== 'undefined') { this.protein_record.metadata.owner         = db_record.owner; }
                if (typeof(db_record.records     ) !== 'undefined') { this.protein_record.num_records            = parseInt(db_record.records     ); }
                if (typeof(db_record.year        ) !== 'undefined') { this.protein_record.metadata.year          = parseInt(db_record.year        ); }
                if (typeof(db_record.day         ) !== 'undefined') { this.protein_record.metadata.day           = parseInt(db_record.day         ); }
                if (typeof(db_record.hour        ) !== 'undefined') { this.protein_record.metadata.hour          = parseInt(db_record.hour        ); }
                if (typeof(db_record.minute      ) !== 'undefined') { this.protein_record.metadata.minute        = parseInt(db_record.minute      ); }
                if (typeof(db_record.second      ) !== 'undefined') { this.protein_record.metadata.second        = parseInt(db_record.second      ); }
                if (typeof(db_record.delta_second) !== 'undefined') { this.protein_record.metadata.delta_second  = parseInt(db_record.delta_second); }
                if (db_record.options) { this.protein_record.options = JSON.parse(db_record.options); }
            } // end if
        })
        .then(() => db_guard(json2))
        .then(responseText => {
            if (responseText) {
                let db_record = JSON.parse(responseText);
                if (db_record['COUNT(*)']) {
                    this.protein_record.num_uploaded = parseInt(db_record['COUNT(*)']);
                    if (this.protein_record.num_records) {
                        this.protein_record.percent_uploaded = Math.floor((this.protein_record.num_uploaded / this.protein_record.num_records) * 100);
                    } // end if
                } // end if
            } // end if
        })
        .then(() => { this.update(); resolve(); });
    }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.get_blastp_record = function() {
    return new Promise(function(resolve, reject) {
        let obj1 = { };
        let obj2 = { };
        obj1.database   =   'blastp_db';
        obj1.table      =   'table_metadata';
        obj1.command    =   'select';
        obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
        obj2.database   =   'blastp_db';
        obj2.table      =   this.organism_name.replace(/ /g, '_');
        obj2.command    =   "count";
        let json1 = JSON.stringify(obj1);
        let json2 = JSON.stringify(obj2);
        db_guard(json1)
        .then(responseText => {
            if (responseText) {
                this.reset_blastp_record();
                let db_record = JSON.parse(responseText);
                if (typeof(db_record.owner       ) !== 'undefined') { this.blastp_record.metadata.owner  = db_record.owner; }
                if (typeof(db_record.records     ) !== 'undefined') { this.blastp_record.num_records             = parseInt(db_record.records     ); }
                if (typeof(db_record.year        ) !== 'undefined') { this.blastp_record.metadata.year           = parseInt(db_record.year        ); }
                if (typeof(db_record.day         ) !== 'undefined') { this.blastp_record.metadata.day            = parseInt(db_record.day         ); }
                if (typeof(db_record.hour        ) !== 'undefined') { this.blastp_record.metadata.hour           = parseInt(db_record.hour        ); }
                if (typeof(db_record.minute      ) !== 'undefined') { this.blastp_record.metadata.minute         = parseInt(db_record.minute      ); }
                if (typeof(db_record.second      ) !== 'undefined') { this.blastp_record.metadata.second         = parseInt(db_record.second      ); }
                if (typeof(db_record.delta_second) !== 'undefined') { this.blastp_record.metadata.delta_second   = parseInt(db_record.delta_second); }
                if (db_record.options) { this.blastp_record.options = JSON.parse(db_record.options); }
            } // end if
        })
        .then(() => db_guard(json2))
        .then(responseText => {
            if (responseText) {
                let db_record = JSON.parse(responseText);
                if (db_record['COUNT(*)']) {
                    this.blastp_record.num_uploaded = parseInt(db_record['COUNT(*)']);
                    if (this.blastp_record.num_records) {
                        this.blastp_record.percent_uploaded = Math.floor((this.blastp_record.num_uploaded / this.blastp_record.num_records) * 100);
                    } // end if
                } // end if
            } // end if
        })
        .then(() => { this.update(); resolve(); });
    }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.get_blastn_record = function() {
    return new Promise(function(resolve, reject) {
        let obj1 = { };
        let obj2 = { };
        obj1.database   =   'blastn_db';
        obj1.table      =   'table_metadata';
        obj1.command    =   'select';
        obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
        obj2.database   =   'blastn_db';
        obj2.table      =   this.organism_name.replace(/ /g, '_');
        obj2.command    =   "count";
        let json1 = JSON.stringify(obj1);
        let json2 = JSON.stringify(obj2);
        db_guard(json1)
        .then(responseText => {
            if (responseText) {
                this.reset_blastn_record();
                let db_record = JSON.parse(responseText);
                if (typeof(db_record.owner       ) !== 'undefined') { this.blastn_record.metadata.owner  = db_record.owner; }
                if (typeof(db_record.records     ) !== 'undefined') { this.blastn_record.num_records             = parseInt(db_record.records     ); }
                if (typeof(db_record.year        ) !== 'undefined') { this.blastn_record.metadata.year           = parseInt(db_record.year        ); }
                if (typeof(db_record.day         ) !== 'undefined') { this.blastn_record.metadata.day            = parseInt(db_record.day         ); }
                if (typeof(db_record.hour        ) !== 'undefined') { this.blastn_record.metadata.hour           = parseInt(db_record.hour        ); }
                if (typeof(db_record.minute      ) !== 'undefined') { this.blastn_record.metadata.minute         = parseInt(db_record.minute      ); }
                if (typeof(db_record.second      ) !== 'undefined') { this.blastn_record.metadata.second         = parseInt(db_record.second      ); }
                if (typeof(db_record.delta_second) !== 'undefined') { this.blastn_record.metadata.delta_second   = parseInt(db_record.delta_second); }
                if (db_record.options) { this.blastn_record.options = JSON.parse(db_record.options); }
            } // end if
        })
        .then(() => db_guard(json2))
        .then(responseText => {
            if (responseText) {
                let db_record = JSON.parse(responseText);
                if (db_record['COUNT(*)']) {
                    this.blastn_record.num_uploaded = parseInt(db_record['COUNT(*)']);
                    if (this.blastn_record.num_records) {
                        this.blastn_record.percent_uploaded = Math.floor((this.blastn_record.num_uploaded / this.blastn_record.num_records) * 100);
                    } // end if
                } // end if
            } // end if
        })
        .then(() => { this.update(); resolve(); });
    }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.get_genome_record = function() {
    return new Promise(function(resolve, reject) {
        let obj1 = { };
        let obj2 = { };
        obj1.database   =   'dna_db';
        obj1.table      =   'table_metadata';
        obj1.command    =   'select';
        obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
        obj2.database   =   'dna_db';
        obj2.table      =   this.organism_name.replace(/ /g, '_');
        obj2.command    =   "count";
        let json1 = JSON.stringify(obj1);
        let json2 = JSON.stringify(obj2);
        db_guard(json1)
        .then(responseText => {
            if (responseText) {
                this.reset_genome_record();
                let db_record = JSON.parse(responseText);
                if (typeof(db_record.owner       ) !== 'undefined') { this.genome_record.metadata.owner         = db_record.owner; }
                if (typeof(db_record.records     ) !== 'undefined') { this.genome_record.num_records            = parseInt(db_record.records     ); }
                if (typeof(db_record.year        ) !== 'undefined') { this.genome_record.metadata.year          = parseInt(db_record.year        ); }
                if (typeof(db_record.day         ) !== 'undefined') { this.genome_record.metadata.day           = parseInt(db_record.day         ); }
                if (typeof(db_record.hour        ) !== 'undefined') { this.genome_record.metadata.hour          = parseInt(db_record.hour        ); }
                if (typeof(db_record.minute      ) !== 'undefined') { this.genome_record.metadata.minute        = parseInt(db_record.minute      ); }
                if (typeof(db_record.second      ) !== 'undefined') { this.genome_record.metadata.second        = parseInt(db_record.second      ); }
                if (typeof(db_record.delta_second) !== 'undefined') { this.genome_record.metadata.delta_second  = parseInt(db_record.delta_second); }
                if (db_record.options) { this.genome_record.options = JSON.parse(db_record.options); }
            } // end if
        })
        .then(() => db_guard(json2))
        .then(responseText => {
            if (responseText) {
                let db_record = JSON.parse(responseText);
                if (db_record['COUNT(*)']) {
                    this.genome_record.num_uploaded = parseInt(db_record['COUNT(*)']);
                    if (this.genome_record.num_records) {
                        this.genome_record.percent_uploaded = Math.floor((this.genome_record.num_uploaded / this.genome_record.num_records) * 100);
                    } // end if
                } // end if
            } // end if
        })
        .then(() => { this.update(); resolve(); });
    }.bind(this)); // end Promise
}; // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.get_cross_species_protein_map_record = function() {
    return new Promise(function(resolve, reject) {
        if (this.actions.cross_species_protein_map.species1 && this.actions.cross_species_protein_map.species2) {
            let split_name1 = this.actions.cross_species_protein_map.species1.organism_name.split(' ');
            let split_name2 = this.actions.cross_species_protein_map.species2.organism_name.split(' ');
            let name1 = split_name1[0][0] + '_' + split_name1[1];
            let name2 = split_name2[0][0] + '_' + split_name2[1];
            let table_name1 = name1 + '_to_' + name2;
            let table_name2 = name2 + '_to_' + name1;
            let obj1 = { };
            let obj2 = { };
            let obj3 = { };
            let obj4 = { };
            obj1.database   =   'xspecies_db';
            obj1.table      =   'table_metadata';
            obj1.command    =   'select';
            obj1.where      =   [ { "key": "id", "value": table_name1 } ];
            obj2.database   =   'xspecies_db';
            obj2.table      =   table_name1;
            obj2.command    =   "count";
            obj3.database   =   'xspecies_db';
            obj3.table      =   'table_metadata';
            obj3.command    =   'select';
            obj3.where      =   [ { "key": "id", "value": table_name2 } ];
            obj4.database   =   'xspecies_db';
            obj4.table      =   table_name2;
            obj4.command    =   "count";
            let json1 = JSON.stringify(obj1);
            let json2 = JSON.stringify(obj2);
            let json3 = JSON.stringify(obj3);
            let json4 = JSON.stringify(obj4);
            db_guard(json1)
            .then(responseText => {
                if (responseText) {
                    this.reset_cross_species_protein_map_record();
                    let db_record = JSON.parse(responseText);
                    if (typeof(db_record.owner       ) !== 'undefined') { this.cross_species_protein_map_record.species1.metadata.owner          = db_record.owner; }
                    if (typeof(db_record.records     ) !== 'undefined') { this.cross_species_protein_map_record.species1.num_records             = parseInt(db_record.records     ); }
                    if (typeof(db_record.year        ) !== 'undefined') { this.cross_species_protein_map_record.species1.metadata.year           = parseInt(db_record.year        ); }
                    if (typeof(db_record.day         ) !== 'undefined') { this.cross_species_protein_map_record.species1.metadata.day            = parseInt(db_record.day         ); }
                    if (typeof(db_record.hour        ) !== 'undefined') { this.cross_species_protein_map_record.species1.metadata.hour           = parseInt(db_record.hour        ); }
                    if (typeof(db_record.minute      ) !== 'undefined') { this.cross_species_protein_map_record.species1.metadata.minute         = parseInt(db_record.minute      ); }
                    if (typeof(db_record.second      ) !== 'undefined') { this.cross_species_protein_map_record.species1.metadata.second         = parseInt(db_record.second      ); }
                    if (typeof(db_record.delta_second) !== 'undefined') { this.cross_species_protein_map_record.species1.metadata.delta_second   = parseInt(db_record.delta_second); }
                    if (db_record.options) { this.cross_species_protein_map_record.species1.options = JSON.parse(db_record.options); }
                } // end if
            }) // end then
            .then(() => db_guard(json2))
            .then(responseText => {
                if (responseText) {
                    let db_record = JSON.parse(responseText);
                    if (db_record['COUNT(*)']) {
                        this.cross_species_protein_map_record.species1.num_uploaded = parseInt(db_record['COUNT(*)']);
                        if (this.cross_species_protein_map_record.species1.num_records) {
                            this.cross_species_protein_map_record.species1.percent_uploaded = Math.floor((this.cross_species_protein_map_record.species1.num_uploaded / this.cross_species_protein_map_record.species1.num_records) * 100);
                        } // end if
                    } // end if
                } // end if
            }) // end then
            .then(() => db_guard(json3))
            .then(responseText => {
                if (responseText) {
                    let db_record = JSON.parse(responseText);
                    if (typeof(db_record.owner       ) !== 'undefined') { this.cross_species_protein_map_record.species2.metadata.owner          = db_record.owner; }
                    if (typeof(db_record.records     ) !== 'undefined') { this.cross_species_protein_map_record.species2.num_records             = parseInt(db_record.records     ); }
                    if (typeof(db_record.year        ) !== 'undefined') { this.cross_species_protein_map_record.species2.metadata.year           = parseInt(db_record.year        ); }
                    if (typeof(db_record.day         ) !== 'undefined') { this.cross_species_protein_map_record.species2.metadata.day            = parseInt(db_record.day         ); }
                    if (typeof(db_record.hour        ) !== 'undefined') { this.cross_species_protein_map_record.species2.metadata.hour           = parseInt(db_record.hour        ); }
                    if (typeof(db_record.minute      ) !== 'undefined') { this.cross_species_protein_map_record.species2.metadata.minute         = parseInt(db_record.minute      ); }
                    if (typeof(db_record.second      ) !== 'undefined') { this.cross_species_protein_map_record.species2.metadata.second         = parseInt(db_record.second      ); }
                    if (typeof(db_record.delta_second) !== 'undefined') { this.cross_species_protein_map_record.species2.metadata.delta_second   = parseInt(db_record.delta_second); }
                    if (db_record.options) { this.cross_species_protein_map_record.species2.options = JSON.parse(db_record.options); }
                } // end if
            })
            .then(() => db_guard(json4))
            .then(responseText => {
                if (responseText) {
                    let db_record = JSON.parse(responseText);
                    if (db_record['COUNT(*)']) {
                        this.cross_species_protein_map_record.species2.num_uploaded = parseInt(db_record['COUNT(*)']);
                        if (this.cross_species_protein_map_record.species2.num_records) {
                            this.cross_species_protein_map_record.species2.percent_uploaded = Math.floor((this.cross_species_protein_map_record.species2.num_uploaded / this.cross_species_protein_map_record.species2.num_records) * 100);
                        } // end if
                    } // end if
                } // end if
            }) // end then
            .then(() => {
                this.cross_species_protein_map_record.num_records = this.cross_species_protein_map_record.species1.num_records + this.cross_species_protein_map_record.species2.num_records;
                this.cross_species_protein_map_record.num_uploaded = this.cross_species_protein_map_record.species1.num_uploaded + this.cross_species_protein_map_record.species2.num_uploaded;
                if (this.cross_species_protein_map_record.num_records) {
                    if (this.cross_species_protein_map_record.num_records) {
                        this.cross_species_protein_map_record.percent_uploaded = Math.floor((this.cross_species_protein_map_record.num_uploaded / this.cross_species_protein_map_record.num_records) * 100);
                    } // end if
                } // end if
                this.update();
                resolve();
            }); // end then
        } // end if
        else { resolve(); }
    }.bind(this)); // end promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.get_gene_map_record = function() {
    return new Promise(function(resolve, reject) {
        let obj1 = { };
        let obj2 = { };
        obj1.database   =   'gene_map_db';
        obj1.table      =   'table_metadata';
        obj1.command    =   'select';
        obj1.where      =   [ { "key": "id", "value": this.organism_name.replace(/ /g, '_') } ];
        obj2.database   =   'gene_map_db';
        obj2.table      =   this.organism_name.replace(/ /g, '_');
        obj2.command    =   "count";
        let json1 = JSON.stringify(obj1);
        let json2 = JSON.stringify(obj2);
        db_guard(json1)
        .then(responseText => {
            if (responseText) {
                this.reset_protein_record();
                let db_record = JSON.parse(responseText);
                if (typeof(db_record.owner       ) !== 'undefined') { this.gene_map_record.metadata.owner         = db_record.owner; }
                if (typeof(db_record.records     ) !== 'undefined') { this.gene_map_record.num_records            = parseInt(db_record.records     ); }
                if (typeof(db_record.year        ) !== 'undefined') { this.gene_map_record.metadata.year          = parseInt(db_record.year        ); }
                if (typeof(db_record.day         ) !== 'undefined') { this.gene_map_record.metadata.day           = parseInt(db_record.day         ); }
                if (typeof(db_record.hour        ) !== 'undefined') { this.gene_map_record.metadata.hour          = parseInt(db_record.hour        ); }
                if (typeof(db_record.minute      ) !== 'undefined') { this.gene_map_record.metadata.minute        = parseInt(db_record.minute      ); }
                if (typeof(db_record.second      ) !== 'undefined') { this.gene_map_record.metadata.second        = parseInt(db_record.second      ); }
                if (typeof(db_record.delta_second) !== 'undefined') { this.gene_map_record.metadata.delta_second  = parseInt(db_record.delta_second); }
                if (db_record.options) { this.gene_map_record.options = JSON.parse(db_record.options); }
            } // end if
        })
        .then(() => db_guard(json2))
        .then(responseText => {
            if (responseText) {
                let db_record = JSON.parse(responseText);
                if (db_record['COUNT(*)']) {
                    this.gene_map_record.num_uploaded = parseInt(db_record['COUNT(*)']);
                    if (this.gene_map_record.num_records) {
                        this.gene_map_record.percent_uploaded = Math.floor((this.gene_map_record.num_uploaded / this.gene_map_record.num_records) * 100);
                    } // end if
                } // end if
            } // end if
        })
        .then(() => { this.update(); resolve(); });
    }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.get_mrca_proteome = function() {
    return new Promise(function(resolve, reject) {
        let self = this;
        let mrca = { organism_name: '', url: '', time: Infinity };
        hide_loading_box(true);
        hide_progress_bar(true);
        if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
        else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.responseText && (this.status == 200)) {
                    let json = JSON.parse(this.responseText);
                    if (json.organism_name) {
                        create_progress_bar("Finding closest relative", true, json.organism_name.length);
                        get_next_mrca(self, name, json.organism_name, mrca);
                    } // end if
                } // end if
                else { this.get_mrca_proteome(); }
            } // end if
        }; // end function
        xmlhttp.open("POST", "api/get_organism_list", true);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.send("format=organism_name&filter=protein_url_ttolID");
        //////////////////////////////////////////////////////////////////////
        function get_next_mrca(self, name, name_list, mrca, current_index) {
            if (typeof(current_index) === 'undefined') { current_index = 0; }
            if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
            else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.responseText && (this.status == 200)) {
                        let json = JSON.parse(this.responseText);
                        if ((json.time < mrca.time) && (name !== name_list[current_index])) {
                            mrca.time = json.time;
                            mrca.organism_name = name_list[current_index];
                        } // end if
                        current_index++;
                        if (current_index < name_list.length) {
                            progress_bar_subtitle("Searching " + current_index + " of " + name_list.length);
                            update_progress_bar(1);
                            get_next_mrca(self, name, name_list, mrca, current_index);
                        } // end if
                        else {
                            hide_progress_bar(true);
                            self.mrca_proteome.organism_name = mrca.organism_name;
                            self.mrca_proteome.time = mrca.time;
                            let obj    = { };
                            obj.database   =   'moirai_db';
                            obj.table      =   'ncbi_genome';
                            obj.command    =   'select';
                            obj.where      =   [ { "key": "organism_name", "value": mrca.organism_name } ];
                            let json = JSON.stringify(obj);
                            db_guard(json)
                            .then(responseText => {
                                if (responseText && (responseText !== '{ }')) {
                                    self.mrca_proteome.ncbi_record = JSON.parse(responseText);
                                } // end if
                            }) // end then
                            .then(() => {
                                let obj1 = { };
                                let obj2 = { };
                                obj1.database   =   'protein_db';
                                obj1.table      =   'table_metadata';
                                obj1.command    =   'select';
                                obj1.where      =   [ { "key": "id", "value": self.mrca_proteome.organism_name.replace(/ /g, '_') } ];
                                obj2.database   =   'protein_db';
                                obj2.table      =   self.mrca_proteome.organism_name.replace(/ /g, '_');
                                obj2.command    =   "count";
                                let json1 = JSON.stringify(obj1);
                                let json2 = JSON.stringify(obj2);
                                db_guard(json1)
                                .then(responseText => {
                                    if (responseText) {
                                        self.mrca_proteome.protein_record                           =   { };
                                        self.mrca_proteome.protein_record.num_records               =   0;
                                        self.mrca_proteome.protein_record.num_uploaded              =   0;
                                        self.mrca_proteome.protein_record.percent_uploaded          =   0;
                                        self.mrca_proteome.protein_record.metadata                  =   { };
                                        self.mrca_proteome.protein_record.metadata.owner            =   false;
                                        self.mrca_proteome.protein_record.metadata.year             =   0;
                                        self.mrca_proteome.protein_record.metadata.day              =   0;
                                        self.mrca_proteome.protein_record.metadata.hour             =   0;
                                        self.mrca_proteome.protein_record.metadata.minute           =   0;
                                        self.mrca_proteome.protein_record.metadata.second           =   0;
                                        self.mrca_proteome.protein_record.metadata.delta_second     =   0;
                                        self.mrca_proteome.protein_record.options                   =   undefined;
                                        let db_record = JSON.parse(responseText);
                                        if (typeof(db_record.owner       ) !== 'undefined') { self.mrca_proteome.protein_record.metadata.owner          = db_record.owner; }
                                        if (typeof(db_record.records     ) !== 'undefined') { self.mrca_proteome.protein_record.num_records             = parseInt(db_record.records     ); }
                                        if (typeof(db_record.year        ) !== 'undefined') { self.mrca_proteome.protein_record.metadata.year           = parseInt(db_record.year        ); }
                                        if (typeof(db_record.day         ) !== 'undefined') { self.mrca_proteome.protein_record.metadata.day            = parseInt(db_record.day         ); }
                                        if (typeof(db_record.hour        ) !== 'undefined') { self.mrca_proteome.protein_record.metadata.hour           = parseInt(db_record.hour        ); }
                                        if (typeof(db_record.minute      ) !== 'undefined') { self.mrca_proteome.protein_record.metadata.minute         = parseInt(db_record.minute      ); }
                                        if (typeof(db_record.second      ) !== 'undefined') { self.mrca_proteome.protein_record.metadata.second         = parseInt(db_record.second      ); }
                                        if (typeof(db_record.delta_second) !== 'undefined') { self.mrca_proteome.protein_record.metadata.delta_second   = parseInt(db_record.delta_second); }
                                        if (db_record.options) { self.mrca_proteome.protein_record.options = JSON.parse(db_record.options); }
                                    } // end if
                                })
                                .then(() => db_guard(json2))
                                .then(responseText => {
                                    if (responseText) {
                                        let db_record = JSON.parse(responseText);
                                        if (db_record['COUNT(*)']) {
                                            self.mrca_proteome.protein_record.num_uploaded = parseInt(db_record['COUNT(*)']);
                                            if (self.mrca_proteome.protein_record.num_records) {
                                                self.mrca_proteome.protein_record.percent_uploaded = Math.floor((self.mrca_proteome.protein_record.num_uploaded / self.mrca_proteome.protein_record.num_records) * 100);
                                            } // end if
                                        } // end if
                                    } // end if
                                }) // end then
                            }) // end then
                            .then(() => { resolve(); });
                        } // end else
                    } // end if
                    else { get_next_mrca(self, name, name_list, mrca, current_index); }
                } // end if
            }; // end function
            let send_message = "name1=" + self.organism_name;
            send_message += "&name2=" + name_list[current_index];
            xmlhttp.open("POST", "api/MRCA_finder", true);
            xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xmlhttp.send(send_message);
        }; // end function
    }.bind(this));
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_modal = function(text) {
    if (typeof(text) === 'undefined') { text = ''; }
    let modal           =   document.createElement("div");
    let modal_tile      =   document.createElement("div");
    let modal_header    =   document.createElement("div");
    let modal_close     =   document.createElement("span");
    let modal_maximize  =   document.createElement("span");
    let modal_minimize  =   document.createElement("span");
    let modal_clear     =   document.createElement("div");
    let modal_text      =   document.createElement("div");
    modal.style.display = "block";
    modal_tile.style.maxHeight = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) + "px";
    modal_text.style.overflowX = "hidden";
    modal_text.style.overflowY = "auto";
    modal_text.style.maxHeight = ((window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 250) + "px";
    modal_minimize.style.display = "none";
    modal.classList.add("modal");
    modal_tile.classList.add("modal-tile");
    modal_header.classList.add("modal-tile-header");
    modal_close.classList.add("modal-resize-button");
    modal_maximize.classList.add("modal-resize-button");
    modal_minimize.classList.add("modal-resize-button");
    modal_close.innerHTML = '<h4 data-toggle="tooltip" data-placement="auto" title="Close window">&#9746;</h4>';
    modal_maximize.innerHTML = '<h4 data-toggle="tooltip" data-placement="auto" title="Maximize window">&#9744;</h4>';
    modal_minimize.innerHTML = '<h4 data-toggle="tooltip" data-placement="auto" title="Minimize window">_</h4>';
    modal_clear.style.clear = "both";
    modal_text.innerHTML = text;
    modal.appendChild(modal_tile);
    modal_tile.appendChild(modal_header);
    modal_header.appendChild(modal_close);
    modal_header.appendChild(modal_maximize);
    modal_header.appendChild(modal_minimize);
    modal_header.appendChild(modal_clear);
    modal_tile.appendChild(modal_text);
    document.body.appendChild(modal);
    $('[data-toggle="tooltip"]').tooltip();
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENER ////////////////////////////////////////////////////
    modal_close.addEventListener("click", function() {
        document.body.removeChild(modal);
    }.bind(modal)); // end event listener
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENER ////////////////////////////////////////////////////
    modal_maximize.addEventListener("click", function() {
        let max_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        modal_tile.style.width = max_width + "px";
        modal_maximize.style.display = "none";
        modal_minimize.style.display = "block";
    }.bind(modal_tile, modal_maximize, modal_minimize)); // end event listener
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENER ////////////////////////////////////////////////////
    modal_minimize.addEventListener("click", function() {
        modal_tile.style.width = "50%";
        modal_tile.style.height = "auto";
        modal_maximize.style.display = "block";
        modal_minimize.style.display = "none";
    }.bind(modal_tile, modal_maximize, modal_minimize)); // end event listener
    //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_organism_input = function(id) {
    if (typeof(id) === 'undefined') { id = guid(); }
    let area    =   document.createElement("div");
    let card    =   document.createElement("div");
    let input   =   document.createElement("input");
    let center  =   document.createElement("div");
    let w100    =   document.createElement("div");
    let br1     =   document.createElement("br");
    let br2     =   document.createElement("br");
    let h4      =   document.createElement("h4");
    area.id     =   "area-"  + this.id + "-" + id;
    card.id     =   "card-"  + this.id + "-" + id;
    input.id    =   "input-" + this.id + "-" + id;
    area.style.width = "100%";
    w100.style.width = "100%";
    input.style.lineHeight = "default";
    input.style.textAlign = "center";
    area.classList.add("autocomplete");
    center.classList.add("center");
    card.classList.add("dashed-card");
    input.classList.add("input-invisible");
    input.classList.add("input-centered");
    input.classList.add("placeholder-font-awesome");
    input.setAttribute("placeholder", "Species");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", "false");
    area.appendChild(center);
    center.appendChild(card);
    card.appendChild(br1);
    card.appendChild(br2);
    card.appendChild(w100);
    w100.appendChild(h4);
    h4.appendChild(input);
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENER ////////////////////////////////////////////////////
    area.addEventListener("click", function() { input.focus(); });
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENER ////////////////////////////////////////////////////
    input.addEventListener("focus", function() {
        card.style.backgroundColor = theme.light.dark;
        input.style.backgroundColor = theme.light.dark;
        input.style.color = theme.text.light.dark;
        this.last_focus = this.id + "-" + id;
    }); // end event listener
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENER ////////////////////////////////////////////////////
    input.addEventListener("blur", function() {
        card.style.backgroundColor = 'inherit';
        input.style.backgroundColor = 'inherit';
        input.style.color = 'inherit';
    }); // end event listener
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENER ////////////////////////////////////////////////////
    input.addEventListener("change", function() {
        if (input.value) {
            card.style.border = "2px solid " + theme.dark.dark;
        } // end if
        else { card.style.border = "2px dashed " + theme.dark.dark; }
    }); // end event listener
    //////////////////////////////////////////////////////////////////////
    let obj = { };
    obj.id = id;
    obj.area = area;
    obj.card = card;
    obj.input = input;
    return obj;
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_placemat = function(rows) {
    if (typeof(rows) === 'undefined') { rows = 1; }
    let placemat = { };
    placemat.area = document.createElement("div");
    placemat.area.classList.add("placemat");
    for (let i = 1; i <= rows; i++) {
        placemat['row' + i] = document.createElement("div");
        placemat['row' + i].classList.add("row");
        placemat['row' + i].style.minHeight = '170px';
        placemat.area.appendChild(placemat['row' + i]);
    } // end for loop
    return placemat;
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_tile = function(id) {
    if (typeof(id) === 'undefined') { id = guid(); }
    let area    =   document.createElement("div");
    let tile    =   document.createElement("div");
    area.id     =   "area-" + this.id + "-" + id;
    tile.id     =   "tile-" + this.id + "-" + id;
    tile.style.minHeight = "150px";
    tile.classList.add("tile");
    area.appendChild(tile);
    let obj = { };
    obj.id = id;
    obj.area = area;
    obj.tile = tile;
    return obj;
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_action = function(id) {
    //////////////////////////////////////////////////////////////////////
    //
    // This function creates a standard action tile.  An id variable can
    // be supplied to differentiate this action tile if more than one
    // action tile is needed per page.
    //
    // An object with the following elements is returned:
    //
    //  obj.area        <-- the HTML element of the action
    //  obj.tile        <-- the HTML element of the action tile
    //  obj.title       <-- set innerHTML to change the title
    //  obj.text        <-- set innerHTML to change the expandable text
    //  obj.metadata    <-- set the innerHTML to change the displayed metadata
    //  obj.button      <-- the HTML element of the button.  Set innerHTML to change the button text.  Add an event listener to create a behavior
    //  obj.status      <-- the HTML element of the status text (shown below the button)
    //////////////////////////////////////////////////////////////////////
    if (typeof(id) === 'undefined') { id = guid(); }
    let area            =   document.createElement("div");
    let tile            =   document.createElement("div");
    let text_area       =   document.createElement("div");
    let action_area     =   document.createElement("div");
    let left_column     =   document.createElement("div");
    let middle_column   =   document.createElement("div");
    let right_column    =   document.createElement("div");
    let title_area      =   document.createElement("div");
    let title           =   document.createElement("b");
    let expand          =   document.createElement("div");
    let details         =   document.createElement("details");
    let summary         =   document.createElement("summary");
    let blockquote      =   document.createElement("blockquote");
    let button_area     =   document.createElement("div");
    let button          =   document.createElement("button");
    let status          =   document.createElement("div");
    let row             =   document.createElement("div");
    let h4              =   document.createElement("h4");
    let text            =   document.createElement("p");
    let metadata        =   document.createElement("p");
    let option          =   document.createElement("div");
    let center          =   document.createElement("div");
    area.id             =   "area-"         + this.id + "-" + id;
    tile.id             =   "tile-"         + this.id + "-" + id;
    title.id            =   "title-"        + this.id + "-" + id;
    expand.id           =   "expand-"       + this.id + "-" + id;
    button_area.id      =   "button-area-"  + this.id + "-" + id;
    status.id           =   "status-"       + this.id + "-" + id;
    button.id           =   "button-"       + this.id + "-" + id;
    text.id             =   "text-"         + this.id + "-" + id;
    text_area.id        =   "text-area-"    + this.id + "-" + id;
    metadata.id         =   "metadata-"     + this.id + "-" + id;
    option.id           =   "option-"       + this.id + "-" + id;
    tile.style.minHeight = "150px";
    button.style.marginBottom = "10px";
    metadata.style.color = "gray";
    tile.classList.add("tile");
    button.classList.add("btn-lg");
    button.classList.add("btn-outline");
    button.classList.add("btn-block");
    row.classList.add("row");
    left_column.classList.add("col-xl-6");
    left_column.classList.add("col-lg-6");
    left_column.classList.add("col-md-6");
    left_column.classList.add("col-sm-12");
    left_column.classList.add("col-xs-12");
    middle_column.classList.add("col-xl-3");
    middle_column.classList.add("col-lg-3");
    middle_column.classList.add("col-md-3");
    middle_column.classList.add("col-sm-12");
    middle_column.classList.add("col-xs-12");
    right_column.classList.add("col-xl-3");
    right_column.classList.add("col-lg-3");
    right_column.classList.add("col-md-3");
    right_column.classList.add("col-sm-12");
    right_column.classList.add("col-xs-12");
    center.classList.add("center");
    title.innerHTML    = "Title";
    text.innerHTML     = "text";
    button.innerHTML   = "button";
    area.appendChild(tile);
    tile.appendChild(row);
    row.appendChild(left_column);
    row.appendChild(middle_column);
    row.appendChild(right_column);
    left_column.appendChild(text_area);
    text_area.appendChild(title_area);
    title_area.appendChild(h4);
    h4.appendChild(title);
    text_area.appendChild(expand);
    expand.appendChild(details);
    details.appendChild(summary);
    details.appendChild(blockquote);
    blockquote.appendChild(text);
    blockquote.appendChild(metadata);
    middle_column.appendChild(option);
    right_column.appendChild(button_area);
    button_area.appendChild(button);
    button_area.appendChild(center);
    center.appendChild(status);
    let obj = { };
    obj.id = id;
    obj.area = area;
    obj.tile = tile;
    obj.title = title;
    obj.text = text;
    obj.metadata = metadata;
    obj.option = option;
    obj.button = button;
    obj.status = status;
    return obj;
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_search_bar = function(autocomplete_list, id) {
    //////////////////////////////////////////////////////////////////////
    //
    // This function takes a list of autocomplete options and creates
    // a standard autocomplete-enabled search bar.  An id variable can be
    // supplied to differentiate this search bar if more than one search bar
    // is needed per page.
    //
    // An object with the following elements is returned:
    //
    //  search_bar_obj.area             <-- the HTML element of the search bar
    //  search_bar_obj.input            <-- the HTML element of the input field
    //  search_bar_obj.button.callback  <-- add a callback to create behavior when the search button is clicked
    //  search_bar_obj.term             <-- the current search term
    //
    //////////////////////////////////////////////////////////////////////
    if (!autocomplete_list) { autocomplete_list = false; }
    if (typeof(id) === 'undefined') { id = guid(); }
    let search_bar = document.createElement("div");
    // Table search HTML
    let search_bar_html = '<h4>';
    search_bar_html += '<div class="row">';
    search_bar_html += '<div class="col-xl-9 col-lg-9 col-md-9 col-sm-9 col-xs-12">';
    search_bar_html += '<div class="form-group" id="search-group-' + this.id + '-' + id + '">';
    search_bar_html += '<div class="autocomplete">';
    search_bar_html += '<input type="text" class="form-control input-lg input-outline placeholder-font-awesome" id="search-input-' + this.id + '-' + id + '" name="search"  value="" placeholder="&#xf002; Search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">';
    search_bar_html += '</div>'; // end autocomplete
    search_bar_html += '</div>'; // end form-group
    search_bar_html += '</div>'; // end column
    search_bar_html += '<div class="col-xl-3 col-lg-3 col-md-3 col-sm-3 col-xs-12">';
    search_bar_html += '<div class="center">';
    search_bar_html += '<button class="btn btn-outline btn-lg btn-block" id="submit-button-' + this.id + '-' + id + '">';
    search_bar_html += 'Search';
    search_bar_html += '</button>';
    search_bar_html += '</div>'; // end center
    search_bar_html += '<div class="mobile-site"><br></div>';
    search_bar_html += '</div>'; // end column
    search_bar_html += '</div>'; // end row
    search_bar_html += '</h4>';
    search_bar.id = 'table-search-area-' + this.id + '-' + id;
    search_bar.innerHTML = search_bar_html;
    let search_bar_input = search_bar.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0];
    let search_bar_submit = search_bar.childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0];
    if (autocomplete_list) { autocomplete(search_bar_input, autocomplete_list); }
    let search_bar_obj  = { };
    search_bar_obj.id     = id;
    search_bar_obj.area   = search_bar;
    search_bar_obj.input  = search_bar_input;
    search_bar_obj.button = search_bar_submit;
    search_bar_obj.button.callback = undefined;
    search_bar_obj.term = '';
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENER ////////////////////////////////////////////////////
    search_bar_obj.button.addEventListener("click", function() {
        this.blur();
        search_bar_obj.term = search_bar_obj.input.value;
        if (search_bar_obj.button.callback) { search_bar_obj.button.callback(search_bar_obj.term); }
    }); // end event listener
    //////////////////////////////////////////////////////////////////////
    return search_bar_obj;
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_table = function(data, rows, id) {
    //////////////////////////////////////////////////////////////////////
    //
    // This function takes a data structure and displays a table based
    // on the data.  The data structure is assumed to be an array of
    // objects.  Each object in the array represents the information
    // to be displayed in the rows of the table.  The first element is
    // assumed to be an ID that is sent to the callback function each time
    // the associated row is clicked.  The remaining element(s) will be
    // displayed along the row, and used to generate the proper number of
    // table columns (maximum of four).  The number of columns then is:
    //      let columns = Object.keys(data[0]).length - 1
    //      if (columns > 4) { columns = 4; }
    // A rows variable can be supplied to adjust the number of rows
    // displayed per table.  Also, an id variable can be supplied to
    // differentiate this table if more than one table is needed per
    // page.
    //
    // An object with the following elements is returned:
    //
    //  table_obj.row.callback                  <-- add a callback to create behavior when a row is clicked
    //  table_obj.column.area                   <-- HTML elements for column titles
    //  table_obj.column.text                   <-- set innerHTML to change column titles
    //  table_obj.column.direction              <-- the direction icon for each column title
    //  table_obj.column.callback               <-- add a callback to create behavior when a column title is clicked
    //  table_obj.keys                          <-- the key structure of the data displayed in the table
    //  table_obj.page                          <-- the current page
    //  table_obj.num_pages                     <-- the total number of pages
    //  table_obj.pagination.next.callback      <-- add a callback to create behavior when the next button is clicked
    //  table_obj.pagination.previous.callback  <-- add a callback to create behavior when  the previous button is clicked
    //
    //////////////////////////////////////////////////////////////////////
    if (typeof(data) === 'undefined') { return undefined; }
    if (!rows) { rows = 10; }
    if (typeof(id  ) === 'undefined') { id = guid(); }
    let columns = Object.keys(data[0]).length - 1;
    if (columns > 4) { columns = 4; }
    let column_size = 12 / columns;
    let table_obj = { };
    table_obj.row = { };
    table_obj.row.callback = undefined;
    table_obj.column = { };
    table_obj.column.area = [];
    table_obj.column.text = [];
    table_obj.column.direction = [];
    table_obj.column.callback = undefined;
    table_obj.keys = Object.keys(data[0]);
    table_obj.page = 0;
    table_obj.num_pages = Math.ceil(data.length / rows);
    table_obj.pagination = { };
    table_obj.pagination.next = { };
    table_obj.pagination.previous = { };
    table_obj.pagination.next.callback = undefined;
    table_obj.pagination.previous.callback = undefined;
    // establish the default sort
    data.sort(function(a, b) {
        if (a[table_obj.keys[1]] < b[table_obj.keys[1]]) { return -1; }
        if (a[table_obj.keys[1]] > b[table_obj.keys[1]]) { return  1; }
        return 0;
    });
    let table_area       = document.createElement("div");
    let table_tile       = document.createElement("div");
    let table_header     = document.createElement("div");
    let table_rows       = document.createElement("div");
    let table_pagination = document.createElement("div");
    table_area.id        = 'table-area-' + this.id + '-' + id;
    table_area.id        = 'table-tile-' + this.id + '-' + id;
    table_header.id      = 'table-header-' + this.id + '-' + id;
    table_rows.id        = 'table-rows-' + this.id + '-' + id;
    table_pagination.id  = 'table-pagination-' + this.id + '-' + id;
    table_tile.classList.add('tile');
    table_tile.classList.add('tile-slim');
    table_tile.classList.add('tile-outline');
    table_tile.classList.add('table-primary');
    table_tile.classList.add('width-100');
    table_header.classList.add('table-header');
    table_area.style.minHeight = '300px';
    let table_area_html       = '';
    let table_header_html     = '';
    let table_rows_html       = '';
    let table_pagination_html = '';
    // Table header HTML
    table_header_html += '<div class="row">';
    for (let i = 0; i < columns; i++) {
        if (i > 0) { table_header_html += '<div class="desktop-site">'; }
        table_header_html += '<div class="col-xl-' + column_size + ' col-lg-' + column_size + ' col-md-' + column_size + ' col-sm-' + column_size + ' col-xs-12">';
        if (i == 0) { table_header_html += '<div class="table-title table-element overflow-wrap padding-left-55" id="column-area-' + i + '-' + this.id + '-' + id + '" data-value="' + i + '">'; }
        else { table_header_html += '<div class="table-title table-element overflow-wrap" id="column-area-' + i + '-' + this.id + '-' + id + '" data-value="' + i + '">'; }
        table_header_html += '<h4>';
        table_header_html += '<b>';
        table_header_html += '<span id="column-' + i + '-text-' + this.id + '-' + id + '" class="noselect">' + table_obj.keys[i + 1] + '</span>';
        table_header_html += '&nbsp;&nbsp;';
        table_header_html += '<span id="column-' + i + '-direction-' + this.id + '-' + id + '" class="noselect">';
        if (i == 0) { table_header_html += '<i class="fa fa-arrow-down" aria-hidden="true"></i>'; }
        table_header_html += '</span>';
        table_header_html += '</b>';
        table_header_html += '</h4>';
        table_header_html += '</div>'; // end table-element
        table_header_html += '</div>'; // end column
        if (i > 0) { table_header_html += '</div>'; } // end desktop-site
    } // end for loop
    table_header_html += '</div>'; // end row
    table_header.innerHTML = table_header_html;
    // construct the object
    table_obj.id     = id;
    table_obj.area   = table_area;
    table_obj.tile   = table_tile;
    table_obj.header = table_header;
    table_obj.rows   = table_rows;
    table_area.appendChild(table_tile);
    table_tile.appendChild(table_header);
    create_table_update_rows();
    create_table_update_pagination();
    // get column elements for table_obj
    let column_root = table_header.childNodes[0];
    for (let i = 0; i < columns; i++) {
        if (i > 0) { table_obj.column.area.push(column_root.childNodes[i].childNodes[0].childNodes[0]); }
        else { table_obj.column.area.push(column_root.childNodes[i].childNodes[0]); }
        table_obj.column.text.push(table_obj.column.area[i].childNodes[0].childNodes[0].childNodes[0]);
        table_obj.column.direction.push(table_obj.column.area[i].childNodes[0].childNodes[0].childNodes[2]);
        //////////////////////////////////////////////////////////////////////
        // EVENT LISTENER ////////////////////////////////////////////////////
        // establish the default column sort behavior
        table_obj.column.area[i].addEventListener("click", function() {
            let direction = 'ASC';
            if (table_obj.column.direction[i].innerHTML == '<i class="fa fa-arrow-down" aria-hidden="true"></i>') {
                table_obj.column.direction[i].innerHTML = '<i class="fa fa-arrow-up" aria-hidden="true"></i>';
                direction = 'DESC';
            } // end if
            else if (table_obj.column.direction[i].innerHTML == '<i class="fa fa-arrow-up" aria-hidden="true"></i>') {
                table_obj.column.direction[i].innerHTML = '<i class="fa fa-arrow-down" aria-hidden="true"></i>';
                direction = 'ASC';
            } // end else if
            else {
                for (let j = 0; j < table_obj.column.direction.length; j++) { table_obj.column.direction[j].innerHTML = ''; }
                table_obj.column.direction[i].innerHTML = '<i class="fa fa-arrow-down" aria-hidden="true"></i>';
                direction = 'ASC';
            } // end if
            if (table_obj.column.callback) { table_obj.column.callback(i, direction); }
            if (direction == 'ASC') {
                data.sort(function(a, b) {
                    if (a[table_obj.keys[i + 1]] < b[table_obj.keys[i + 1]]) { return -1; }
                    if (a[table_obj.keys[i + 1]] > b[table_obj.keys[i + 1]]) { return 1; }
                    return 0;
                });
            } // end if
            if (direction == 'DESC') {
                data.sort(function(a, b) {
                    if (a[table_obj.keys[i + 1]] < b[table_obj.keys[i + 1]]) { return  1; }
                    if (a[table_obj.keys[i + 1]] > b[table_obj.keys[i + 1]]) { return -1; }
                    return 0;
                });
            } // end if
            create_table_update_rows();
        }.bind(table_obj, i));
        //////////////////////////////////////////////////////////////////
    } // end for loop
    // return the table object
    return table_obj;
    //////////////////////////////////////////////////////////////////////
    // METHODS ///////////////////////////////////////////////////////////
    function create_table_update_rows() {
        if (table_tile.contains(table_rows)) { table_tile.removeChild(table_rows); }
        while (table_rows.firstChild) { table_rows.removeChild(table_rows.firstChild); }
        for (let r = (table_obj.page * rows); r < (table_obj.page * rows) + rows; r++) {
            if (r < data.length) {
                let new_row = document.createElement("div");
                new_row.classList.add('table-row');
                new_row.classList.add('table-entry');
                new_row.classList.add('noselect');
                new_row.setAttribute('data-value', data[r][table_obj.keys[0]]);
                table_rows_html = '';
                table_rows_html += '<div class="row">';
                for (let i = 1; i < Object.keys(data[0]).length; i++) {
                    if (i > 1) { table_rows_html += '<div class="desktop-site">'; }
                    table_rows_html += '<div class="col-xl-' + column_size + ' col-lg-' + column_size + ' col-md-' + column_size + ' col-sm-' + column_size + ' col-xs-12">';
                    if (i == 1) { table_rows_html += '<div class="table-element overflow-wrap padding-left-55">'; }
                    else { table_rows_html += '<div class="table-element ellipsis">'; }
                    table_rows_html += '<p>';
                    table_rows_html += data[r][table_obj.keys[i]];
                    table_rows_html += '</p>';
                    table_rows_html += '</div>'; // end table-element
                    table_rows_html += '</div>'; // end column
                    if (i > 1) { table_rows_html += '</div>'; } // end desktop-site
                } // end for loop
                table_rows_html += '</div>'; // end row
                new_row.innerHTML = table_rows_html;
                table_rows.appendChild(new_row);
                new_row.addEventListener("click", function() {
                    if (table_obj.row.callback) { table_obj.row.callback(this.getAttribute('data-value')); }
                }); // end event listener
            } // end if
        } // end for loop
        table_tile.appendChild(table_rows);
    } // end function
    //////////////////////////////////////////////////////////////////////
    function create_table_update_pagination() {
        if (table_area.contains(table_pagination)) { table_area.removeChild(table_pagination); }
        while (table_pagination.firstChild) { table_pagination.removeChild(table_pagination.firstChild); }
        let element_center = document.createElement("div");
        let element_nav = document.createElement("nav");
        let element_ul  = document.createElement("ul");
        let element_li1 = document.createElement("li");
        let element_li2 = document.createElement("li");
        let previous    = document.createElement("a");
        let next        = document.createElement("a");
        element_center.classList.add('center');
        element_ul.classList.add('pagination');
        element_ul.classList.add('pagination-lg');
        element_li1.classList.add('page-item');
        element_li2.classList.add('page-item');
        previous.classList.add('page-link');
        previous.classList.add('pagination-outline');
        previous.classList.add('noselect');
        next.classList.add('page-link');
        next.classList.add('pagination-outline');
        next.classList.add('noselect');
        previous.id = 'table-previous-btn-' + this.id + '-' + id;
        next.id = 'table-previous-btn-' + this.id + '-' + id;
        previous.value = table_obj.page - 1;
        next.value = table_obj.page + 1;
        table_pagination.appendChild(element_center);
        element_center.appendChild(element_nav);
        element_nav.appendChild(element_ul);
        if (table_obj.num_pages > 1) {
            if (table_obj.page > 0) {
                element_ul.appendChild(element_li1);
                element_li1.appendChild(previous);
                previous.innerHTML = 'Previous';
            } // end if
            if (table_obj.page != (table_obj.num_pages - 1)) {
                element_ul.appendChild(element_li2);
                element_li2.appendChild(next);
                next.innerHTML = 'Next';
            } // end if
        } // end if
        table_area.appendChild(table_pagination);
        table_obj.pagination.previous.button = previous;
        table_obj.pagination.next.button = next;
        //////////////////////////////////////////////////////////////////
        // EVENT LISTENER ////////////////////////////////////////////////
        previous.addEventListener("click", function() {
            table_obj.page = parseInt(this.value);
            create_table_update_rows();
            create_table_update_pagination();
            if (table_obj.pagination.previous.callback) { table_obj.pagination.previous.callback(table_obj.page); }
        }); // end event listener
        //////////////////////////////////////////////////////////////////
        // EVENT LISTENER ////////////////////////////////////////////////
        next.addEventListener("click", function() {
            table_obj.page = parseInt(this.value);
            create_table_update_rows();
            create_table_update_pagination();
            if (table_obj.pagination.next.callback) { table_obj.pagination.next.callback(table_obj.page); }
        }); // end event listener
        //////////////////////////////////////////////////////////////////
    } // end function
    //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
// ACTIONS ////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_protein_import = function(element_id, callback, note) {
    if (element_id) {
        let element_check = document.getElementById(element_id);
        if (element_check) {
            while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
            element_check.innerHTML = '';
        } // end if
        else { return; }
    } // end if
    else { element_id = false; }
    if (callback) { this.actions.protein_import.callback = callback; }
    let action = this.create_action(this.actions.protein_import.id);
    let title = 'Import Proteins';
    if (note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
    action.title.innerHTML = title;
    action.text.innerHTML = "The protein file maintained by the National Center for Biotechnology Information (NCBI) contains the complete amino acid sequences of every currently known protein made by this organism.   This files is fairly large, and the process of importing its contents to our local database may take up to several hours.  If the browser tab or window is closed after the importing process has started, any progress will be saved and the process can be resumed from this page.";
    action.button.innerHTML = "Import";
    action.button.style.display = "none";
    action.status.innerHTML = '<div class="loading"><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div></div>';
    if (element_id) {
        document.getElementById(element_id).appendChild(action.area);
        this.html_element.protein_import = document.getElementById(element_id);
        this.html_element.protein_import.style.display = "block";
    } // end if
    else { document.body.appendChild(action.area); }
    $('[data-toggle="tooltip"]').tooltip();
    this.get_ncbi_record()
    .then(() => { this.get_protein_record(); });
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENERS ///////////////////////////////////////////////////
    action.button.addEventListener("click", function() {
        action.button.blur();
        this.protein_record.metadata.delta_second = 1;
        let protein_obj = { };
        protein_obj.id           = guid();
        protein_obj.filename     = protein_obj.id + ".fa.gz";
        protein_obj.source       = this.ncbi_record.protein_url;
        protein_obj.target       = "../temporary/" + protein_obj.filename;
        protein_obj.file_state   = "erase";
        protein_obj.database     = "protein_db";
        protein_obj.table        = this.organism_name.replace(/ /g, "_");
        protein_obj.data         = "";
        protein_obj.num_records  = this.protein_record.num_records;
        protein_obj.num_uploaded = this.protein_record.num_uploaded;
        //////////////////////////////////////////////////////////////////
        // ON BEFORE UNLOAD //////////////////////////////////////////////
        this.actions.protein_import.cleanup = function(evt) {
            evt.preventDefault();
            evt.returnValue = null;
            protein_obj.filename = protein_obj.id + ".fa.gz";
            erase_file(protein_obj);
            protein_obj.filename = protein_obj.id + ".fa";
            erase_file(protein_obj);
        };
        window.addEventListener('beforeunload', this.actions.protein_import.cleanup);
        //////////////////////////////////////////////////////////////////
        update_metadata(protein_obj)
        .then(import_file)
        .then(decompress_gzip)
        .then(open_file)
        .then(parse_FASTA)
        .then(update_metadata)
        .then(d => { this.protein_record.num_records = d.num_records; return d; })
        .then(d => FASTA_to_db(d, function(delta) {
            if (typeof(delta) === 'undefined') { delta = 0; }
            this.protein_record.num_uploaded = this.protein_record.num_uploaded + delta;
            this.protein_record.percent_uploaded = Math.floor((this.protein_record.num_uploaded / this.protein_record.num_records) * 100);
            this.update();
        }.bind(this)))
        .catch(e => {
            if (bioaction.actions.protein_import.cleanup) {
                window.removeEventListener('beforeunload', bioaction.actions.protein_import.cleanup);
                bioaction.actions.protein_import.cleanup = undefined;
            } // end if
            protein_obj.filename = protein_obj.id + ".fa.gz";
            erase_file(protein_obj);
            protein_obj.filename = protein_obj.id + ".fa";
            erase_file(protein_obj);
            hide_loading_box(true);
            this.create_modal('<div class="center"><h4>Could not import file</h4></div>');
        }); // end catch
    }.bind(this));
    //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_protein_statistics = function(element_id, callback, note) {
    if (element_id) {
        let element_check = document.getElementById(element_id);
        if (element_check) {
            while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
            element_check.innerHTML = '';
        } // end if
        else { return; }
    } // end if
    else { element_id = false; }
    if (callback) { this.actions.protein_statistics.callback = callback; }
    let action = this.create_action(this.actions.protein_statistics.id);
    let title = 'Protein Statistics';
    if (note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
    action.title.innerHTML = title;
    action.text.innerHTML = "This action calculates the distribution of protein sequence lengths for the organism, as well as the relevant descriptive statistics.";
    action.button.innerHTML = "Calculate";
    if (element_id) {
        document.getElementById(element_id).appendChild(action.area);
        this.html_element.protein_import = document.getElementById(element_id);
        this.html_element.protein_import.style.display = "block";
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
    option += '<input type="checkbox" id="slider-checkbox-' + this.actions.protein_statistics.id + '-' + this.id + '" value="1">';
    option += '<span class="slider round"></span>';
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
        let element_check = document.getElementById('slider-checkbox-' + this.actions.protein_statistics.id + '-' + this.id);
        if (element_check) { filter = element_check.checked; }
        let obj = { };
        obj.database   =    'protein_db';
        obj.table      =    this.organism_name.replace(/ /g, '_');
        obj.command    =    "select_all";
        obj.columns    =    [ { key: "defline" }, { key: "sequence" } ];
        obj.limit      =    this.protein_record.num_records;
        let json       =    JSON.stringify(obj);
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
                let desc = stats.description();
                let modal_text = '';
                modal_text += '<div class="desktop-site">';
                modal_text += '<div class="center"><p class="standard-text"><b>Protein Length Histogram</b></p></div>';
                modal_text += '<div id="histogram"></div>';
                modal_text += '</div>'; // end desktop-site
                modal_text += '<div id="histogram-statistics">';
                modal_text += '<p><b>Number of Proteins:</b> ' + desc.n  + '</p>';
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
                modal_text += '<br><br>';
                modal_text += '<div class="desktop-site">';
                modal_text += '<div style="border-bottom: 1px solid silver; width: 100%;"></div>';
                modal_text += '<br><br>';
                modal_text += '<div class="center"><p class="standard-text"><b>Amino Acid Quantity Bar Graph</b></p></div>';
                modal_text += '<div id="bar-graph" class="center"></div>';
                modal_text += '</div>'; // end desktop-site
                hide_loading_box(true);
                this.create_modal(modal_text);
                let histogram_options = { };
                histogram_options.x_label = "Protein Length (amino acids)";
                histogram_options.y_label = "Number of Proteins";
                let bar_graph_options = { };
                bar_graph_options.x_label = "Amino Acids";
                bar_graph_options.y_label = "Number Among all Proteins";
                d3_histogram(distribution, 'histogram', histogram_options);
                d3_bar_graph(aa_distribution, 'bar-graph', bar_graph_options);
                $('[data-toggle="tooltip"]').tooltip();
            } // end if
        });
    }.bind(this));
    //////////////////////////////////////////////////////////////////////
} // end method
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_protein_table = function(element_id, list) {
    return new Promise(function(resolve, reject) {
        if (!element_id) { element_id = false; }
        if (!list) { list = false; }
        if (this.tables.protein.id) { return; }
        if (element_id) {
            let element_check = document.getElementById(element_id);
            if (element_check) {
                while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
                element_check.innerHTML = '';
            } // end if
            else { resolve(); }
        } // end if
        create_loading_box(this.loading_box_text.working, true, 15000, true);
        let autocomplete_list = [ ];
        let search_bar = null;
        let table      = null;
        if (this.organism_name) {
            let obj = { };
            obj.database    =   'protein_db';
            obj.table       =   this.organism_name.replace(/ /g, '_');
            obj.command     =   "select_all";
            obj.columns     =   [ { key: "id" }, { key: "defline" }, { key: "char_length" } ];
            obj.limit       =   this.protein_record.num_records;
            let json        =   JSON.stringify(obj);
            db_guard(json)
            .then(responseText => {
                this.tables.protein.data = JSON.parse(responseText);
                for (let i = 0; i < this.tables.protein.data.length; i++) {
                    autocomplete_list.push(this.tables.protein.data[i].defline);
                    this.tables.protein.data[i].char_length = parseInt(this.tables.protein.data[i].char_length);
                } // end for loop
                search_bar = this.create_search_bar(autocomplete_list, this.tables.protein.id);
                if (list) { table = this.create_table(list, null, this.tables.protein.id); }
                else { table = this.create_table(this.tables.protein.data, null, this.tables.protein.id); }
                if (element_id) {
                    document.getElementById(element_id).appendChild(search_bar.area);
                    document.getElementById(element_id).appendChild(table.area);
                    this.html_element.protein_table = document.getElementById(element_id);
                } // end if
                else {
                    document.body.appendChild(search_bar.area);
                    document.body.appendChild(table.area);
                } // end else
                table.column.text[0].innerHTML = 'Protein';
                table.column.text[1].innerHTML = 'Length (aa)';
                //////////////////////////////////////////////////////////
                // CALLBACKS /////////////////////////////////////////////
                search_bar.button.callback = function() {
                    create_loading_box("Searching", true);
                    let term = search_bar.input.value;
                    let obj = { };
                    obj.database   =    'protein_db';
                    obj.table      =    this.organism_name.replace(/ /g, '_');
                    obj.command    =    "search";
                    obj.columns    =    [ { key: "id" }, { key: "defline" }, { key: "char_length" } ];
                    obj.where      =    [ { key: "defline", value: term } ];
                    let json       =    JSON.stringify(obj);
                    db_guard(json)
                    .then(responseText => {
                        hide_loading_box(true);
                        if (responseText) {
                            list = JSON.parse(responseText);
                            this.create_protein_table(element_id, list);
                        } // end if
                    });
                }.bind(this, element_id); // end callback function
                //////////////////////////////////////////////////////////
                table.row.callback = function(id) {
                    let obj = { };
                    obj.database   =    'protein_db';
                    obj.table      =    this.organism_name.replace(/ /g, '_');
                    obj.command    =    "search";
                    obj.where      =    [ { key: "id", value: id } ];
                    let json       =    JSON.stringify(obj);
                    db_guard(json)
                    .then(responseText => {
                        if (responseText) {
                            let protein = JSON.parse(responseText);
                            let modal_text = '';
                            modal_text += '<p><b>Name:</b> ' + protein[0].defline + '</p>';
                            modal_text += '<p><b>Accession Number:</b> ' + protein[0].accession + '</p>';
                            modal_text += '<p><b>Sequence:</b> </p>';
                            modal_text += '<p>' + protein[0].sequence + '</p>';
                            this.create_modal(modal_text);
                        } // end if
                    }); // end then
                }.bind(this);
                //////////////////////////////////////////////////////////
                hide_loading_box(true);
                resolve();
            }); // end then
        } // end if
    }.bind(this)); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_blastp_index = function(element_id, callback, note) {
    if (element_id) {
        let element_check = document.getElementById(element_id);
        if (element_check) {
            while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
            element_check.innerHTML = '';
        } // end if
        else { return; }
    } // end if
    else { element_id = false; }
    if (callback) { this.actions.blastp_index.callback = callback; }
    let action = this.create_action(this.actions.blastp_index.id);
    let title = 'Index Proteins';
    if (note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
    action.title.innerHTML = title;
    action.text.innerHTML = "Before protein records can be searched for sequence similarities, the protein records must be indexed for ease of use.  ";
    action.text.innerHTML += "This process looks for kmers (short amino acid sequences) of length 4 and records the ID of the protein sequence in which they were found.  ";
    action.text.innerHTML += "If the browser tab or window is closed after the indexing process has started, any progress will be saved and the process can be resumed from this page.";
    action.button.innerHTML = "Index";
    action.button.style.display = "none";
    action.status.innerHTML = '<div class="loading"><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div></div>';
    if (element_id) {
        document.getElementById(element_id).appendChild(action.area);
        this.html_element.blastp_index = document.getElementById(element_id);
        this.html_element.blastp_index.style.display = "block";
    } // end if
    else { document.body.appendChild(action.area); }
    $('[data-toggle="tooltip"]').tooltip();
    this.get_blastp_record();
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENERS ///////////////////////////////////////////////////
    action.button.addEventListener("click", function() {
        action.button.blur();
        this.blastp_record.metadata.delta_second = 1;
        hide_loading_box(true);
        create_loading_box("Updating records", true);
        let obj = { };
        let metaObj = { };
        try {
            metaObj.command     = "update_metadata";
            metaObj.database    = "blastp_db";
            metaObj.table       = this.organism_name.replace(/ /g, "_");
            metaObj.num_records = this.blastp_record.num_records ? this.blastp_record.num_records : 0;
            metaObj.status      = "success";
            update_metadata(metaObj)
            .then(() => {
                this.update();
                hide_loading_box(true);
                create_loading_box("Finding records", true);
                obj = { };
                obj.database   =    "blastp_db";
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
                        this.blastp_record.num_records = record.records;
                        obj = { };
                        obj.database   =    'protein_db';
                        obj.table      =    this.organism_name.replace(/ /g, '_');
                        obj.command    =    "select_all";
                        obj.columns    =    [ { key: "id" }, { key: "sequence" } ];
                        obj.limit      =    this.protein_record.num_records;
                        let json       =    JSON.stringify(obj);
                        db_guard(json)
                        .then(responseText => {
                            hide_loading_box(true);
                            if (responseText) {
                                let data = JSON.parse(responseText);
                                create_progress_bar("Step 1 of 2: Indexing records", true, data.length);
                                let bioWorker = new Worker(current_base_url + '/workers/js/blastp_index.js');
                                let job = { status: 'index', command: 'create', organism_name: this.organism_name, data: data, num_uploaded: this.blastp_record.num_uploaded };
                                bioWorker.postMessage(job);
                                bioWorker.onmessage = function(e) {
                                    switch(e.data.status) {
                                        case 'step1': {
                                            progress_bar_subtitle("Record " + e.data.work + " of " + data.length);
                                            update_progress_bar(1);
                                            break;
                                        } // end case
                                        case 'step2': {
                                            this.blastp_record.num_records = e.data.work;
                                            metaObj.num_records = this.blastp_record.num_records;
                                            update_metadata(metaObj);
                                            reset_progress_bar(this.blastp_record.num_records);
                                            show_progress_bar();
                                            progress_bar_text("Step 2 of 2: Saving records");
                                            update_progress_bar(this.blastp_record.num_uploaded);
                                            break;
                                        } // end case
                                        case 'step3': {
                                            update_progress_bar(1);
                                            progress_bar_subtitle("Record " + e.data.work + " of " + this.blastp_record.num_records);
                                            this.blastp_record.num_uploaded++;
                                            this.blastp_record.percent_uploaded = Math.floor((this.blastp_record.num_uploaded / this.blastp_record.num_records) * 100);
                                            update_metadata(metaObj);
                                            this.update();
                                            break;
                                        } // end case
                                        case 'step4': {
                                            hide_progress_bar();
                                            this.update();
                                            bioWorker.terminate();
                                            break;
                                        } // end case
                                        case 'error': {
                                            hide_progress_bar();
                                            this.create_modal(e.data.work);
                                            break;
                                        } // end case
                                    } // end switch
                                }.bind(this) // end onmessage
                            } // end if
                        }) // end then
                    } // end if
                }) // end then
            }); // end then
        } // end try
        catch(err) { hide_loading_box(true); console.log("Error!"); return; }
    }.bind(this)); // end event listener
    //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_blastn_index = function(element_id, callback, note) {
    if (element_id) {
        let element_check = document.getElementById(element_id);
        if (element_check) {
            while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
            element_check.innerHTML = '';
        } // end if
        else { return; }
    } // end if
    else { element_id = false; }
    if (callback) { this.actions.blastn_index.callback = callback; }
    let action = this.create_action(this.actions.blastn_index.id);
    let title = 'Index Genome';
    if (note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
    action.title.innerHTML = title;
    action.text.innerHTML = "Before genomes can be searched for sequence similarities, each genome must be indexed for ease of use.  ";
    action.text.innerHTML += "This process looks for kmers (short nucleotide sequences) of length 8 and records their place in the genome.  ";
    action.text.innerHTML += "This length is shorter than is often used in bioinformatic techniques (often a length of 11 nucleotides is used).  ";
    action.text.innerHTML += "This shorter length was chosen to keep the total database table creation time acceptably short.  ";
    action.text.innerHTML += "To compensate for the shorter kmer size, the upper half of the kmer distribution (the more frequently-found kmers) is discarded."
    action.button.innerHTML = "Index";
    action.button.style.display = "none";
    action.status.innerHTML = '<div class="loading"><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div></div>';
    if (element_id) {
        document.getElementById(element_id).appendChild(action.area);
        this.html_element.blastn_index = document.getElementById(element_id);
        this.html_element.blastn_index.style.display = "block";
    } // end if
    else { document.body.appendChild(action.area); }
    $('[data-toggle="tooltip"]').tooltip();
    this.get_blastn_record();
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENERS ///////////////////////////////////////////////////
    action.button.addEventListener("click", function() {
        action.button.blur();
        this.blastn_record.metadata.delta_second = 1;
        hide_loading_box(true);
        create_loading_box("Updating records", true);
        let obj = { };
        let metaObj = { };
        let bioWorker = new Worker(current_base_url + '/workers/js/blastn_index.js?version=' + guid());
        try {
            metaObj.command     = "update_metadata";
            metaObj.database    = "blastn_db";
            metaObj.table       = this.organism_name.replace(/ /g, "_");
            metaObj.num_records = 65536;
            metaObj.status      = "success";
            update_metadata(metaObj)
            .then(() => {
                this.update();
                hide_loading_box(true);
                create_loading_box("Finding records", true);
                obj = { };
                obj.database   =    "blastn_db";
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
                        this.blastn_record.num_records = record.records;
                        obj = { };
                        obj.database        =   'dna_db';
                        obj.table           =   this.organism_name.replace(/ /g, '_');
                        obj.command         =   "select_all";
                        obj.columns         =   [ { key: "id" }, { key: "sequence" } ];
                        obj.limit           =   this.genome_record.num_records;
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
                    } // end if
                }); // end then
            }); // end then
        } // end try
        catch(err) { hide_loading_box(true); console.log("Error!"); return; }
    }.bind(this)); // end event listener
    //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_cross_species_protein_map = function(element_id, callback, note) {
    if (element_id) {
        let element_check = document.getElementById(element_id);
        if (element_check) {
            while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
            element_check.innerHTML = '';
        } // end if
        else { return; }
    } // end if
    else { element_id = false; }
    if (callback) { this.actions.cross_species_protein_map.callback = callback; }
    let action = this.create_action(this.actions.cross_species_protein_map.id);
    let title = 'Cross-species Protein Map';
    if (note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
    action.title.innerHTML = title;
    let description = "<p>This function identifies related proteins between two species (orthologs) using a custom in-house implementation of BLAST<sup>[1]</sup>.  The resulting ortholog relationships are then recorded in our database for future use.</p>";
    description += "<p>Technical information:  The custom gapped BLAST search uses the BLOSUM80 scoring matrix, a word size of 3, a neighborhood word score threshold of 11, and an expect threshold of 0.001.  Low complexity regions of the query sequences are filtered by soft masking using the SEG algorithm<sup>[2, 3]</sup>.  ";
    description += "To increase BLAST search speed for the browser, the pool of subject sequences is reduced prior to each search to contain only proteins with a sequence identity of 80% or higher.  This reduction in search pool size is accomplished by filtering based on the short-word identity score using a word length of 4 and a tolerance of 99%<sup>[4]</sup>.</p>";
    description += "<p>[1] Altschul, S. F., Gish, W., Miller, W., Myers, E. W., & Lipman, D. J. (1990). Basic local alignment search tool. Journal of molecular biology, 215(3), 403-410.</p>";
    description += "<p>[2] Wootton, J. C., & Federhen, S. (1993). Statistics of local complexity in amino acid sequences and sequence databases. Computers & chemistry, 17(2), 149-163.</p>";
    description += "<p>[3] Wootton, J. C., & Federhen, S. (1996). [33] Analysis of compositionally biased regions in sequence databases. In Methods in enzymology (Vol. 266, pp. 554-571). Academic Press.</p>";
    description += "<p>[4] Li, W., Jaroszewski, L., & Godzik, A. (2002). Tolerating some redundancy significantly speeds up clustering of large protein databases. Bioinformatics, 18(1), 77-82.</p>";
    action.text.innerHTML = description;
    action.button.innerHTML = "Map";
    action.button.style.display = "none";
    action.status.innerHTML = '<div class="loading"><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div></div>';
    let tooltip = { };
    tooltip.cache = "This is an option to cache the relevant database tables prior to mapping proteins.  When this option is turned on, a sizable amount of information will be downloaded to your computer at the beginning of the process.  Caching sometimes speeds the overall mapping process on computers with a slower Internet connection.  However, caching may cause the browser to crash or become unresponsive if runtime memory is limited.";
    let option_area = '';
    option_area += '<div id="slider-text">';
    option_area += '<div class="center">';
    option_area += '<p class="standard-text">Cache <i class="fa fa-question-circle color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + tooltip.cache + '"></i></p>';
    option_area += '</div>'; // end center
    option_area += '</div>'; // end slider-text
    option_area += '<div class="center">';
    option_area += '<label class="switch">';
    option_area += '<input type="checkbox" id="slider-checkbox-' + this.actions.cross_species_protein_map.id + '-' + this.id + '" value="1">';
    option_area += '<span class="slider round"></span>';
    option_area += '</label>';
    option_area += '</div>'; // end center
    option_area += '<div class="center">';
    option_area += '<div id="slider-subtitle">';
    option_area += '</div>'; // end slider-subtitle
    option_area += '</div>'; // end center
    action.option.innerHTML = option_area;
    if (element_id) {
        document.getElementById(element_id).appendChild(action.area);
        this.html_element.cross_species_protein_map = document.getElementById(element_id);
        this.html_element.cross_species_protein_map.style.display = "block";
    } // end if
    else { document.body.appendChild(action.area); }
    $('[data-toggle="tooltip"]').tooltip();
    this.get_cross_species_protein_map_record();
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENERS ///////////////////////////////////////////////////
    action.button.addEventListener("click", function() {
        //////////////////////////////////////////////////////////////////
        // This function finds homologous proteins (orthologs) between  //
        // the two specified species via protein BLAST.                 //
        //                                                              //
        // The protein BLAST algorithm used by Moirai Conservation and  //
        // Research first narrows down the database options by          //
        // examining all 4-letter-long kmers in the query sequence with //
        // a kmer match score greater than or equal to 17, and tallying //
        // the matching 4-letter kmers indexed in the other organism.   //
        // Proteins in the other organism that contain at least         //
        // 5 percent of the kmers in the query sequence are then used   //
        // as the pool of sequences to be searched for homology.  The   //
        // standard ungapped "seed-extend-evaluate" protein BLAST       //
        // procedure is then employed, using the BLOSUM80 matrix and a  //
        // word size of 4 amino acids.                                  //
        //////////////////////////////////////////////////////////////////
        // LOCAL VARIABLES ///////////////////////////////////////////////
        this.get_cross_species_protein_map_record();
        action.button.blur();
        this.cross_species_protein_map_record.species1.metadata.delta_second = 1;
        this.cross_species_protein_map_record.species2.metadata.delta_second = 1;
        create_loading_box("Finding records", true);
        let id1 = this.cross_species_protein_map_record.species1.num_uploaded + 1;
        let id2 = this.cross_species_protein_map_record.species2.num_uploaded + 1;
        let name1 = this.actions.cross_species_protein_map.species1.organism_name.replace(/ /g, '_');
        let name2 = this.actions.cross_species_protein_map.species2.organism_name.replace(/ /g, '_');
        let max_id1 = this.actions.cross_species_protein_map.species1.protein_record.num_records;
        let max_id2 = this.actions.cross_species_protein_map.species2.protein_record.num_records;
        let split_name1 = this.actions.cross_species_protein_map.species1.organism_name.split(' ');
        let split_name2 = this.actions.cross_species_protein_map.species2.organism_name.split(' ');
        let sub_name1 = split_name1[0][0] + '_' + split_name1[1];
        let sub_name2 = split_name2[0][0] + '_' + split_name2[1];
        let table_name1 = sub_name1 + '_to_' + sub_name2;
        let table_name2 = sub_name2 + '_to_' + sub_name1;
        //////////////////////////////////////////////////////////////////
        // FUNCTION OPTIONS //////////////////////////////////////////////
        let blastp_options = { };
        blastp_options.cache = 0;
        let element_check = document.getElementById('slider-checkbox-' + this.actions.cross_species_protein_map.id + '-' + this.id);
        if (element_check) { blastp_options.cache = element_check.checked; }
        //////////////////////////////////////////////////////////////////
        // DB_GUARD INSTRUCTIONS /////////////////////////////////////////
        let obj1a = { };
        let obj1b = { };
        let obj2a = { };
        let obj2b = { };
        // file_guard command for updating the metadata
        obj1a.command       =   'update_metadata';
        obj1a.database      =   'xspecies_db';
        obj1a.table         =   table_name1; // table name
        obj1a.num_records   =   this.cross_species_protein_map_record.species1.num_records;
        // file_guard command for saving the map record
        obj1b.command       =   'xspecies_to_db';
        obj1b.database      =   'xspecies_db';
        obj1b.table         =   table_name1; // table name
        obj1b.data          =   [];
        // file_guard command for updating the metadata
        obj2a.command       =   'update_metadata';
        obj2a.database      =   'xspecies_db';
        obj2a.table         =   table_name2; // table name
        obj2a.num_records   =   this.cross_species_protein_map_record.species2.num_records;
        // file_guard command for saving the map record
        obj2b.command       =   'xspecies_to_db';
        obj2b.database      =   'xspecies_db';
        obj2b.table         =   table_name2; // table name
        obj2b.data          =   [];
        //////////////////////////////////////////////////////////////////
        // CREATE ORGANISM OBJECTS ///////////////////////////////////////
        let organism1 = { };
        let organism2 = { };
        // species 1
        organism1.name              =   name1;
        organism1.metadata_db       =   obj1a;
        organism1.xspecies_db       =   obj1b;
        organism1.current_id        =   id1;
        organism1.current_defline   =   '';
        organism1.current_sequence  =   '';
        organism1.max_id            =   max_id1;
        organism1.map               =   [];
        organism1.map_defline       =   '';
        organism1.this              =   this.actions.cross_species_protein_map.species1;
        organism1.parent_this       =   this;
        // species 2
        organism2.name              =   name2;
        organism2.metadata_db       =   obj2a;
        organism2.xspecies_db       =   obj2b;
        organism2.current_id        =   id2;
        organism2.current_defline   =   '';
        organism2.current_sequence  =   '';
        organism2.max_id            =   max_id2;
        organism2.map               =   [];
        organism2.map_defline       =   '';
        organism2.this              =   this.actions.cross_species_protein_map.species2;
        organism2.parent_this       =   this;
        // options
        let options                     =   { };
        options.score                   =   { };
        options.score.matrix            =   BLOSUM80;
        options.score.gapped            =   true;
        options.score.rescale_matrix    =   false;
        options.search_space            =   { };
        options.seed                    =   { };
        //////////////////////////////////////////////////////////////////
        // IMPORT TABLES /////////////////////////////////////////////////
        update_xspecies_metadata(organism1).then(() => { this.update(); });
        update_xspecies_metadata(organism2).then(() => { this.update(); });
        xspecies_blastp(organism1, organism2)
        .then(() => { xspecies_blastp(organism2, organism1); })
        //////////////////////////////////////////////////////////////////
        // METHOD ////////////////////////////////////////////////////////
        function xspecies_blastp(organism1, organism2) {
            //////////////////////////////////////////////////////////////
            //  Once the databases are loaded, either on the client-    //
            //  or the server side, this function cycles through the    //
            //  following worker "complete" messages and function(s):   //
            //      organism1.proteome_db-----> select                  //
            //      organism2.index_db--------> select                  //
            //      organism2.proteome_db-----> select                  //
            //      organism1.alignment-------> blastp                  //
            //      save_xspecies_map(organism1)                        //
            //  Each of the above message handlers has a fallback       //
            //  option for proceeding to save_xspecies_map and then     //
            //  returning to the start of the cycle if alignment        //
            //  information is lacking at that stage.                   //
            //////////////////////////////////////////////////////////////
            return new Promise(function(resolve, reject) {
                //////////////////////////////////////////////////////////
                // LOCAL VARIABLES ///////////////////////////////////////
                let amount_masked = 0;
                let kmers = [];
                let kmer_size = 4;
                organism1.proteome_db = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
                organism2.proteome_db = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
                organism1.alignment   = new Worker(current_base_url + '/workers/js/alignment.js?version='    + guid());
                organism2.index_db    = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
                if (blastp_options.cache) {
                    options.seed.filter_low_complexity = false;
                    hide_loading_box(true);
                    create_loading_box("Loading Proteins", true);
                    let job = { command: 'load', database: 'protein_db', table: organism1.name, limit: organism1.this.protein_record.num_records };
                    organism1.proteome_db.postMessage(job);
                } // end if
                else {
                    options.seed.filter_low_complexity = true;
                    hide_loading_box(true);
                    create_loading_box("Connecting to Databases", true);
                    job = { command: 'connect', database: 'protein_db', table: organism1.name };
                    organism1.proteome_db.postMessage(job);
                } // end else
                //////////////////////////////////////////////////////////
                // ORGANISM1 PROTEOME_DB MESSAGES ////////////////////////
                organism1.proteome_db.onmessage = function(e) {
                    switch(e.data.status) {
                        case 'complete': {
                            switch(e.data.command) {
                                case 'load': {
                                    let job = { command: 'structure', type: 'auto_increment', column: 'id' };
                                    organism1.proteome_db.postMessage(job);
                                    break;
                                } // end case
                                case 'connect': {
                                    let job = { command: 'connect', database: 'protein_db', table: organism2.name };
                                    organism2.proteome_db.postMessage(job);
                                    break;
                                } // end case
                                case 'transform': {
                                    hide_progress_bar();
                                    show_loading_box();
                                    loading_box_text("Loading Proteins");
                                    let job = { command: 'load', database: 'protein_db', table: organism2.name, limit:  organism2.this.protein_record.num_records };
                                    organism2.proteome_db.postMessage(job);
                                    break;
                                } // end case
                                case 'select': {
                                    organism1.current_sequence = e.data.record[0].sequence;
                                    organism1.current_defline  = e.data.record[0].defline;
                                    kmers = [];
                                    for (let j = kmer_size; j <= organism1.current_sequence.length; j++) {
                                        let kmer = organism1.current_sequence.substring(j - kmer_size, j);
                                        if (/[a-z]/.test(kmer)) { kmer = kmer.toUpperCase(); }
                                        if (kmers.indexOf(kmer) === -1) { kmers.push(kmer); }
                                    } // end for loop
                                    let job = { command: 'select', where: [] };
                                    for (let j = 0; j < kmers.length; j++) {
                                        job.where.push({ key: 'kmer', value: kmers[j] });
                                    } // end for loop
                                    if (job.where.length) { organism2.index_db.postMessage(job); }
                                    else {
                                        organism1.map = "0";
                                        save_xspecies_map(organism1)
                                        .then(() => {
                                            organism1.current_id++;
                                            if (organism1.current_id > organism1.max_id) {
                                                organism1.proteome_db.terminate();
                                                organism2.proteome_db.terminate();
                                                organism1.alignment.terminate();
                                                organism2.index_db.terminate();
                                                hide_progress_bar(); hide_loading_box();
                                                resolve();
                                            } // end if
                                            else {
                                                job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                                                organism1.proteome_db.postMessage(job);
                                            } // end else
                                        }); // end then
                                    } // end else
                                    break;
                                } // end case
                                case 'structure': {
                                    hide_loading_box();
                                    create_progress_bar("Masking Low Complexity Regions", true, organism1.this.protein_record.num_records);
                                    let job = { command: 'transform', column: [{ key: 'sequence' }], transformation: 'seg', options: { w: 10, k2_1: 1.8, k2_2: 2.1 } };
                                    organism1.proteome_db.postMessage(job);
                                    break;
                                } // end case
                                default: { break; }
                            } // end switch
                            break;
                        } // end case
                        case 'progress': {
                            switch(e.data.command) {
                                case 'transform': {
                                    update_progress_bar(e.data.amount);
                                    amount_masked += e.data.amount;
                                    progress_bar_subtitle("Sequence " + amount_masked + " of " + organism1.this.protein_record.num_records);
                                    break;
                                } // end case
                                default: { break; }
                            } // end switch
                            break;
                        } // end case
                        default: { break; }
                    } // end switch
                } // end function
                //////////////////////////////////////////////////////////
                // ORGANISM1 ALIGNMENT MESSAGES //////////////////////////
                organism1.alignment.onmessage = function(e) {
                    switch(e.data.status) {
                        case 'complete': {
                            switch(e.data.command) {
                                case 'blastp': {
                                    let best_expect = Infinity;
                                    let best_score = -Infinity;
                                    let best_choice = "";
                                    let best_defline = '';
                                    let report_array = e.data.result;
                                    for (let i = 0; i < report_array.length; i++) {
                                        if (report_array[i].significant && (report_array[i].expect < best_expect)) {
                                            best_expect  = report_array[i].expect;
                                            best_score   = report_array[i].score;
                                            best_choice  = report_array[i].data.id;
                                            best_defline = report_array[i].data.defline;
                                        } // end if
                                        else if (report_array[i].significant && (report_array[i].expect === best_expect)) {
                                            if (report_array[i].score > best_score) {
                                                best_expect  = report_array[i].expect;
                                                best_score   = report_array[i].score;
                                                best_choice  = report_array[i].data.id;
                                                best_defline = report_array[i].data.defline;
                                            } // end if
                                            else if (report_array[i].score === best_score) {
                                                best_choice  = best_choice  + ","  + report_array[i].data.id;
                                                best_defline = best_defline + "; " + report_array[i].data.defline;
                                            } // end else if
                                        } // end else if
                                    } // end for loop
                                    if (!best_choice) {
                                        best_defline = "No matching protein";
                                        best_choice = "0";
                                    } // end if
                                    organism1.map = best_choice;
                                    organism1.map_defline = best_defline;
                                    save_xspecies_map(organism1)
                                    .then(() => {
                                        organism1.current_id++;
                                        if (organism1.current_id > organism1.max_id) {
                                            organism1.proteome_db.terminate();
                                            organism2.proteome_db.terminate();
                                            organism1.alignment.terminate();
                                            organism2.index_db.terminate();
                                            hide_progress_bar(); hide_loading_box();
                                            resolve();
                                        } // end if
                                        else {
                                            let job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                                            organism1.proteome_db.postMessage(job);
                                        } // end else
                                    }); // end then
                                    break;
                                } // end case
                                default: { break; }
                            } // end switch
                            break;
                        } // end case
                        default: { break; }
                    } // end switch
                } // end function
                //////////////////////////////////////////////////////////
                // ORGANISM2 PROTEOME_DB /////////////////////////////////
                organism2.proteome_db.onmessage = function(e) {
                    switch(e.data.status) {
                        case 'complete': {
                            switch(e.data.command) {
                                case 'load': {
                                    let job = { command: 'structure', type: 'auto_increment', column: 'id' };
                                    organism2.proteome_db.postMessage(job);
                                    break;
                                } // end case
                                case 'connect': {
                                    let job = { command: 'connect', database: 'blastp_db',  table: organism2.name };
                                    organism2.index_db.postMessage(job);
                                    break;
                                } // end case
                                case 'select': {
                                    options.search_space.num_characters = organism2.this.protein_record.options.num_characters;
                                    options.search_space.num_sequences  = organism2.this.protein_record.num_records;
                                    let choices = [];
                                    let lower_size = organism1.current_sequence.length * 0.25;
                                    let upper_size = organism1.current_sequence.length * 1.75;
                                    for (let i = 0; i < e.data.record.length; i++) {
                                        if ((e.data.record[i].sequence.length > lower_size) && (e.data.record[i].sequence.length < upper_size)) {
                                            choices.push(e.data.record[i]);
                                        } // end if
                                    } // end for loop
                                    if (choices.length) {
                                        let job = { status: 'command', command: 'blastp', query: organism1.current_sequence, subject: choices, options: options };
                                        organism1.alignment.postMessage(job);
                                    } // end if
                                    else {
                                        organism1.map = "0";
                                        save_xspecies_map(organism1)
                                        .then(() => {
                                            organism1.current_id++;
                                            if (organism1.current_id > organism1.max_id) {
                                                organism1.proteome_db.terminate();
                                                organism2.proteome_db.terminate();
                                                organism1.alignment.terminate();
                                                organism2.index_db.terminate();
                                                hide_progress_bar(); hide_loading_box();
                                                resolve();
                                            } // end if
                                            else {
                                                job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                                                organism1.proteome_db.postMessage(job);
                                            } // end else
                                        }); // end then
                                    } // end else
                                    break;
                                } // end case
                                case 'structure': {
                                    hide_progress_bar();
                                    show_loading_box();
                                    loading_box_text("Loading Protein Indices");
                                    let job = { command: 'load', database: 'blastp_db',  table: organism2.name, limit: organism2.this.blastp_record.num_records };
                                    organism2.index_db.postMessage(job);
                                    break;
                                } // end case
                                default: { break; }
                            } // end switch
                            break;
                        } // end case
                        default: { break; }
                    } // end switch
                } // end function
                //////////////////////////////////////////////////////////
                // ORGANISM2 INDEX_DB MESSAGES ///////////////////////////
                organism2.index_db.onmessage = function(e) {
                    switch(e.data.status) {
                        case 'complete': {
                            switch(e.data.command) {
                                case 'load': {
                                    hide_loading_box();
                                    create_loading_box("Organizing Protein indices", true);
                                    let job = { command: 'structure', type: 'tree', column: 'kmer' };
                                    organism2.index_db.postMessage(job);
                                    break;
                                } // end case
                                case 'connect': {
                                    hide_loading_box(true);
                                    create_progress_bar("Cross-species Mapping", true, organism1.this.protein_record.num_records);
                                    update_progress_bar(organism1.current_id);
                                    let job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                                    organism1.proteome_db.postMessage(job);
                                    break;
                                } // end case
                                case 'select': {
                                    let preMap = { };
                                    let map = { id: organism1.current_id, sequences: [] };
                                    if (e.data.record.length) {
                                        for (let h = 0; h < e.data.record.length; h++) {
                                            if (e.data.record[h]) {
                                                if (e.data.record[h].sequences) {
                                                    let location = e.data.record[h].sequences.split(',');
                                                    for (let i = 0; i < location.length; i++) {
                                                        if (!preMap[location[i]]) { preMap[location[i]] = 1; }
                                                        else { preMap[location[i]]++; }
                                                    } // end for loop
                                                } // end if
                                            } // end if
                                        } // end for loop
                                    } // end if
                                    let keys = Object.keys(preMap);
                                    let lower_kmer_ident = Math.round(organism1.current_sequence.length * CDHIT["99"]["80"][kmer_size]);
                                    for (let i = 0; i < keys.length; i++) {
                                        if (preMap[keys[i]] >= lower_kmer_ident) { map.sequences.push(keys[i]); }
                                    } // end for loop
                                    if (map.sequences.length) {
                                        let job = { command: 'select', where: [] };
                                        for (let i = 0; i < map.sequences.length; i++) {
                                            let obj = { };
                                            obj.key = "id";
                                            obj.value = map.sequences[i];
                                            job.where.push(obj);
                                        } // end for loop
                                        organism2.proteome_db.postMessage(job);
                                    } // end if
                                    else {
                                        organism1.map = "0";
                                        save_xspecies_map(organism1)
                                        .then(() => {
                                            organism1.current_id++;
                                            if (organism1.current_id > organism1.max_id) {
                                                organism1.proteome_db.terminate();
                                                organism2.proteome_db.terminate();
                                                organism1.alignment.terminate();
                                                organism2.index_db.terminate();
                                                hide_progress_bar(); hide_loading_box();
                                                resolve();
                                            } // end if
                                            else {
                                                job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                                                organism1.proteome_db.postMessage(job);
                                            } // end else
                                        }); // end then
                                    } // end else
                                    break;
                                } // end case
                                case 'structure': {
                                    hide_loading_box(true);
                                    create_progress_bar("Cross-species Mapping", true, organism1.this.protein_record.num_records);
                                    update_progress_bar(organism1.current_id);
                                    let job = { command: 'select', where: [{ key: 'id', value: organism1.current_id }] };
                                    organism1.proteome_db.postMessage(job);
                                    break;
                                } // end case
                                default: { break; }
                            } // end switch
                            break;
                        } // end case
                        default: { break; }
                    } // end switch
                } // end function
                //////////////////////////////////////////////////////////
            }.bind(this)); // end Promise
        } // function
        //////////////////////////////////////////////////////////////////
        // METHOD ////////////////////////////////////////////////////////
        function update_xspecies_metadata(organism) {
            return new Promise(function(resolve, reject) {
                if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
                else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
                xmlhttp.onreadystatechange = function() {
                    if (this.readyState == 4) {
                        if (this.status == 200) { resolve(); }
                        else { console.log('Could not update metadata'); }
                    } // end if
                }; // end function
                let send_message = "execute=true";
                send_message += "&json=" + JSON.stringify(organism.metadata_db);
                xmlhttp.open("POST", "api/file_guard", true);
                xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xmlhttp.send(send_message);
            }.bind(this)); // end Promise
        } // end function
        //////////////////////////////////////////////////////////////////
        // METHOD ////////////////////////////////////////////////////////
        function save_xspecies_map(organism) {
            return new Promise(function(resolve, reject) {
                let report = true; // turn console report on or off
                let save   = false; // a quick way to turn this function off
                if (!organism.map) { organism.map = "0"; }
                if (save) {
                    let xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function() {
                        if (this.readyState == 4) {
                            if (this.status == 200) {
                                if (this.responseText) { console.log(this.responseText); }
                                if (report) {
                                    console.log("Protein " + organism.current_id + " out of " + organism.max_id);
                                    console.log(organism.current_defline);
                                    console.log(organism.map_defline);
                                    console.log(" ");
                                } // end if
                                progress_bar_subtitle("Protein " + organism.current_id + " out of " + organism.max_id);
                                update_progress_bar(1);
                                update_xspecies_metadata(organism);
                                resolve();
                            } // end if
                            else { save_xspecies_map(organism).then(() => { resolve(); }); }
                        } // end if
                    }; // end function
                    let obj = { id: organism.current_id, map: organism.map };
                    organism.xspecies_db.data = [];
                    organism.xspecies_db.data.push(obj);
                    let send_message = "execute=true";
                    send_message += "&json=" + JSON.stringify(organism.xspecies_db);
                    xmlhttp.open("POST", "api/file_guard", true);
                    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    xmlhttp.send(send_message);
                } // end if
                else {
                    if (report) {
                        console.log("Protein " + organism.current_id + " out of " + organism.max_id);
                        console.log(organism.current_defline);
                        console.log(organism.map_defline);
                        console.log(" ");
                    } // end if
                    progress_bar_subtitle("Protein " + organism.current_id + " out of " + organism.max_id);
                    update_progress_bar(1);
                    resolve();
                } // end else
            }); // end Promise
        } // end function
        //////////////////////////////////////////////////////////////////
    }.bind(this)); // end event listener
    //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
Bioaction.prototype.create_genome_import = function(element_id, callback, note) {
    if (element_id) {
        let element_check = document.getElementById(element_id);
        if (element_check) {
            while (element_check.firstChild) { element_check.removeChild(element_check.firstChild); }
            element_check.innerHTML = '';
        } // end if
        else { return; }
    } // end if
    else { element_id = false; }
    if (callback) { this.actions.genome_import.callback = callback; }
    let action = this.create_action(this.actions.genome_import.id);
    let title = 'Import Genome';
    if (note) { title += ' <span class="tooltip-font-awesome color-primary-foundation" aria-hidden="true" data-toggle="tooltip" data-placement="auto" title="' + note + '"></span>'; }
    action.title.innerHTML = title;
    action.text.innerHTML = "The genome file maintained by the National Center for Biotechnology Information (NCBI) contains the current most complete total DNA sequence for this organism.  This files is fairly large, and the process of importing its contents to our local database may take up to several hours.  If the browser tab or window is closed after the importing process has started, any progress will be saved and the process can be resumed from this page.";
    action.button.innerHTML = "Import";
    action.button.style.display = "none";
    action.status.innerHTML = '<div class="loading"><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div><div class="loading-bar"></div></div>';
    if (element_id) {
        document.getElementById(element_id).appendChild(action.area);
        this.html_element.genome_import = document.getElementById(element_id);
        this.html_element.genome_import.style.display = "block";
    } // end if
    else { document.body.appendChild(action.area); }
    $('[data-toggle="tooltip"]').tooltip();
    this.get_ncbi_record()
    .then(() => { this.get_genome_record(); });
    //////////////////////////////////////////////////////////////////////
    // EVENT LISTENER ////////////////////////////////////////////////////
    action.button.addEventListener("click", function() {
        action.button.blur();
        this.genome_record.metadata.delta_second = 1;
        this.update();
        let genome_obj = { };
        genome_obj.id           = guid();
        genome_obj.filename     = genome_obj.id + ".fna.gz";
        genome_obj.source       = this.ncbi_record.genome_url;
        genome_obj.target       = "../temporary/" + genome_obj.filename;
        genome_obj.database     = "dna_db";
        genome_obj.table        = this.organism_name.replace(/ /g, "_");
        genome_obj.data         = "";
        genome_obj.num_records  = this.genome_record.num_records;
        genome_obj.num_uploaded = this.genome_record.num_uploaded;
        genome_obj.start_byte   = undefined;
        genome_obj.end_byte     = undefined;
        genome_obj.options      = { };
        if (this.genome_record.options) {
            if (this.genome_record.options.num_characters) { genome_obj.options.num_characters = this.genome_record.options.num_characters; }
        } // end if
        //////////////////////////////////////////////////////////////////
        // ON BEFORE UNLOAD //////////////////////////////////////////////
        this.actions.genome_import.cleanup = function(evt) {
            evt.preventDefault();
            evt.returnValue = null;
            genome_obj.filename = genome_obj.id + ".fna.gz";
            erase_file(genome_obj);
            genome_obj.filename = genome_obj.id + ".fna";
            erase_file(genome_obj);
        };
        window.addEventListener('beforeunload', this.actions.genome_import.cleanup);
        //////////////////////////////////////////////////////////////////
        update_metadata(genome_obj)
        .then(import_file)
        .then(decompress_gzip)
        .then(file_size)
        .then(obj => { upload_genome.call(this, obj) })
        .catch(e => {
            if (this.actions.genome_import.cleanup) {
                window.removeEventListener('beforeunload', bioaction.actions.genome_import.cleanup);
                bioaction.actions.genome_import.cleanup = undefined;
            } // end if
            genome_obj.filename = genome_obj.id + ".fna.gz";
            erase_file(genome_obj);
            genome_obj.filename = genome_obj.id + ".fna";
            erase_file(genome_obj);
            hide_loading_box(true);
            this.create_modal('<div class="center"><h4>Could not import file</h4></div>');
        }); // end catch
    }.bind(this));
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    function upload_genome(obj) {
        return new Promise(function(resolve, reject) {
            if (typeof(obj) === 'undefined') { resolve(obj); }
            if (typeof(obj.start_byte) === 'undefined') { obj.start_byte = obj.num_uploaded * 50000; }
            if (typeof(obj.end_byte  ) === 'undefined') { obj.end_byte = obj.start_byte + 50000; }
            if (obj.end_byte > obj.file_size) { obj.end_byte = obj.file_size; }
            obj.num_records = Math.ceil(obj.file_size / 50000);
            if (obj.start_byte < obj.file_size) {
                read_file(obj)
                .then(parse_extract_sequence)
                .then(update_metadata)
                .then(genome_to_db)
                .then(obj => {
                    obj.num_uploaded++;
                    this.genome_record.num_uploaded = obj.num_uploaded;
                    if (this.genome_record.num_records) {
                        this.genome_record.percent_uploaded = Math.floor((this.genome_record.num_uploaded / this.genome_record.num_records) * 100);
                    } // end if
                    create_progress_bar("Uploading genome to database", true, obj.num_records);
                    update_progress_bar(obj.num_uploaded);
                    progress_bar_subtitle("Record " + obj.num_uploaded + " out of " + obj.num_records);
                    obj.start_byte = obj.start_byte + 50000;
                    obj.end_byte   = obj.end_byte   + 50000;
                    setTimeout(function() { upload_genome.call(this, obj); this.update(); }.bind(this), 100);
                    resolve(obj);
                }); // end then
            } // end if
            else { erase_file(obj); resolve(obj); }
        }.bind(this)); // end new Promise
    }; // end function
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
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
    let action = this.create_action(this.actions.gene_map.id);
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
        let current_id = 1;
        let current_defline = '';
        let obj = { };
        let metaObj = { };
        let organism = { };
        organism.name           =   this.organism_name;
        organism.ncbi_record    =   this.ncbi_record;
        organism.protein_record =   this.protein_record;
        organism.genome_record  =   this.genome_record;
        organism.mrca_proteome  =   this.mrca_proteome;
        let proteome_db = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
        let genome_db   = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
        let blastn_db   = new Worker(current_base_url + '/workers/js/client_table.js?version=' + guid());
        let alignment   = new Worker(current_base_url + '/workers/js/alignment.js?version='    + guid());
        metaObj.command     = "update_metadata";
        metaObj.database    = "gene_map_db";
        metaObj.table       = this.organism_name.replace(/ /g, "_");
        metaObj.num_records = this.mrca_proteome.protein_record.num_records ? this.mrca_proteome.protein_record.num_records : this.protein_record.num_records;
        metaObj.status      = "success";
        update_metadata(metaObj)
        .then(() => { this.update(); });
        hide_loading_box(true);
        if (gene_map_options.cache) {
            create_loading_box("Loading Proteins", true);
            let job = { command: 'load', database: 'protein_db', table: this.mrca_proteome.organism_name.replace(/ /g, '_'), limit: this.mrca_proteome.protein_record.num_records };
            proteome_db.postMessage(job);
        } // end if
        else {
            create_loading_box("Connecting to Databases", true);
            job = { command: 'connect', database: 'protein_db', table: this.mrca_proteome.organism_name.replace(/ /g, '_') };
            proteome_db.postMessage(job);
        } // end else
        //////////////////////////////////////////////////////////////////
        // PROTEOME_DB MESSAGES //////////////////////////////////////////
        proteome_db.onmessage = function(e) {
            switch(e.data.status) {
                case 'complete': {
                    switch(e.data.command) {
                        case 'connect': {
                            let job = { command: 'connect', database: 'dna_db', table: organism.name.replace(/ /g, '_') };
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
                            create_loading_box("Loading Genome", true);
                            let job = { command: 'load', database: 'dna_db', table: organism.name.replace(/ /g, '_'), limit: organism.genome_record.num_records, block_size: 50 };
                            genome_db.postMessage(job);
                            break;
                        } // end case 'structure'
                        case 'select': {
                            console.log(e.data.record);
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
                            let job = { command: 'connect', database: 'blastn_db', table: organism.name.replace(/ /g, '_') };
                            blastn_db.postMessage(job);
                            break;
                        } // end case 'connect'
                        case 'load': {
                            let job = { command: 'structure', type: 'auto_increment', column: 'id' };
                            genome_db.postMessage(job);
                            break;
                        } // end case 'load'
                        case 'structure': {
                            hide_loading_box(true);
                            create_loading_box("Loading Genome Index", true);
                            let job = { command: 'load', database: 'blastn_db', table: organism.name.replace(/ /g, '_'), limit: organism.blastn_record.num_records, block_size: 50 };
                            blastn_db.postMessage(job);
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
        // BLASTN_DB MESSAGES ////////////////////////////////////////////
        blastn_db.onmessage = function(e) {
            switch(e.data.status) {
                case 'complete': {
                    switch(e.data.command) {
                        case 'connect': {
                            hide_loading_box(true);
                            let job = { command: 'select', where: [{ key: 'id', value: current_id }] };
                            proteome_db.postMessage(job);
                            break;
                        } // end case 'connect'
                        case 'load': {
                            hide_loading_box(true);
                            create_loading_box("Organizing Genome indices");
                            let job = { command: 'structure', type: 'tree', column: 'kmer' };
                            blastn_db.postMessage(job);
                            break;
                        } // end case 'load'
                        case 'structure': {
                            hide_loading_box(true);
                            let job = { command: 'select', where: [{ key: 'id', value: current_id }] };
                            proteome_db.postMessage(job);
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
    }.bind(this)); // end event listener
    //////////////////////////////////////////////////////////////////////
} // end prototype
///////////////////////////////////////////////////////////////////////////////////////////////////
