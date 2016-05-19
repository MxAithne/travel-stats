function drawAll()
{
  console.log("Starting");
  drawBarChart();
  drawHeatCal();
  drawClassBars();
}

function drawClassBars()
{
  console.log("Drawing classes chart");

  d3.csv("./travel-data.csv", function(data)
  {
    var width = 800;
    d3.select("#class-graph").attr("width", width);

    // Count up the total number of journeys (the number of rows in the CSV file)
    var totalJourneys = data.length;

    // Group the journeys by class
    var byClass = d3.nest()
      .key(function(d) {return d.Class; })
      .rollup(function(v) {return v.length; })
      .entries(data);

    // Work out the start position and end position for each class
    var currentPosition = 0;
    for (var i in byClass)
    {
      byClass[i].start = currentPosition;
      byClass[i].end = currentPosition + byClass[i].values;
      currentPosition = currentPosition + byClass[i].values;
    }

    var x = d3.scale.linear()
      .domain([0, totalJourneys])
      .range([0, width]);

    var classNumbers = byClass.map(function (classGroup) { return classGroup.key; } );

    var colours = d3.scale.category20()
      .domain(classNumbers);

    var svg = d3.select("#class-graph").selectAll("rect")
      .data(byClass)
    .enter().append("rect")
      .attr("x", function (classGroup) { return x(classGroup.start); })
      .attr("y", 0)
      .attr("width", function (classGroup) { return x(classGroup.end) - x(classGroup.start); })
      .attr("height", 50)
      .attr("style", function (classGroup) { return "fill:" + colours(classGroup.key)});
  });
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

    var barWidth = 800;
  	var barHeight = 25;
  	var xoffset = 100;

  	var x = d3.scale.linear()
  		.range([0, barWidth - (xoffset + 10) ]);

  	var chart = d3.select("#travel-graph")
  		.attr("width", barWidth);

  		// Set the scale for the x-axis so it goes from 0 to the biggest value
  	x.domain([0, d3.max(stations, function(station) { 
  		return Math.max(station.origin, station.dest); 
  	})]); 

  	// Set the height of the whole graph
  	chart.attr("height", barHeight * stations.length);

  	// Make a "g" SVG element for each station (this means "group" of items in SVG)
  	var bar = chart.selectAll("g")
  		.data(stations)
  		.enter().append("g")
  		.attr("transform", function(station, i) { return "translate(0," + (i * barHeight) + ")"; });

  	// Make "lines" SVG elements for arrivals and departures
  	bar.append("line")
  		.attr("x1", xoffset)
  		.attr("y1", barHeight * (1/3))
  		.attr("x2", function(station) { 
  			return xoffset + x(station.origin);
  		})
  		.attr("y2", barHeight * (1/3))
  		.attr("class", "origin");
  	bar.append("line")
  		.attr("x1", xoffset)
  		.attr("y1", barHeight * (2/3))
  		.attr("x2", function(station) { 
  			return xoffset + x(station.dest);
  		})
  		.attr("y2", barHeight * (2/3))
  		.attr("class", "dest");

  	// Put some text next to the lines
  	bar.append("text")
  		.attr("x", xoffset - 10)
  		.attr("y", barHeight * 0.5)
  		.attr("dy", ".35em")
  		.attr("class", "stationCode")
  		.text(function(station) { return station.code; });

    bar.append("line")
      .attr("x1", xoffset)
      .attr("x2", xoffset)
      .attr("y1", 0)
      .attr("y2", barHeight)
      .attr("class", "rule");

    bar.append("line")
      .attr("x1", xoffset - 5)
      .attr("x2", xoffset)
      .attr("y1", barHeight * 0.5)
      .attr("y2", barHeight * 0.5)
      .attr("class", "rule");

  	bar.append("text")
  		.attr("x", function(station) { return xoffset + x(station.origin) + 5; })
  		.attr("y", barHeight * (1/3))
  		.attr("dy", ".35em")
  		.text(function(station) { return station.origin; });

  	bar.append("text")
  		.attr("x", function(station) { return xoffset + x(station.dest) + 5; })
  		.attr("y", barHeight * (2/3))
  		.attr("dy", ".35em")
  		.text(function(station) { return station.dest; });
  });
}

/* Calendar Heat Graph */

var cellSize = 17; // cell size

var day = function(d) { return (d.getDay() + 6) % 7; }, // monday = 0
    week = d3.time.format("%W"), // monday-based week number
    date = d3.time.format("%Y-%m-%d"),
    percent = d3.format("+.1%");

var margin = {top: 5.5, right: 0, bottom: 5.5, left: 19.5},
    hgWidth = 960 - margin.left - margin.right,
    hgHeight = 130 - margin.top - margin.bottom,
    size = hgHeight / 7;

var color = d3_scale.scaleMagma()
    .domain([0, 5])

function drawHeatCal()
{
  
  var svg = d3.select("#calheat").selectAll("svg")
      .data(d3.range(2016, 2017))
    .enter().append("svg")
      //.attr("class", "RdYlGn")
      .attr("width", hgWidth + margin.left + margin.right)
      .attr("height", hgHeight + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("text")
      .attr("transform", "translate(-6," + size * 3.5 + ")rotate(-90)")
      .attr("text-anchor", "middle")
      .text(function(d) { return d; });

  var rect = svg.selectAll(".day")
      .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
    .enter().append("rect")
      .attr("class", "day")
      .attr("width", size)
      .attr("height", size)
      .attr("x", function(d) { return week(d) * size; })
      .attr("y", function(d) { return day(d) * size; })
      .datum(date);

  rect.append("title")
      .text(function(d) { return d; });

  svg.selectAll(".month")
      .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
    .enter().append("path")
      .attr("class", "month")
      .attr("d", monthPath);

  d3.csv("travel-data.csv", function(csv) {
    var data = d3.nest()
      .key(function(d) { return d.Date; })
      .rollup(function(d) { return d.length; })
      .map(csv);

    console.log(data);

    rect.filter(function(d) { return d in data; })
      .attr("style", function(d) { return "fill:" + color(data[d]); })
      //.attr("class", function(d) { return "day q" + color(data[d]) + "-9"; })
      .select("title")
      .text(function(d) { return d + ": " + data[d]; });
  });
}

function monthPath(t0) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = +day(t0), w0 = +week(t0),
      d1 = +day(t1), w1 = +week(t1);
  return "M" + (w0 + 1) * size + "," + d0 * size
      + "H" + w0 * size + "V" + 7 * size
      + "H" + w1 * size + "V" + (d1 + 1) * size
      + "H" + (w1 + 1) * size + "V" + 0
      + "H" + (w0 + 1) * size + "Z";
}

/* Normalised stacked bar */

