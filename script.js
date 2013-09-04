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

queue()
    .defer(d3.json, "us.json")
    .defer(d3.tsv, "influenza.tsv", function(d) { rateById.set(d.id, +d.rate); })
    .await(ready);

var g;
function ready(error, us) {
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