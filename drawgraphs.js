function drawAll()
{
  console.log("Starting");
  drawBarChart();
  drawHeatCal();
}


function drawBarChart()
{
  console.log("Drawing bar chart");

  d3.csv("./travel-data.csv", function(data)
  {
  	// A dictionary of all the stations, index by their station codes
  	var stationDictionary = {};

  	// Make a list of all the codes that represent either an origin or destination
  	var usedcodes = [];
  	for (var i in data)
  	{
  		if (usedcodes.indexOf(data[i].Origin) == -1) { usedcodes.push(data[i].Origin); }
  		if (usedcodes.indexOf(data[i].Destination) == -1) { usedcodes.push(data[i].Destination); }
  	}

  	// Make station objects for each code
  	for (var i in usedcodes)
  	{
  		stationDictionary[usedcodes[i]] = ({"code": usedcodes[i], "origin": 0, "dest": 0});
  	}

  	console.log(data[0]);

  	var origincnt = d3.nest()
  		.key(function(d) {return d.Origin; })
  		.rollup(function(v) {return v.length; })
  		.entries(data)
  		.forEach(function(m) { stationDictionary[m.key].origin = m.values; });
  	var destcnt = d3.nest()
  		.key(function(d) {return d.Destination; })
  		.rollup(function(v) {return v.length; })
  		.entries(data)
  		.forEach(function(m) { stationDictionary[m.key].dest = m.values; });

  	// Make a list of all the stations
  	var stations = [];
  	for (var i in stationDictionary)
  	{
  		stations.push(stationDictionary[i]);
  	}

  	// Figure out the total times a station has been used as an origin or destination
  	for (var i in stations) 
  	{
  		stations[i].totjourney = stations[i].origin + stations[i].dest;
  	}

  	stations.sort(function (a, b) { return b.totjourney - a.totjourney; });

  	console.log(stations);

    var bwidth = 500;
  	var barHeight = 10;
  	var xoffset = 100;

  	var x = d3.scale.linear()
  		.range([0, bwidth - (xoffset + 10) ]);

  	var chart = d3.select("#travel-graph")
  		.attr("width", bwidth);

  		// Set the scale for the x-axis so it goes from 0 to the biggest value
  	x.domain([0, d3.max(stations, function(station) { 
  		return Math.max(station.origin, station.dest); 
  	})]); 

  	// Set the height of the whole graph
  	chart.attr("height", barHeight * 2.5 * stations.length);

  	// Make a "g" SVG element for each station (this means "group" of items in SVG)
  	var bar = chart.selectAll("g")
  		.data(stations)
  		.enter().append("g")
  		.attr("transform", function(station, i) { return "translate(0," + (i * barHeight * 2.5) + ")"; });

  	// Make "lines" SVG elements for arrivals and departures
  	bar.append("line")
  		.attr("x1", xoffset)
  		.attr("y1", barHeight * 0.5)
  		.attr("x2", function(station) { 
  			return xoffset + x(station.origin);
  		})
  		.attr("y2", barHeight * 0.5)
  		.attr("class", "origin");
  	bar.append("line")
  		.attr("x1", xoffset)
  		.attr("y1", barHeight * 1.5)
  		.attr("x2", function(station) { 
  			return xoffset + x(station.dest);
  		})
  		.attr("y2", barHeight * 1.5)
  		.attr("class", "dest");

  	// Put some text next to the lines
  	bar.append("text")
  		.attr("x", xoffset - 10)
  		.attr("y", barHeight * 1)
  		.attr("dy", ".35em")
  		.attr("class", "stationCode")
  		.text(function(station) { return station.code; });

  	bar.append("text")
  		.attr("x", function(station) { return xoffset + x(station.origin) + 5; })
  		.attr("y", barHeight * 0.5)
  		.attr("dy", ".35em")
  		.text(function(station) { return station.origin; });

  	bar.append("text")
  		.attr("x", function(station) { return xoffset + x(station.dest) + 5; })
  		.attr("y", barHeight * 1.5)
  		.attr("dy", ".35em")
  		.text(function(station) { return station.dest; });
  });
}

/* Calendar Heat Graph */
var cellSize = 17; // cell size

function drawHeatCal()
{
  console.log("Drawing heat calendar");

  var width = 960,
      height = 136;

  var percent = d3.format(".1%"),
      format = d3.time.format("%Y-%m-%d");

  var color = d3.scale.quantize()
      .domain([0, 5])
      .range(d3.range(11).map(function(d) { return "q" + d + "-11"; }));

  var svg = d3.select("#calheat")
      .selectAll("svg")
      .data(d3.range(2016, 2017))
      .enter().append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "RdYlGn")
      .append("g")
      .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

  svg.append("text")
      .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
      .style("text-anchor", "middle")
      .text(function(d) { return d; });

  var rect = svg.selectAll(".day")
      .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter().append("rect")
      .attr("class", "day")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("x", function(d) { return d3.time.weekOfYear(d) * cellSize; })
      .attr("y", function(d) { return d.getDay() * cellSize; })
      .datum(format);

  rect.append("title")
      .text(function(d) { return d; });

  svg.selectAll(".month")
      .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter().append("path")
      .attr("class", "month")
      .attr("d", monthPath);

  d3.csv("travel-data.csv", function(error, csv) {
    if (error) throw error;

    var data = d3.nest()
      .key(function(d) { return d.Date; })
      .rollup(function(d) { return d.length; })
      .map(csv);

    rect.filter(function(d) { return d in data; })
      .attr("class", function(d) { return "day " + color(data[d]); })
      .select("title")
      .text(function(d) { return d + ": " + data[d]; });
  });
}

function monthPath(t0)
{
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = t0.getDay(), w0 = d3.time.weekOfYear(t0),
      d1 = t1.getDay(), w1 = d3.time.weekOfYear(t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
      + "H" + w0 * cellSize + "V" + 7 * cellSize
      + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
      + "H" + (w1 + 1) * cellSize + "V" + 0
      + "H" + (w0 + 1) * cellSize + "Z";
}

