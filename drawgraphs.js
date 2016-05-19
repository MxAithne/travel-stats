// Global datastores

var totalJourneys = 0; // A count of all the journeys that I've made
var totalvisitedStationCodes = 0; // A count of the total number of unique stations that I've been to
var totalCalsses = 0; // A count of the total number of unique classes of train that I've traveled on
var totalDaysTraveled = 0; // A count of days that have a journey on them

var stationSummary = {};

var journeysPerDay = [];
var journeysByClass = []; 

var stationGrid = [];

// These must be of type list [] for the system to work
var visitedStationCodes = []; // A unique list of the codes of the stations that I've been to
var classNumbers = []; // A unique list of all the classes of train that I've traveled on
var stations = [];



function start()
{
  d3.csv("./travel-data.csv", function(csv)
  {
    d3.csv("./station-codes.csv", function (lookupCsv) 
    {
      genDataFromCSV(csv, lookupCsv);
      drawAll();
    });
  });
}

function drawAll()
{
  console.log("Starting");
  drawBarChart();
  drawHeatCal();
  drawStackedBars("Class", journeysByClass, "count", "class", "#class-graph");
  drawStackedBars("Stations", stations, "tot", "code", "#station-graph");
  drawStackedBars("Departures", stations, "ori", "code", "#station-dep");
  drawStackedBars("Arrivals", stations, "dst", "code", "#station-ari");
  ready(0, stations, stationGrid)
}

function genDataFromCSV(csv, lookupCsv)
{
  totalJourneys = csv.length; // Count the total number of journeys that have been made

  for (var i in csv)
  {
    if (visitedStationCodes.indexOf(csv[i].Origin) == -1) { visitedStationCodes.push(csv[i].Origin); }
    if (visitedStationCodes.indexOf(csv[i].Destination) == -1) { visitedStationCodes.push(csv[i].Destination); }
  }

  totalvisitedStationCodes = visitedStationCodes.length;

  journeysPerDay = d3.nest()
    .key(function(d) { return d.Date; })
    .rollup(function(d) { return d.length; })
    .map(csv);

  totalDaysTraveled = Object.keys(journeysPerDay).length;

  // A dictionary of all the stations, index by their station codes
  var stationDictionary = {};

  // Make station objects for each code
  for (var i in visitedStationCodes)
  {
    stationSummary[visitedStationCodes[i]] = ({"code": visitedStationCodes[i], "ori": 0, "dst": 0, "tot": 0});
  }

  for (var i in lookupCsv)
  {
    if (stationSummary[lookupCsv[i].Code])
    {
      stationSummary[lookupCsv[i].Code]["name"] = lookupCsv[i].Name;
    }
  }

  var origincnt = d3.nest()
    .key(function(d) {return d.Origin; })
    .rollup(function(v) {return v.length; })
    .entries(csv)
    .forEach(function(m) { stationSummary[m.key].ori = m.values; });
  var destcnt = d3.nest()
    .key(function(d) {return d.Destination; })
    .rollup(function(v) {return v.length; })
    .entries(csv)
    .forEach(function(m) { stationSummary[m.key].dst = m.values; });

  // Add origins to destinations for total journeys to/from station

  for (var i in stationSummary)
  {
    stationSummary[i].tot = stationSummary[i].ori + stationSummary[i].dst;
  }

  // Make a list of all the stations

  for (var i in stationSummary)
  {
    stations.push(stationSummary[i]);
  }

  stations.sort(function (a, b) { return b.tot - a.tot; });
  visitedStationCodes.sort(function (a, b) { return stationSummary[b].tot - stationSummary[a].tot; });

  console.log("Total journeys: " + totalJourneys);
  console.log("List of station codes visited: " + visitedStationCodes);
  console.log("Total unique stations vistied: " + totalvisitedStationCodes);
  console.log("Total days spend traveling: " + totalDaysTraveled);
  console.log("Journeys per day: ");
  console.log(journeysPerDay);

  
  // Generate an NxN grid of zeros
  var size = totalvisitedStationCodes;
  for (var x = 0; x < totalvisitedStationCodes; x++)
  {
    stationGrid[x] = [];

    for (var y = 0; y < totalvisitedStationCodes; y++)
    {
      stationGrid[x][y] = 0;
    }
  }

  // For each journey, update the journeys table
  for (var i in csv)
  {
    var x = visitedStationCodes.indexOf(csv[i].Origin);
    var y = visitedStationCodes.indexOf(csv[i].Destination);
    stationGrid[x][y]++;
  }

  // Group the journeys by class
  journeysByClass = d3.nest()
    .key(function(d) {return d.Class; })
    .rollup(function(v) {return v.length; })
    .entries(csv)
    .map(function (d) { return { "class": d.key, "count": d.values }; });

  classNumbers = journeysByClass.map(function (d) { return d.class });
}

