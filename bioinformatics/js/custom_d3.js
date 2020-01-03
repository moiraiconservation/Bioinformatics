///////////////////////////////////////////////////////////////////////////////////////////////////

function d3_spline(d) {
    //////////////////////////////////////////////////////////////////////
    //
    // Returns a string formatted for drawing a curved line between the
    // source and the destination nodes of a tree structure
    //
    // Usage:
    //      ...
    //    .selectAll("path)
    //    .data(links)
    //    .join("path")
    //    .attr("d", d3_spline);
    //
    //////////////////////////////////////////////////////////////////////
    return "M" + d.source.y + "," + d.source.x
        + "C" + (d.source.y + d.target.y) / 2 + "," + d.source.x
        + " " + (d.source.y + d.target.y) / 2 + "," + d.target.x
        + " " + d.target.y + "," + d.target.x;
} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function d3_phylogenetic_line(d) {
    //////////////////////////////////////////////////////////////////////
    //
    // Returns a string formatted for drawing an angled line between the
    // source and the destination nodes of a tree structure
    //
    // Usage:
    //      ...
    //    .selectAll("path)
    //    .data(links)
    //    .join("path")
    //    .attr("d", d3_phylogenetic_line);
    //
    //////////////////////////////////////////////////////////////////////
    let two_thirds_point = Math.round(d.source.y + (0.67 * (d.target.y - d.source.y)));

    return "M" + d.source.y + "," + d.source.x + " "
        + "L" + two_thirds_point + "," + d.source.x + " "
        + "L" + two_thirds_point + "," + d.target.x + " "
        + "L" + d.target.y + "," + d.target.x;
} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function d3_histogram(data, element_id, options) {

    if (!data) { return; }
    if (!element_id) { return; }
    let element_check = document.getElementById(element_id);
    if (!element_check) { return; }
    if (!options) { options = { }; }
    if (!options.color) { options.color = 'green'; }
    if (!options.highlight) { options.highlight = 'chartreuse'; }
    element_check.style.width  = "100%";
    if (options.height) { element_check.style.height = options.height; }
    else { element_check.style.height = "360px"; }
    element_check.style.overflowX = "auto";
    element_check.style.overflowY = "hidden";
    var margin = { top: 10, right: 10, bottom: 60, left: 60 };
    var div_width  = Math.floor(element_check.getBoundingClientRect().width);
    var div_height = Math.floor(element_check.getBoundingClientRect().height);
    var svg_width = div_width;

    let threshold = 20;
    if (options.bins) { threshold = options.bins; }
    else {
        threshold = Math.ceil((d3.max(data) - d3.min(data)) / 5);
        if (threshold < 10) { threshold = data.length; }
    } // end else
    if (threshold > svg_width) { svg_width = threshold; }

    var width  = svg_width - margin.left - margin.right;
    var height = div_height - margin.top - margin.bottom;

    var svg = d3.select('#' + element_id)
      .append("svg")
        .attr("width",  svg_width)
        .attr("height", div_height);

    var g = svg.append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
        .domain([d3.min(data), d3.max(data)])
        .range([margin.left, (svg_width - margin.right)]);

    svg.append("g")
        .attr("transform", "translate(0," + (div_height - margin.bottom) + ")")
        .call(d3.axisBottom(x));

    if (options.x_label) {
        svg.append("text")
            .attr("transform", "translate(" + (div_width / 2) + " ," + ((div_height - margin.bottom) + 35) + ")")
            .style("text-anchor", "middle")
            .text(options.x_label);
    } // end if

    var bins = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(threshold))
        (data);

    var y = d3.scaleLinear()
        .domain([0, d3.max(bins, function(d) { return d.length; })])
        .range([(div_height - margin.bottom), margin.top]);

    svg.append("g")
        .attr("transform", "translate(" + margin.left + ", 0)")
        .call(d3.axisLeft(y));

    if (options.y_label) {
        svg.append("text")
        .attr("text-anchor", "middle")
        .attr("y", 5)
        .attr("x", 0 - Math.round((div_height - margin.bottom) / 2))
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
            .text(options.y_label);
    } // end y-label

    var bar = g.selectAll(".bar")
      .data(bins)
      .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) {
            return "translate(" + (Math.round(x(d.x0)) - margin.left) + "," + (Math.round(y(d.length)) - margin.top) + ")";
        })
        .style("fill", options.color);

    let bar_width = Math.round(x(bins[0].x1) - x(bins[0].x0)) + 1;
    if (bar_width > 3) { bar_width--; }
    if (bar_width < 1) { bar_width = 1; }

    bar.append("rect")
        .attr("x", 0)
        .attr("width", bar_width)
        .attr("height", function(d) {
            let bar_height = Math.round((div_height - margin.bottom) - y(d.length));
            if (bar_height > 1) { return bar_height; }
            else { return 1; }
        });

        bar
            .on("mouseover", function(d) {
                let barTransform = this.getAttribute("transform");
                let barX = parseInt(barTransform.substring(barTransform.lastIndexOf("(") + 1, barTransform.lastIndexOf(",")));
                let barY = parseInt(barTransform.substring(barTransform.lastIndexOf(",") + 1, barTransform.lastIndexOf(")")));
                let aa = Math.round((d[0] + d[d.length - 1]) / 2);
                let n = d.length;
                d3.select(this)
                    .style("fill", options.highlight)
                    .append("text")
                        .attr("y", ((div_height - margin.bottom) + 15) - barY)
                        .style("text-anchor", "middle")
                        .style("fill", "black")
                        .text(aa + " amino acids");
                d3.select(this)
                    .append("text")
                        .attr("x", 0 - (barX + Math.round(margin.left / 2)))
                        .style("text-anchor", "middle")
                        .style("fill", "black")
                        .text(n);
                d3.select(this)
                    .append("line")
                        .attr("x1", 0)
                        .attr("y1", 0)
                        .attr("x2", 0 - (barX + Math.round(margin.left / 2)))
                        .attr("y2", 0)
                        .attr("stroke", options.highlight)
                        .attr("stroke-width", 1);
            })
            .on("mouseout",  function(d) {
                d3.select(this)
                .style("fill", options.color)
                .selectAll("text").remove();
                d3.select(this)
                .selectAll("line").remove();
            });

} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////

