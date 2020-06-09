///////////////////////////////////////////////////////////////////////////////
// Functions for working with the Open Tree of Life API system and drawing an
//  interactive phylogenetic tree.
///////////////////////////////////////////////////////////////////////////////
function get_ott_id(organism_name, callback, ...args) {
  ////////////////////////////////////////////////////////////////////////
  // Takes an organism name, and returns the associated Open Tree ID
  // (ott_id).  The ott_id is always the first argument passed to the
  // callback.
  ////////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(organism_name) === "undefined") { resolve(undefined); }
    if (typeof(callback)      === "undefined") { callback = false;   }
    showSpinner();
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200 && this.responseText) {
          let record = JSON.parse(this.responseText);
          if (record.results.length) {
            ott_id = record.results[0].matches[0].taxon.ott_id;
            if (callback) { callback(ott_id, ...args); }
            hideSpinner();
            resolve(ott_id);
          } // end if
        } // end if
        else { hideSpinner(); resolve(undefined); }
      } // end if
    }; // end function
    let json = '{"names":["' + organism_name + '"]}';
    xmlhttp.open("POST", "https://api.opentreeoflife.org/v3/tnrs/match_names", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(json);
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
function get_lineage(ott_id, callback, ...args) {
  ////////////////////////////////////////////////////////////////////////
  // Takes an organism ott_id, and returns a lineage object (see below).
  // The lineage object is always the first argument passed to the
  // callback.
  // The lineage object contains the ott_id and a field named "ancestor"
  // that contains an array of node information objects that correspond
  // to the list of nodes from the target organism back to the
  // phylogenetic tree root.  Each node object has a field named "num_tips"
  // that indicates the number of tree tips that extend beyone that node,
  // and a "taxon" object that contains taxonomic information regarding
  // that node.
  // Example lineage object:
  //  {
  //      "ott_id":"770315",
  //      "ancestor": [
  //          {
  //              "node_id": "ott770309",
  //              "num_tips": 1,
  //              "taxon": {
  //                  "name":   "Homo",
  //                  "ott_id": 770309,
  //                  "rank":   "genus"
  //              }
  //          },
  //          { ... }
  //      ]
  //  }
  ////////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(ott_id  ) === "undefined") { resolve(undefined); }
    if (typeof(callback) === "undefined") { callback = false;   }
    create_loading_box("Discovering lineage", true);
    let lineage = { "ott_id": ott_id };
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200 && this.responseText) {
          let response = JSON.parse(this.responseText);
          lineage.ancestor = response.lineage;
          hide_loading_box();
          resolve(lineage);
        } // end if
        else { hide_loading_box(); resolve(undefined); }
      } // end if
    }; // end function
    let json = '{"ott_id": ' + ott_id + ', "include_lineage": true}';
    xmlhttp.open("POST", "https://api.opentreeoflife.org/v3/tree_of_life/node_info", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(json);
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
function get_taxa(ott_id, callback, ...args) {
  ////////////////////////////////////////////////////////////////////////
  // Takes an Open Tree ID (ott_id), and returns the associated full
  // taxonomy.  The taxonomy (taxon) is always the first argument
  // supplied to the callback.  If the "depth" argument is supplied,
  // then this function returns the ott_id of the taxonomic level
  // that is "depth" levels above the organism in question.  When
  // "depth" is supplied, the ott_id of that level is always the
  // first argument supplied to the callback.
  ////////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(ott_id)   === "undefined") { resolve(undefined);  }
    if (typeof(depth)    === "undefined") { depth       = false; }
    if (typeof(callback) === "undefined") { callback    = false; }
    if (depth < 0) { depth = false; }
    create_loading_box("Discovering lineage", true);
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200 && this.responseText) {
          let taxon = JSON.parse(this.responseText);
          if (callback) { callback(taxon.lineage, ...args); }
          hide_loading_box();
          resolve(taxon.lineage);
        } // end if
        else { hideSpinner(); resolve(undefined); }
      } // end if
    }; // end function
    let json = '{"ott_id": ' + ott_id + ', "include_lineage": true}';
    xmlhttp.open("POST", "https://api.opentreeoflife.org/v3/taxonomy/taxon_info", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(json);
  }); // end new Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
