var file = "influenza.tsv";
var time = 1;
function getData(salary){
  time = document.forms[0].dataset.value;
  switch(time) {
    case "0":
      file = "past.tsv";
      break;
    case "1":
      file = "influenza.tsv";
      break;
    case "2":
      file = "future.tsv";
      break;
  }
}

var width = 910,
    height = 500,
	centered;

var projection = d3.geo.albersUsa()
	.scale(1070)
	.translate([width / 2, height / 2]);
	
var rateById = d3.map();

var quantize = d3.scale.quantize()
    .domain([0, .15])
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

var path = d3.geo.path()
	.projection(projection);

var g;
function ready(error, us) {
	// checks if an svg has already been appended. if so, remove before appending new one
	var map = d3.select("#interactiveMap").select("svg");
	if (map != null) map.remove();
	
  var svg = d3.select("#interactiveMap").append("svg")
	.attr("width", width)
	.attr("height", height);

  svg.append("rect")
	.attr("class", "background")
	.attr("width", width)
	.attr("height", height)
	.on("click", clicked);

  g = svg.append("g")
	
  g.append("g")
      .attr("class", "counties")
    .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
      .attr("class", function(d) { return quantize(rateById.get(d.id)); })
      .attr("d", path)
  	  .on("click", clicked);

  g.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "states")
      .attr("d", path);
}

function clicked(d) {
	var x, y, k;
	
	if (d && centered !== d) {
	    var centroid = path.centroid(d);
	    x = centroid[0];
	    y = centroid[1];
	    k = 8;
	    centered = d;
	  } else {
	    x = width / 2;
	    y = height / 2;
	    k = 1;
	    centered = null;
	  }

	  g.selectAll("path")
	      .classed("active", centered && function(d) { return d === centered; });

	  g.transition()
	      .duration(750)
	      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	      .style("stroke-width", 1.5 / k + "px");
}

/**
 * Functions enabling switching between different time snapshots.
 */
var past_index = 0;
var present_index = 1;
var future_index = 0;

function calculate(slider) {
    past_index = (50 - slider) / 50;
    if (past_index < 0) { past_index = 0; }
    present_index = 1 - Math.abs((slider - 50) / 50);
    future_index = (slider - 50) / 50;
    if (future_index < 0) {future_index = 0; }
    return past_index.toString() + "; " + present_index.toString() + "; " + future_index.toString();
  };

function queue_past() {
  queue()
    .defer(d3.json, "us.json")
    .defer(d3.tsv, "all.tsv", function(d) { rateById.set(d.id, +d.past); })
    .await(ready);
};

function queue_present() {
  queue()
    .defer(d3.json, "us.json")
    .defer(d3.tsv, "all.tsv", function(d) { rateById.set(d.id, +d.present); })
    .await(ready);
};

function queue_future() {
  queue()
    .defer(d3.json, "us.json")
    .defer(d3.tsv, "all.tsv", function(d) { rateById.set(d.id, +d.future); })
    .await(ready);
};

function queue_compiled() {
  queue()
    .defer(d3.json, "us.json")
    .defer(d3.tsv, "all.tsv", function(d) {
      rateById.set(d.id, +d.past * past_index + +d.present * present_index + +d.future * future_index); })
    .await(ready);
};

d3.selectAll("input").on("change", change);

var timeout = setTimeout(function() {
    // d3.select("input[value=\"oranges\"]").property("checked", true).each(change);
    d3.select("input[value=\"salary\"]").each(change);
  }, 2000);

function change() {
	getData(time);
	if (time == 0) { queue_past(); }
	else if (time == 1) { queue_present(); }
	else if (time == 2) { queue_future(); }
	else {queue_compiled(); }
	console.log(calculate(time));
}