function d3_bar_graph(data, element_id, options) {

    if (!data) { return; }
    if (!element_id) { return; }
    let element_check = document.getElementById(element_id);
    if (!element_check) { return; }
    if (!options) { options = { }; }
    if (!options.color) { options.color = 'green'; }
    if (!options.highlight) { options.highlight = 'chartreuse'; }
    element_check.style.width  = "100%";
    if (options.height) { element_check.style.height = options.height; }
    else { element_check.style.height = "360px"; }
    element_check.style.overflowX = "auto";
    element_check.style.overflowY = "hidden";
    var margin = { top: 50, right: 10, bottom: 60, left: 60 };
    var div_width  = Math.floor(element_check.getBoundingClientRect().width);
    var div_height = Math.floor(element_check.getBoundingClientRect().height);
    var svg_width = div_width;
    var width  = svg_width - margin.left - margin.right;
    var height = div_height - margin.top - margin.bottom;

    let graph = { };
    graph.keys = Object.keys(data[0]);

    var svg = d3.select('#' + element_id)
      .append("svg")
        .attr("width",  svg_width)
        .attr("height", div_height);

    var g = svg.append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data in the domains
    // set the ranges
    var x = d3.scaleBand()
        .domain(data.map(function(d) { return d[graph.keys[0]]; }))
        .range([margin.left, (svg_width - margin.right)]).padding(0.1);
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d[graph.keys[1]]; })])
        .range([(div_height - margin.bottom), margin.top]);

    // append the rectangles for the bar chart
    var bar = svg.selectAll(".bar")
        .data(data)
            .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d[graph.keys[0]]); })
                .attr("width", x.bandwidth())
                .attr("y", function(d) { return y(d[graph.keys[1]]); })
                .attr("height", function(d) {
                    let bar_height = Math.round((div_height - margin.bottom) - y(d[graph.keys[1]]));
                    if (bar_height > 1) { return bar_height; }
                    else { return 1; }
                })
                .style("fill", options.color);

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + (div_height - margin.bottom) + ")")
        .call(d3.axisBottom(x));

    if (options.x_label) {
        svg.append("text")
            .attr("transform", "translate(" + (div_width / 2) + " ," + ((div_height - margin.bottom) + 35) + ")")
            .style("text-anchor", "middle")
            .text(options.x_label);
    } // end if

    // add the y Axis
    svg.append("g")
        .attr("transform", "translate(" + margin.left + ", 0)")
        .call(d3.axisLeft(y));

    if (options.y_label) {
        svg.append("text")
        .attr("text-anchor", "middle")
        .attr("y", -15)
        .attr("x", 0 - Math.round((div_height - margin.bottom) / 2))
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
            .text(options.y_label);
    } // end y-label

    bar.on("mouseover", function(d) {
        let barX = parseInt(this.getAttribute("x"));
        let barY = parseInt(this.getAttribute("y"));
        d3.select(this).style("fill", options.highlight);
        svg.append("text")
            .attr("class", "bar_caption")
            .attr("x", barX + Math.round(x.bandwidth() / 2))
            .attr("y", barY - 5)
            .style("fill", "black")
            .style("text-anchor", "middle")
            .text(d[graph.keys[1]].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        if (graph.keys[2]) {
            svg.append("text")
                .attr("class", "bar_caption")
                .attr("x", barX + Math.round(x.bandwidth() / 2))
                .attr("y", barY - 25)
                .style("fill", "black")
                .style("text-anchor", "middle")
                .text(d[graph.keys[2]]);
        } // end if
    });
    bar.on("mouseout",  function(d) {
        d3.select(this).style("fill", options.color);
        svg.selectAll(".bar_caption").remove();
    });
    
} // end function

///////////////////////////////////////////////////////////////////////////////////////////////////