function get_subtree(ott_id, depth, callback, ...args) {
  ////////////////////////////////////////////////////////////////////////
  // Takes an Open Tree ID (ott_id), and returns the associated
  // "subtree" phylogenetic tree of which the organism is a primary
  // branch.  By default, the function tries to return the full subtree.
  // However, large subtrees may result in an API error.  If "depth" is
  // supplied as an argument, the height of the tree is limited to
  // "depth" levels.  The resulting subtree is returned in Newick format
  // that is then parsed into an object.  The subtree object is always
  // the first argument supplied to the callback.
  ////////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(ott_id  ) === "undefined") { resolve(undefined); }
    if (typeof(depth   ) === "undefined") { depth        = -1;  }
    if (typeof(callback) === "undefined") { callback  = false;  }
    create_loading_box("Generating tree", true);
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200 && this.responseText) {
          let json_obj = JSON.parse(this.responseText);
          let json_tree = JSON.stringify(json_obj.newick);
          let tree = parse_Newick(json_tree);
          if (callback) { callback(tree, ...args); }
          hide_loadong_box();
          resolve(tree);
        } // end if
        else { hide_loadong_box(); resolve(undefined); }
      } // end if
    }; // end function
    let json = '{"ott_id": ' + ott_id + ', "format": "newick", "height_limit": ' + depth.toString() + '}';
    xmlhttp.open("POST", "https://api.opentreeoflife.org/v3/tree_of_life/subtree", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(json);
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
function get_mrca(ott_id_list, callback, ...args) {
  ////////////////////////////////////////////////////////////////////////
  // Takes a list of Open Tree IDs (ott_id) and returns the most
  // recent common ancestor (MRCA) that relates all of the organisms
  // on the list.  The MRCA record is always the first argument
  // supplied to the callbak.
  //
  // ott_id_list is in the following JSON format:
  //      { "ott_ids": [ ] }
  ////////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(ott_id_list) === "undefined") { resolve(undefined);  }
    if (typeof(depth      ) === "undefined") { depth           = 0; }
    if (typeof(callback   ) === "undefined") { callback    = false; }
    create_loading_box("Finding most recent common ancestor", true);
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200 && this.responseText) {
          let mrca = JSON.parse(this.responseText);
          if (callback) { callback(mrca, ...args); }
          hideSpinner();
          resolve(mrca);
        } // end if
        else { hide_loading_box(); resolve(undefined); }
      } // end if
    }; // end function
    xmlhttp.open("POST", "https://api.opentreeoflife.org/v3/tree_of_life/mrca", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(ott_id_list);
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
function get_best_subtree(lineage, max_tips, depth, callback, ...args) {
  ////////////////////////////////////////////////////////////////////////
  // Takes a lineage object and finds the ancestor that
  // produces the biggest valid subtree.  Subtrees above a certain size
  // will produce HTTP: 400 API errors, and these trees are considered
  // to be invalid.  The resulting biggest valid tree object is always
  // supplied as the first argument to the callback.  If "depth" is
  // supplied as an argument, the height of the tree is limited to
  // "depth" levels.  If "max_tips" is supplied as an argument, then
  // the tree is limited to a maximum number of leaf nodes specified
  // by max_tips.
  ////////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(lineage)          === "undefined") { resolve(undefined);  }
    if (typeof(lineage.ancestor) === "undefined") { resolve(undefined);  }
    if (typeof(max_tips)         === "undefined") { max_tips    = 500;   }
    if (typeof(depth)            === "undefined") { depth       = -1;    }
    if (typeof(callback)         === "undefined") { callback    = false; }
    create_loading_box("Finding best tree", true);
    var index       =   0;
    var max_index   =   0;
    var trees       =   [];
    if (depth > lineage.ancestor.length) { depth = lineage.ancestor.length; }
    if (depth > 0) { max_index = depth; } else { max_index = lineage.ancestor.length - 1; }
    while (lineage.ancestor[max_index].num_tips > max_tips) {
      max_index--;
      if (max_index < 0) { resolve(undefined); }
    } // end while
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200 && this.responseText) {
          let json_obj = JSON.parse(this.responseText);
          let json_tree = JSON.stringify(json_obj.newick);
          let tree = parse_Newick(json_tree);
          hide_loading_box();
          resolve(tree);
        } // end if
        else { hide_loading_box(); resolve(undefined); }
      } // end if
    }; // end function
    let json = '{"node_id": "' + lineage.ancestor[max_index].node_id + '", "format": "newick", "height_limit": ' + depth.toString() + '}';
    xmlhttp.open("POST", "https://api.opentreeoflife.org/v3/tree_of_life/subtree", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(json);
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
function xref_subtree(tree, options, callback, ...args) {
  ////////////////////////////////////////////////////////////////////////
  // Takes a tree object and returns a tree object with records from
  // the db_xref database added to the organisms that are
  // within the tree and present in that database.  The argument
  // "all_records" is a boolean that should only ever be true or false.
  // If all_records is supplied as false, then any tree nodes that
  // lack db_xref records will be deleted.  If all_records is not
  // supplied, it is given the default value of true, which allows
  // nodes lacking db_xref records to remain in the tree.  The resulting
  // tree object is always supplied as the first argument to the
  // callback.
  ////////////////////////////////////////////////////////////////////////
  return new Promise(function(resolve, reject) {
    if (typeof(tree       ) === "undefined") { resolve(undefined); }
    if (typeof(callback   ) === "undefined") { callback = false;   }
    if (typeof(options    ) === "undefined") { console.log("No options"); options = { display: 'all' }; }
    create_loading_box("Cross-referencing database", true);
    if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
    else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200 && this.responseText) {
          let tree = JSON.parse(this.responseText);
          if (options.tree.display !== 'all') { tree = prune_tree(tree, options.tree.display); }
          if (callback) { callback(tree, ...args); }
          hide_loading_box(true);
          resolve(tree);
        } // end if
        else { hide_loading_box(true); resolve(undefined); }
      } // end if
    }; // end function
    let send_message = "execute=true";
    send_message += "&json=" + JSON.stringify(tree);
    xmlhttp.open("POST", current_base_url + "/apps/phylogenetic_tree_explorer/phylogeneticTree_xref", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send(send_message);
  }); // end Promise
} // end function
///////////////////////////////////////////////////////////////////////////////
function parse_Newick(s, distance) {
  ////////////////////////////////////////////////////////////////////////
  // Newick format parser in JavaScript.
  // Copyright (c) Jason Davies 2010.
  // Modified 2019 by Neil Copes
  // Permission is hereby granted, free of charge, to any person
  // obtaining a copy of this software and associated documentation
  // files (the "Software"), to deal in the Software without restriction,
  // including without limitation the rights to use, copy, modify, merge,
  // publish, distribute, sublicense, and/or sell copies of the Software,
  // and to permit persons to whom the Software is furnished to do so,
  // subject to the following conditions:
  // The above copyright notice and this permission notice shall be
  // included in all copies or substantial portions of the Software.
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  // EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  // IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
  // CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
  // TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  // SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  // Example tree (from http://en.wikipedia.org/wiki/Newick_format):
  ////////////////////////////////////////////////////////////////////////
  if (typeof(distance) === "undefined") { distance = false; }
   var open = 0;
   var close = 0;
   var ancestors = [];
   var tree = {};
   try {
     if (!distance) { s = s.replace(/:/g, ' '); }
     s = s.replace(/;/g, '');
     s = s.replace(/\s*\(kingdom in.*?\)\s*/ig, '_');
     s = s.replace(/\s*\(phylum in.*?\)\s*/ig,  '_');
     s = s.replace(/\s*\(class in.*?\)\s*/ig,   '_');
     s = s.replace(/\s*\(order in.*?\)\s*/ig,   '_');
     s = s.replace(/\s*\(family in.*?\)\s*/ig,  '_');
     s = s.replace(/\s*\(genus in.*?\)\s*/ig,   '_');
     s = s.replace(/\s*\(species in.*?\)\s*/ig, '_');
     var tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
     for (var i = 0; i < tokens.length; i++) {
       var token = tokens[i];
       switch (token) {
        // new children
        case '(': {
          let subtree = {};
          tree.name = "";
          tree.children = [subtree];
          ancestors.push(tree);
          tree = subtree;
          open++;
          break;
        } // end case
        // another branch
        case ',': {
          let subtree = {};
          if (ancestors.length == 0) {
              ancestors.push({ "name": "", "children": []});
          } // end if
          ancestors[ancestors.length - 1].name = "";
          ancestors[ancestors.length - 1].children.push(subtree);
          tree = subtree;
          break;
        } // end case
        // optional name next
        case ')': {
          tree = ancestors.pop();
          close++;
          break;
        } // end case
        // optional length next
        case '':  { break; }
        default: {
          var x = tokens[i-1];
          if (x == ')' || x == '(' || x == ',') {
            let part = token.split(/( |_)ott/g);
            part[0] = part[0].replace(/_/g, ' ');
            part[0] = part[0].replace(/'/g, '');
            part[0] = part[0].replace(/"/g, '');
            part[0] = part[0].trim();
            tree.name = part[0];
            if (part[2]) {
                part[2] = part[2].replace(/'/g, '');
                part[2] = part[2].replace(/"/g, '');
                tree.ott_id = part[2].trim();
            } // end if
          } // end if
          else if (x == ':') {
            if (distance) { tree.branch_length = parseFloat(token); }
          } // end else if
        } // end default
      } // end switch
    } // end for loop
    for (i = 0; i < (open - close); i++) { tree = ancestors.pop(); }
    tree.name = "root";
    return tree;
  } // end try
  catch(err) { return undefined; }
} // end function
///////////////////////////////////////////////////////////////////////////////
function prune_tree(tree, keep) {
  ////////////////////////////////////////////////////////////////////////
  // Takes a tree object and removes all nodes that (1) do not have
  // and associated xrefID, and that (2) do not have any children or
  // descendants that have an xrefID.
  ////////////////////////////////////////////////////////////////////////
  if (typeof(tree) === "undefined") { return; }
  if (typeof(keep) === "undefined") { return tree; }
  try {
    if (tree.children) {
      for (let index = 0; index < tree.children.length; index++) {
        tree.children[index] = prune_tree(tree.children[index], keep);
      } // end for loop
      tree.children = tree.children.filter(function(element) { return element != undefined; });
      if (tree.children.length == 0) { delete tree.children; }
    } // end if
    if (!tree.children) {
      switch(keep) {
        case 'red': {
          if ((tree.maximum_longevity <= 0.00) || (!tree.maximum_longevity) || (!tree.status)) { return undefined; }
          break;
        } // end case
        case 'green': {
          if (!tree.status) { return undefined; }
          else if (tree.maximum_longevity > 0.00) { return undefined; }
          break;
        } // end case
        case 'blue': {
          if ((tree.maximum_longevity <= 0.00) || (!tree.maximum_longevity)) { return undefined; }
          else if (tree.status) { return undefined; }
          break;
        } // end case
      } // end switch
    } // end if
    return tree;
  } // end try
  catch(err) { return undefined; }
} // end function
///////////////////////////////////////////////////////////////////////////////