function drawStackedBars(title,dataset,quantity,label,location)
{
  // Work out the start position and end position for each class
  var currentPosition = 0;
  var datatotal = 0;
  var data = [];
  for (var i in dataset)
  {
    data[i] = {
      start: currentPosition,
      end: currentPosition + dataset[i][quantity],
      label: dataset[i][label]
    };

    currentPosition = currentPosition + dataset[i][quantity];

    datatotal = datatotal + dataset[i][quantity];
  }

  var width = 800;
  d3.select(location)
    .attr("width", width)
    .attr("height", 50);

  var x = d3.scale.linear()
    .domain([0, datatotal])
    .range([0, width]);

  var colours = d3.scale.category20()
    .domain(data.map(function (d) { return d.label; } ));

  var groups = d3.select(location).selectAll("g")
    .data(data)
    .enter().append("g");

  groups.append("rect")
    .attr("x", function (group) { return x(group.start); })
    .attr("y", 0)
    .attr("width", function (group) { return x(group.end) - x(group.start); })
    .attr("height", 50)
    .attr("style", function (group) { return "fill:" + colours(group.label)});

  groups.append("text")
    .attr("x", function (group) { return x(group.start) + 5; })
    .attr("y", 25)
    .text(function (group) { return group.label; } )
    .attr("glyph-orientation-vertical", "90")
    .attr("writing-mode", "tb-rl");
}

function drawBarChart()
{
  console.log("Drawing bar chart");

  d3.csv("./travel-data.csv", function(data)
  {

    var barWidth = 800;
  	var barHeight = 25;
  	var xoffset = 100;

  	var x = d3.scale.linear()
  		.range([0, barWidth - (xoffset + 10) ]);

  	var chart = d3.select("#travel-graph")
  		.attr("width", barWidth);

  		// Set the scale for the x-axis so it goes from 0 to the biggest value
  	x.domain([0, d3.max(stations, function(station) { 
  		return Math.max(station.ori, station.dst); 
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
  			return xoffset + x(station.ori);
  		})
  		.attr("y2", barHeight * (1/3))
  		.attr("class", "origin");
  	bar.append("line")
  		.attr("x1", xoffset)
  		.attr("y1", barHeight * (2/3))
  		.attr("x2", function(station) { 
  			return xoffset + x(station.dst);
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
  		.attr("x", function(station) { return xoffset + x(station.ori) + 5; })
  		.attr("y", barHeight * (1/3))
  		.attr("dy", ".35em")
  		.text(function(station) { return station.ori; });

  	bar.append("text")
  		.attr("x", function(station) { return xoffset + x(station.dst) + 5; })
  		.attr("y", barHeight * (2/3))
  		.attr("dy", ".35em")
  		.text(function(station) { return station.dst; });
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

    rect.filter(function(d) { return d in journeysPerDay; })
      .attr("style", function(d) { return "fill:" + color(journeysPerDay[d]); })
      .select("title")
      .text(function(d) { return d + ": " + journeysPerDay[d]; });
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
