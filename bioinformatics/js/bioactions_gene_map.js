// BIOACTION PROTOTYPE ////////////////////////////////////////////////////////
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
        if (this.records.gene_map_record) { delete this.records.gene_map_record; }
        this.records.gene_map_record = new BioactionRecord;
        let db_record = JSON.parse(responseText);
        if (typeof(db_record.owner       ) !== 'undefined') { this.records.gene_map_record.metadata.owner         = db_record.owner; }
        if (typeof(db_record.records     ) !== 'undefined') { this.records.gene_map_record.num_records            = parseInt(db_record.records     ); }
        if (typeof(db_record.year        ) !== 'undefined') { this.records.gene_map_record.metadata.year          = parseInt(db_record.year        ); }
        if (typeof(db_record.day         ) !== 'undefined') { this.records.gene_map_record.metadata.day           = parseInt(db_record.day         ); }
        if (typeof(db_record.hour        ) !== 'undefined') { this.records.gene_map_record.metadata.hour          = parseInt(db_record.hour        ); }
        if (typeof(db_record.minute      ) !== 'undefined') { this.records.gene_map_record.metadata.minute        = parseInt(db_record.minute      ); }
        if (typeof(db_record.second      ) !== 'undefined') { this.records.gene_map_record.metadata.second        = parseInt(db_record.second      ); }
        if (typeof(db_record.delta_second) !== 'undefined') { this.records.gene_map_record.metadata.delta_second  = parseInt(db_record.delta_second); }
        if (db_record.options) { this.records.gene_map_record.options = JSON.parse(db_record.options); }
      } // end if
    })
    .then(() => db_guard(json2))
    .then(responseText => {
      if (responseText) {
        let db_record = JSON.parse(responseText);
        if (db_record['COUNT(*)']) {
          this.records.gene_map_record.num_uploaded = parseInt(db_record['COUNT(*)']);
          if (this.records.gene_map_record.num_records) {
            this.records.gene_map_record.percent_uploaded = Math.floor((this.records.gene_map_record.num_uploaded / this.records.gene_map_record.num_records) * 100);
          } // end if
        } // end if
      } // end if
    }) // end then
    .then(() => { this.update(); resolve(); });
  }.bind(this)); // end Promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////
