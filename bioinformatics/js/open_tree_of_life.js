///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Functions for working with the Open Tree of Life API system
//
///////////////////////////////////////////////////////////////////////////////////////////////////

function get_ott_id(organism_name, callback, ...args) {
    //////////////////////////////////////////////////////////////////////
    //
    // Takes an organism name, and returns the associated Open Tree ID
    // (ott_id).  The ott_id is always the first argument passed to the
    // callback.
    //
    //////////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////////////////////////

function get_lineage(ott_id, callback, ...args) {
    //////////////////////////////////////////////////////////////////////
    //
    // Takes an organism ott_id, and returns a lineage object (see below).
    // The lineage object is always the first argument passed to the
    // callback.
    //
    // The lineage object contains the ott_id and a field named "ancestor"
    // that contains an array of node information objects that correspond
    // to the list of nodes from the target organism back to the
    // phylogenetic tree root.  Each node object has a field named "num_tips"
    // that indicates the number of tree tips that extend beyone that node,
    // and a "taxon" object that contains taxonomic information regarding
    // that node.
    //
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
    //
    //////////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////////////////////////

function get_taxa(ott_id, callback, ...args) {
    //////////////////////////////////////////////////////////////////////
    //
    // Takes an Open Tree ID (ott_id), and returns the associated full
    // taxonomy.  The taxonomy (taxon) is always the first argument
    // supplied to the callback.  If the "depth" argument is supplied,
    // then this function returns the ott_id of the taxonomic level
    // that is "depth" levels above the organism in question.  When
    // "depth" is supplied, the ott_id of that level is always the
    // first argument supplied to the callback.
    //
    //////////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////////////////////////

function get_subtree(ott_id, depth, callback, ...args) {
    //////////////////////////////////////////////////////////////////////
    //
    // Takes an Open Tree ID (ott_id), and returns the associated
    // "subtree" phylogenetic tree of which the organism is a primary
    // branch.  By default, the function tries to return the full subtree.
    // However, large subtrees may result in an API error.  If "depth" is
    // supplied as an argument, the height of the tree is limited to
    // "depth" levels.  The resulting subtree is returned in Newick format
    // that is then parsed into an object.  The subtree object is always
    // the first argument supplied to the callback.
    //
    //////////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////////////////////////

function get_mrca(ott_id_list, callback, ...args) {
    //////////////////////////////////////////////////////////////////////
    //
    // Takes a list of Open Tree IDs (ott_id) and returns the most
    // recent common ancestor (MRCA) that relates all of the organisms
    // on the list.  The MRCA record is always the first argument
    // supplied to the callbak.
    //
    // ott_id_list is in the following JSON format:
    //      { "ott_ids": [ ] }
    //
    //////////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////////////////////////

function get_best_subtree(lineage, max_tips, depth, callback, ...args) {
    //////////////////////////////////////////////////////////////////////
    //
    // Takes a lineage object and finds the ancestor that
    // produces the biggest valid subtree.  Subtrees above a certain size
    // will produce HTTP: 400 API errors, and these trees are considered
    // to be invalid.  The resulting biggest valid tree object is always
    // supplied as the first argument to the callback.  If "depth" is
    // supplied as an argument, the height of the tree is limited to
    // "depth" levels.  If "max_tips" is supplied as an argument, then
    // the tree is limited to a maximum number of leaf nodes specified
    // by max_tips.
    //
    //////////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////////////////////////

function xref_subtree(tree, options, callback, ...args) {
    //////////////////////////////////////////////////////////////////////
    //
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
    //
    //////////////////////////////////////////////////////////////////////
    return new Promise(function(resolve, reject) {
        if (typeof(tree       ) === "undefined") { resolve(undefined); }
        if (typeof(callback   ) === "undefined") { callback = false;   }
        if (typeof(options    ) === "undefined") { options = { display: 'all' }; }
        create_loading_box("Cross-referencing database", true);
        if (window.XMLHttpRequest) { xmlhttp = new XMLHttpRequest(); }
        else { xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200 && this.responseText) {
                    let tree = JSON.parse(this.responseText);
                    if (options.display !== 'all') { tree = prune_tree(tree, options.display); }
                    if (callback) { callback(tree, ...args); }
                    hide_loading_box(true);
                    resolve(tree);
                } // end if
                else { hide_loading_box(true); resolve(undefined); }
            } // end if
        }; // end function
        let send_message = "execute=true";
        send_message += "&json=" + JSON.stringify(tree);
        xmlhttp.open("POST", "sub_dashboard/sub_apps/phylogeneticTree_xref", true);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.send(send_message);
    }); // end Promise
} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function parse_Newick(s, distance) {
    //////////////////////////////////////////////////////////////////////
    // Newick format parser in JavaScript.
    //
    // Copyright (c) Jason Davies 2010.
    // Modified 2019 by Neil Copes
    //
    // Permission is hereby granted, free of charge, to any person
    // obtaining a copy of this software and associated documentation
    // files (the "Software"), to deal in the Software without restriction,
    // including without limitation the rights to use, copy, modify, merge,
    // publish, distribute, sublicense, and/or sell copies of the Software,
    // and to permit persons to whom the Software is furnished to do so,
    // subject to the following conditions:
    //
    // The above copyright notice and this permission notice shall be
    // included in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    // EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    // IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    // CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    // TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    // SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    //
    // Example tree (from http://en.wikipedia.org/wiki/Newick_format):
    //
    //////////////////////////////////////////////////////////////////////
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
                    } else if (x == ':') {
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

///////////////////////////////////////////////////////////////////////////////////////////////////

function prune_tree(tree, keep) {
    //////////////////////////////////////////////////////////////////////
    //
    // Takes a tree object and removes all nodes that (1) do not have
    // and associated xrefID, and that (2) do not have any children or
    // descendants that have an xrefID.
    //
    //////////////////////////////////////////////////////////////////////
    if (typeof(tree) === "undefined") { return; }
    if (typeof(keep) === "undefined") { return tree; }
//    try {
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
//    } // end try
//    catch(err) { return undefined; }
} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function draw_tree(tree_data, ott_id) {
    //////////////////////////////////////////////////////////////////////
    //
    // Takes a tree object and uses the D3 JavaScript library
    // (https://d3js.org/) to draw an SVG phylogenetic tree.  If an ott_id
    // is supplied, the node with that id is used to initially zoom and
    // center the view of the tree.
    //
    //////////////////////////////////////////////////////////////////////
    if (typeof(tree_data) === "undefined") {
        let tree_area = document.getElementById("tree-area");
        let no_tree_area = document.getElementById("no-tree-area");
        if (tree_area) { tree_area.style.display = "none"; }
        if (no_tree_area) { no_tree_area.style.display = "block"; }
        let pan_scroll_text = document.getElementById("pan-scroll-text");
        if (pan_scroll_text) { pan_scroll_text.style.display = "none"; }
        hideSpinner();
        return;
    } // end if
    else {
        let tree_area = document.getElementById("tree-area");
        let no_tree_area = document.getElementById("no-tree-area");
        if (tree_area) {
            tree_area.innerHTML = '';
            tree_area.style.display = "block";
        } // end if
        if (no_tree_area) { no_tree_area.style.display = "none"; }
    } // end else
    if (typeof(ott_id) === "undefined") { ott_id = false; }

    try {
        var width_separation = 100;
        var height_separation = 300;
        var init_scale = 2;
        var center_x = 0;
        var center_y = 0;
        var hover_box = { };

        // format the data
        const root = d3.hierarchy(tree_data, function(d) { return d.children; });
        let width = root.leaves().length * width_separation;
        let height = root.height * height_separation;
        let zoomTrans = { x: 0, y: 0, scale: init_scale };
        var tree_layout = d3.tree();
        tree_layout.size([width, height]);
        tree_layout(root);
        root.each(d => { d.x = d.x + width_separation; d.y = d.y + height_separation; });
        if (ott_id) {
            root.each(d => { if (d.data.ott_id == ott_id) { center_x = d.x; center_y = d.y; } });
            if (center_x == 0 && center_y == 0) {
                root.each(d => { if (d.data.name == "root") { center_x = d.x; center_y = d.y; } });
            } // end if
            root.each(d => { d.x = (d.x - center_x) + 50; d.y = (d.y - center_y) + 50; });
        } // end if
        const nodes = root.descendants();
        const links = root.links();

        // establish pan and zoom functionality
        var zoom = d3.zoom()
            .on("zoom", function() {
                zoomTrans.x = d3.event.transform.x;
                zoomTrans.y = d3.event.transform.y;
                zoomTrans.scale = d3.event.transform.k;
                link.attr("transform", d3.event.transform);
                node.attr("transform", d3.event.transform);
                text.attr("transform", d3.event.transform);
            });

        // destroy any previous graphs
        var svg = svg = d3.select("svg");
        svg.selectAll("*").remove();

        // create the image area and background
        svg = d3.select("svg")
            .attr("width", "100%")
            .attr("height", height)
            .style("width", "100%")
            .style("height", "600px")
            .style("background-color", "white") // #EFEFEF
            .style("border", "1px solid black")
            .call(zoom);

        // establish the clipping (viewport) dimensions
        var clip_path = svg.append('defs')
          .append('clipPath')
          .attr('id', 'clip')
          .append('rect')
              .attr('x', 0)
              .attr('y', 0)
              .attr('width', "100%")
              .attr('height', "500px");

        var view_port = svg.append('g')
          .attr('class', 'main')
          .attr('clip-path', 'url(#clip)');

        var g = svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10);

        // draw the links
        var link = g.append("g")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", "4px")
            .selectAll("path")
                .data(links)
                .join("path")
                .attr("d", d3_phylogenetic_line);

        // draw the nodes
        var node = g.append("g")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .selectAll("circle")
                .data(nodes)
                .join("circle")
                .attr("fill", pick_node_color)
                .attr('stroke',  'black')
                .attr('stroke-width', '2px')
                .attr("r", pick_radius)
                .attr("cy", d => { return d.x; })
                .attr("cx", d => { return d.y; })
                .on("mouseover", function(d) { d3.select(this).style("cursor", "pointer"); })
                .on("mouseout",  function(d) { d3.select(this).style("cursor", "default"); })
                .on("click", function(d) { display_hover_box(d.data, d3.mouse(this)); });

        // draw the organism names
        var text = g.append("g")
            .selectAll("text")
                .data(nodes)
                .join("text")
                .text(d => d.data.name)
                .attr("fill", pick_text_color)
                .attr("stroke", pick_text_color)
                .attr("font-size", "14px")
                .attr("x", d => { return d.y + 6; })
                .attr("y", d => { if (d.children) { return d.x + 14; } else { return d.x + 4; } })
                .on("mouseover", function(d) { d3.select(this).style("cursor", "pointer"); })
                .on("mouseout",  function(d) { d3.select(this).style("cursor", "default"); })
                .on("click", function(d) { display_hover_box(d.data, d3.mouse(this)); });

        // establish the hover box
        hover_box.area = svg.append("foreignObject")
            .attr("x", "1px")
            .attr("y", "1px")
            .attr("width", function() {
                if (!mobile) { return "404px"; }
                else { return Math.floor(document.getElementById('tree-area').getBoundingClientRect().width + 4) + "px"; }
            })
            .attr("height", "305px")
            .style("background-color", "white")
            .style("display", "none");

        hover_box.display = hover_box.area.append("xhtml:div")
            .attr("id", "hover-box")
            .style("position", "relative")
            .style("top", "2px")
            .style("left", "2px")
            .style("width", function() {
                if (!mobile) { return "400px"; }
                else { return Math.floor(document.getElementById('tree-area').getBoundingClientRect().width) + "px"; }
            })
            .style("height", "auto")
            .style("padding", "24px 18px 24px 18px")
            .style("background", "white")
            .style("border", "1px solid black")
            .style("border-radius", "6px")
            .style("text-align", "left")
            .style("word-wrap", "break-word")
            .html("<br>")
            .on("mouseover", function(d) { if (!mobile) { d3.select(this).style("cursor", "move"); } } )
            .on("mouseout",  function(d) { d3.select(this).style("cursor", "default"); } )
            .call(d3.drag()
                    .on('start.interrupt', function () { if (!mobile) { hover_box.display.interrupt(); } })
                    .on('start', function() { if (!mobile) { hover_box.dragX = d3.mouse(this)[0]; hover_box.dragY = d3.mouse(this)[1]; } })
                    .on('drag', function () {
                        if (!mobile) {
                            let d_dragX = d3.mouse(this)[0] - hover_box.dragX;
                            let d_dragY = d3.mouse(this)[1] - hover_box.dragY;
                            hover_box.x = hover_box.x + d_dragX;
                            hover_box.y = hover_box.y + d_dragY;
                            hover_box.area.attr("x", hover_box.x + "px").attr("y", hover_box.y + "px");
                        } // end if
                    }));

            hover_box.close = hover_box.area.append("xhtml:div")
                .attr("id", "hover-box-close")
                .style("position", "relative")
                .style("width", "25px")
                .style("height", "25px")
                .style("padding-left", "7px")
                .style("color", "white")
                .style("background-color", "#424242")
                .style("border", "2px solid #6D6D6D")
                .style("border-radius", "50% 50% 50% 50%")
                .style("top", "-50px")
                .style("left", function() {
                    if (!mobile) { return "375px"; }
                    else { return Math.floor(document.getElementById('tree-area').getBoundingClientRect().width - 45) + "px"; }
                })
                .html('<p style="position: relative; top: -2px"><b>x</b></p>')
                .on("mouseover", function(d) { d3.select(this).style("cursor", "pointer"); } )
                .on("mouseout",  function(d) { d3.select(this).style("cursor", "default"); } )
                .on("click", function() { hover_box.area.style("display", "none"); });

        // perform the initial zoom
        if (center_x || center_y) {
            svg.transition()
                .duration(1000)
                .call(zoom.transform, d3.zoomIdentity.scale(init_scale));
        } // end if

        // display the pan-scroll text
        if (document.getElementById("pan-scroll-text")) { if (!mobile) { document.getElementById("pan-scroll-text").style.display = "block"; } }

        //////////////////////////////////////////////////////////////////////
        // MEMBER FUNCTION ///////////////////////////////////////////////////

        function pick_node_color(d) {
            if ((d.data.maximum_longevity > 0.00) && (!d.data.status)) { return "blue"; }
            else if ((d.data.maximum_longevity == 0.00) && (d.data.status)) { return "green"; }
            else if ((d.data.maximum_longevity > 0.00) && (d.data.status)) { return "red"; }
            else { return "white"; }
        } // end function

        function pick_text_color(d) {
            if ((d.data.maximum_longevity > 0.00) && (!d.data.status)) { return "blue"; }
            else if ((d.data.maximum_longevity == 0.00) && (d.data.status)) { return "green"; }
            else if ((d.data.maximum_longevity > 0.00) && (d.data.status)) { return "red"; }
            else { return "black"; }
        } // end function

        function pick_radius(d) {
            if (d.data.xrefID) { return 5; }
            else { return 4.5; }
        } // end function

        function display_hover_box(data, coordinates) {
            hover_box.area.style("display", "block");
            let new_x = 0; let new_y = 0;
            if (!mobile) {
                new_x = ((coordinates[0] * zoomTrans.scale) + zoomTrans.x) + 10;
                new_y = ((coordinates[1] * zoomTrans.scale) + zoomTrans.y) + 18;
            } // end if
            hover_box.area.attr("x", new_x + "px").attr("y", new_y + "px");
            hover_box.x = new_x;
            hover_box.y = new_y;
            hover_box.display.html(function() { return display_record(data); });
            let rect = document.getElementById('hover-box').getBoundingClientRect();
            rect.width = Math.floor(rect.width / window_dimensions.pixel_ratio);
            rect.height = Math.floor(rect.height / window_dimensions.pixel_ratio);
            hover_box.width = rect.width;
            hover_box.height = rect.height;
            hover_box.area.style("height", (rect.height + 5) + "px")
            hover_box.close.style("top", (((rect.height + 2) - 6) * -1) + "px");
            hover_box.clipboard_btn = document.getElementById("add-to-clipboard-btn");
            hover_box.clipboard = hover_box.clipboard_btn.getAttribute('data-button');
            hover_box.clipboard_btn.addEventListener("click", function() {
                create_clipboard_record("organism", "xrefID", JSON.parse(hover_box.clipboard).xrefID);
                add_to_clipboard(JSON.parse(hover_box.clipboard).xrefID, "organism", hover_box.clipboard, true);
            });
        } // end function

        function display_record(data) {
            let str = '';
            if (!mobile) { str = '<p class="color-base-dark compressed-text" style="text-align: center;">Click and drag to move</p>'; }
            else { str = '<br>'; }

            // organism name
            if (data.organism_name) { str += '<p style="text-align: left;"><b>Organism Name:</b> <i>' + data.organism_name + '</i></p>'; }
            else if (data.name) { str += '<p style="text-align: left;"><b>Organism Name:</b> <i>' + data.name + '</i></p>'; }

            // common name
            if (data.common_name) { str += '<p style="text-align: left;"><b>Common Name:</b> ' + data.common_name + '</p>'; }

            // maximum longevity
            if (data.maximum_longevity > 0.00) {
                str += '<p style="text-align: left;">';
                str += '<b>';
                str += 'Maximum Longevity: ';
                if (data.xrefID) { str += '<a href="https://www.moiraiconservation.org/dashboard?tab_code=lifespanViewer&xrefID=' + data.xrefID + '" id="longevity" class="link" target="_blank">'; }
                else if (data.organism_name) { str += '<a href="https://www.moiraiconservation.org/dashboard?tab_code=lifespanViewer&organism_name=' + data.organism_name + '" id="longevity" class="link" target="_blank">'; }
                else if (data.name) { str += '<a href="https://www.moiraiconservation.org/dashboard?tab_code=lifespanViewer&organism_name=' + data.name + '" id="longevity" class="link" target="_blank">'; }
                else { str += '<a href="#" id="longevity" class="link" target="_blank">'; }
                if (data.maximum_longevity < 99999.99) {
                    str += data.maximum_longevity;
                    str += ' years';
                } // end if
                else { str += 'Immortal'; }
                str += '</a>';
                str += '</b>';
                str += '</p>';
            } // end if
            else {
                str += '<p style="text-align: left;">';
                str += '<b>';
                str += 'Maximum Longevity: ';
                if (data.xrefID) { str += '<a href="https://www.moiraiconservation.org/dashboard?tab_code=lifespanViewer&xrefID=' + data.xrefID + '" id="longevity" class="link" target="_blank">'; }
                else if (data.organism_name) { str += '<a href="https://www.moiraiconservation.org/dashboard?tab_code=lifespanViewer&organism_name=' + data.organism_name + '" id="longevity" class="link" target="_blank">'; }
                else if (data.name) { str += '<a href="https://www.moiraiconservation.org/dashboard?tab_code=lifespanViewer&organism_name=' + data.name + '" id="longevity" class="link" target="_blank">'; }
                else { str += '<a href="#" id="longevity" class="link" target="_blank">'; }
                str += 'Unknown';
                str += '</a>';
                str += '</b>';
                str += '</p>';
            } // end else

            // genome status
            if (data.status) {
                str += '<p style="text-align: left;">';
                str += '<b>';
                str += 'Genome Status: ';
                str += '<a href="https://www.moiraiconservation.org/dashboard?tab_code=ncbiRecordViewer&uid=' + data.uid + '" id="genome" class="link" target="_blank">';
                str +=  data.status;
                str += ' sequence';
                str += '</a>';
                str += '</b>';
                str += '</p>';
            } // end if
            else { str += '<p style="text-align: left;"><b>Genome Status:</b> Not sequenced</p>'; }

            // conservation status
            str += '<p style="text-align: left;">';
            str += '<b>IUCN Conservation Status:</b> ';
            str += '<a href="https://www.iucnredlist.org/" id="iucn" class="link-black" target="_blank">';
            str += 'Loading ...';
            str += '</a>';
            str += '</p>';
            if (data.organism_name) { get_conservation_status(data.organism_name); }
            else { get_conservation_status(data.name); }

            // Encyclopedia of Life
            str += '<p style="text-align: left;">';
            str += '<b>Encyclopedia of Life:</b> ';
            str += '<a href="" id="eol" class="link-black" target="_blank">';
            str += 'Loading ...';
            str += '</a>';
            str += '</p>';
            if (data.organism_name) { get_eol_page(data.organism_name); }
            else { get_eol_page(data.name); }

            // Google search
            str += '<p style="text-align: left;">';
            str += '<b>';
            str += 'Google: ';
            if (data.organism_name) { str += '<a href="https://www.google.com/search?q=' + data.organism_name.replace(/ /g, '+') + '&oq=' + data.organism_name.replace(/ /g, '+') + '" id="google-search" class="link" target="_blank">'; }
            else if (data.name) { str += '<a href="https://www.google.com/search?q=' + data.name.replace(/ /g, '+') + '&oq=' + data.name.replace(/ /g, '+') + '" id="google-search" class="link" target="_blank">'; }
            else { str += '<p>Not available</p>'; }
            str += 'Search';
            str += '</a>';
            str += '</b>';
            str += '</p>';

            // add to clipboard button
            if (!data.name              ) { data.name               =   '';   }
            if (!data.ott_id            ) { data.ott_id             =   '';   }
            if (!data.xrefID            ) { data.xrefID             =   '';   }
            if (!data.organism_name     ) { data.organism_name      =   '';   }
            if (!data.common_name       ) { data.common_name        =   '';   }
            if (!data.maximum_longevity ) { data.maximum_longevity  =   0.00; }
            if (!data.status            ) { data.status             =   '';   }
            str += '<div class="center">';
            str += '<button id="add-to-clipboard-btn" class="btn-outline" ';
            str += 'data-button=\'' + JSON.stringify(data) + '\'';
            str += '>';
            str += 'Add to clipboard';
            str += '</button>'; // end add-to-clipboard button
            str += '</div>'; // end center

            return str;

        } // end function

        function get_conservation_status(name) {
            if (typeof(name) === 'undefined') { return; }
            let api_address = "http://apiv3.iucnredlist.org/api/v3/species/";
            api_address += encodeURI(name);
            let terms = "token=" + api_key.IUCN;
            API_POST(terms, api_address, update_conservation_status, false);
        } // end function

        function update_conservation_status(json) {
            var category;
            let record = JSON.parse(json);
            if (!record.result) { category = false; }
            if (typeof(record.result[0]) === 'undefined') { category = false; }
            else { category = record.result[0].category; }
            let status = document.getElementById("iucn");
            if (status) {
                if (category) {
                    switch(category) {
                        case "NE": { status.innerHTML = "<b>Not Evaluated</b>";            break; }
                        case "DD": { status.innerHTML = "<b>Data Deficient</b>";           break; }
                        case "LC": { status.innerHTML = "<b>Least Concern</b>";            break; }
                        case "NT": { status.innerHTML = "<b>Near Threatened</b>";          break; }
                        case "VU": { status.innerHTML = "<b>Vulnerable</b>";               break; }
                        case "EN": { status.innerHTML = "<b>Endangered</b>";               break; }
                        case "CR": { status.innerHTML = "<b>Critically Endangered</b>";    break; }
                        case "EW": { status.innerHTML = "<b>Extinct in the Wild</b>";      break; }
                        case "EX": { status.innerHTML = "<b>Extinct</b>";                  break; }
                        default: { status.innerHTML = "No Record"; return; }
                    } // end switch
                    let api_address = "http://apiv3.iucnredlist.org/api/v3/weblink/";
                    api_address += encodeURI(record.name);
                    let terms = "token=" + api_key.IUCN;
                    API_POST(terms, api_address, update_conservation_link, false);
                } // end if
                else { status.innerHTML = "No Record"; }
            } // end if
        } // end function

        function update_conservation_link(json) {
            let record = JSON.parse(json);
            let status = document.getElementById("iucn");
            if (status) {
                status.href = record.rlurl;
                status.className = "link";
            } // end if
        } // end function

        function get_eol_page(name) {
            if (typeof(name) === 'undefined') { return; }
            let api_address = "https://eol.org/api/search/1.0.json";
            let terms = "q=" + name;
            terms = terms.replace(/\s/g, "+");
            api_address += "?" + terms;
            API_GET("", api_address, update_eol_link, false);
        } // end function

        function update_eol_link(json) {
            let record = JSON.parse(json);
            let eol = document.getElementById("eol");
            if (eol) {
                if (record.totalResults > 0) {
                    eol.innerHTML = "<b>Entry Available</b>";
                    eol.href = record.results[0].link;
                    eol.className = "link";
                    let element = document.getElementById("longevity");
                    if (element) { element.href += "&eol=" + record.results[0].link; }
                } // end if
                else { eol.innerHTML = "No Record"; }
            } // end if
        } // end function

        //////////////////////////////////////////////////////////////////

        hide_progress_bar();

    } // end try
    catch(err) {
        let no_tree_area = document.getElementById("no-tree-area");
        if (no_tree_area) { no_tree_area.style.display = "block";
        let pan_scroll_text = document.getElementById("pan-scroll-text");
        if (pan_scroll_text) { pan_scroll_text.style.display = "none"; }
            hide_progress_bar();
            hideSpinner();
        } // end if
        return;
    } // end catch
} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function display_tree(ott_id, options, max_tips, depth) {
    //////////////////////////////////////////////////////////////////////
    //
    // This function combines many of the previous functions in order
    // to draw a phylogenetic tree for an organism specified by ott_id.
    //
    //////////////////////////////////////////////////////////////////////
    get_lineage(ott_id)
    .then(lineage => get_best_subtree(lineage, max_tips, depth))
    .then(tree => xref_subtree(tree, options))
    .then(tree => draw_tree(tree, ott_id))
    .catch(e => console.log(e));
} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////
