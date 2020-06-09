///////////////////////////////////////////////////////////////////////////////
// BIOACTIONS MRCA ////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.get_closest_relative = function(filter, lifespan, exclude_human) {
  return new Promise(function(resolve, reject) {
    if (typeof(filter) === "undefined") { filter = "default"; }
    if (typeof(lifespan) === "undefined") { lifespan = "default"; }
    if (typeof(exclude_human) === "undefined") { exclude_human = false; }
    let self = this;
    let mrca = { organism_name: '', time: Infinity, maximum_longevity: 0 };
    hide_loading_box(true);
    hide_progress_bar(true);
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.responseText && (this.status == 200)) {
          let json = JSON.parse(this.responseText).records;
          if (json.length) {
            let title = self.organism_name + ": Finding closest";
            switch (lifespan) {
              case "long-lived":  { title += " long-lived relative";        break; }
              case "midrange":    { title += " midrange lifespan relative"; break; }
              case "short-lived": { title += " short-lived relative";        break; }
              default: { title += " relative"; break; }
            } // end switch
            switch (filter) {
              case "genome_url_ttolID": { title += " with genome"; break; }
              case "proteome_url_ttolID": { title += " with proteome"; break; }
              case "refseq_ttolID": { title += " with reference sequence"; break; }
              default: { break; }
            } // end switch
            create_progress_bar(title, true, json.length);
            get_next_relative(self, self.organism_name, json, mrca);
          } // end if
          else { resolve(self.mrca); }
        } // end if
        else { resolve(self.mrca); }
      } // end if
    }; // end function
    let send_message = "format=complete";
    send_message += "&filter=" + filter;
    send_message += "&lifespan=" + lifespan;
    xmlhttp.open("POST", current_base_url + "/api/get_organism_list", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
    //////////////////////////////////////////////////////////////////////
    function get_next_relative(self, name, list, mrca, current_index) {
      if (typeof(current_index) === 'undefined') { current_index = 0; }
      if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
      else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.responseText && (this.status == 200)) {
            if (this.responseText != "{ }") {
              let json = JSON.parse(this.responseText);
              if (json.time > 0.00) {
                if ((json.time < mrca.time) && (name !== list[current_index].organism_name)) {
                  if (!exclude_human || (exclude_human && (list[current_index].organism_name != "Homo sapiens"))) {
                    mrca.time = json.time;
                    mrca.organism_name = list[current_index].organism_name;
                    mrca.maximum_longevity = list[current_index].maximum_longevity;
                  } // end if
                } // end if ((json.time < mrca.time) && (name !== name_list[current_index]))
              } // end if (json.time > 0.00)
              current_index++;
              if (current_index < list.length) {
                progress_bar_subtitle("Searching " + current_index + " of " + list.length);
                update_progress_bar(1);
                get_next_relative(self, name, list, mrca, current_index);
              } // end if
              else {
                hide_progress_bar(true);
                self.mrca.organism_name = mrca.organism_name;
                self.mrca.time = mrca.time;
                self.mrca.maximum_longevity= mrca.maximum_longevity;
                resolve(self.mrca);
              } // end else
            } // end if (this.responseText != "{ }")
            else {
              current_index++;
              if (current_index < list.length) {
                progress_bar_subtitle("Searching " + current_index + " of " + list.length);
                update_progress_bar(1);
                get_next_relative(self, name, list, mrca, current_index);
              } // end if
              else {
                hide_progress_bar(true);
                self.mrca.organism_name = mrca.organism_name;
                self.mrca.time = mrca.time;
                self.mrca.maximum_longevity= mrca.maximum_longevity;
                resolve(self.mrca);
              } // end else
            } // end else
          } // end if (this.responseText && (this.status == 200))
          else {
            current_index++;
            if (current_index < list.length) {
              progress_bar_subtitle("Searching " + current_index + " of " + list.length);
              update_progress_bar(1);
              get_next_relative(self, name, list, mrca, current_index);
            } // end if
            else {
              hide_progress_bar(true);
              self.mrca.organism_name = mrca.organism_name;
              self.mrca.time = mrca.time;
              self.mrca.maximum_longevity= mrca.maximum_longevity;
              resolve(self.mrca);
            } // end else
          } // end else
        } // end if
      }; // end function
      let send_message = "name1=" + self.organism_name;
      send_message += "&name2=" + list[current_index].organism_name;
      xmlhttp.open("POST", current_base_url + "/api/MRCA_finder", true);
      xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xmlhttp.send(send_message);
    }; // end function
  }.bind(this));
} // end prototype
///////////////////////////////////////////////////////////////////////////////
// PROTOTYPE //////////////////////////////////////////////////////////////////
Bioaction.prototype.get_mrca = function(name1, name2) {
  return new Promise(function(resolve, reject) {
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200 && this.responseText) {
          const json = JSON.parse(this.responseText);
          resolve(json);
        } // end if
        else { resolve({ }); }
      } // end if
    }; // end function
    let send_message = "name1=" + name1;
    send_message += "&name2=" + name2;
    xmlhttp.open("POST", current_base_url + "/api/MRCA_finder", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end promise
} // end prototype
///////////////////////////////////////////////////////////////////////////////
