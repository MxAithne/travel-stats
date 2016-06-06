// Global datastores

var totalJourneys = 0; // A count of all the journeys that I've made
var totalDaysTraveled = 0; // A count of days that have a journey on them

var totalNatRailStations = 0; // The total number of national rail stations
var totalAccessRailStations = 0; // The total number of national rail stations that are fully wheelchair accessible
var totalVisitedStations = 0; // A count of the total number of unique stations that I've been to
var totalVisitedAccessStations = 0; // The total number of unique stations that I've been to that are fully wheelchair accessible

var totalClasses = 0; // A count of the total number of unique classes of train that I've traveled on

var percentDaysTraveled = 0;
var percentAccessRailStations = 0;
var percentVisitedStations = 0;
var percentVisitedAccessStations = 0;

var maxJourneysInDay = 0; // The most rail journey that I have done in one day
var maxJourneysDate = 0; // The date of the most recient day that I did the most rail journeys in

var journeysPerDay = [];
var journeysByClass = []; 

var gridPctJourneys = [];
var gridCntJourneys = [];

// These must be of type list [] for the system to work
var listRoutesTraveled = [];
var listVisitedStationCodes = []; // A unique list of the codes of the stations that I've been to
var listClassNumbers = []; // A unique list of all the classes of train that I've traveled on

var objListStations = [];
var objStationDetails = {};
var objRoutesTraveled = {};

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var percent = d3.format(".1%"); // Sets the format for percentages

function start()
{
  d3.csv("./travel-data.csv", function(csv)
  {
    d3.csv("./data/station-codes.csv", function (lookupCsv) 
    {
      genDataFromCSV(csv, lookupCsv);
      drawAll();
    });
  });
}

function genDataFromCSV(csv, lookupCsv)
// Gets data from the travel-data.csv file and loads in into local varibles for processing and drawing graphs from.
{
  totalJourneys = csv.length; // Count the total number of journeys that have been made

  var nestedByCrsCode = d3.nest()
    .key(function(d) { return d.CrsCode; })
    .rollup(function(d) { return d.length; })
    .map(lookupCsv);
  totalNatRailStations = Object.keys(nestedByCrsCode).length;

  for (var i in csv)
  {
    if (listVisitedStationCodes.indexOf(csv[i].Origin) == -1) { listVisitedStationCodes.push(csv[i].Origin); }
    if (listVisitedStationCodes.indexOf(csv[i].Destination) == -1) { listVisitedStationCodes.push(csv[i].Destination); }
  }

  totalVisitedStations = listVisitedStationCodes.length;

  percentVisitedStations = percent(totalVisitedStations / totalNatRailStations);

  journeysPerDay = d3.nest()
    .key(function(d) { return d.Date; })
    .rollup(function(d) { return d.length; })
    .map(csv);

  // Work out how many days traveled based on length of journeysPerDay
  totalDaysTraveled = Object.keys(journeysPerDay).length;

  // Calcuate the percentage of days traveled on based on a non-leap year
  percentDaysTraveled = percent(totalDaysTraveled / 365);

  // Find the most stations visited in one day
  maxJourneysInDay = d3.max(d3.values(journeysPerDay));

  // A dictionary of all the stations, index by their station codes
  var stationDictionary = {};

  // Make station objects for each code
  for (var i in listVisitedStationCodes)
  {
    objStationDetails[listVisitedStationCodes[i]] = ({"code": listVisitedStationCodes[i], "ori": 0, "dst": 0, "tot": 0});
  }

  totalAccessRailStations = lookupCsv.filter(function (d) { return d.WheelchairAccess == "TRUE";}).length;

  for (var i in lookupCsv)
  {
    if (objStationDetails[lookupCsv[i].CrsCode])
    {
      objStationDetails[lookupCsv[i].CrsCode]["name"] = lookupCsv[i].StationName;

      // As some stations have multiple rows in the lookup csv, and not all have accurate accessibility information record a station as accessible if *any* row says the station is accessible
      objStationDetails[lookupCsv[i].CrsCode]["accessible"] = objStationDetails[lookupCsv[i].CrsCode]["accessible"] || (lookupCsv[i].WheelchairAccess == "TRUE");

      if (lookupCsv[i].WheelchairAccess == "TRUE")
      {
        totalVisitedAccessStations++;
      }

      objStationDetails[lookupCsv[i].CrsCode].location = (new ospoint(lookupCsv[i].Northing, lookupCsv[i].Easting)).toETRS89();
    }
  }

  percentAccessRailStations = percent(totalAccessRailStations / totalNatRailStations);
  percentVisitedAccessStations = percent(totalVisitedAccessStations / totalAccessRailStations);

  var origincnt = d3.nest()
    .key(function(d) {return d.Origin; })
    .rollup(function(v) {return v.length; })
    .entries(csv)
    .forEach(function(m) { objStationDetails[m.key].ori = m.values; });
  
  var destcnt = d3.nest()
    .key(function(d) {return d.Destination; })
    .rollup(function(v) {return v.length; })
    .entries(csv)
    .forEach(function(m) { objStationDetails[m.key].dst = m.values; });

  // Add origins to destinations for total journeys to/from station

  for (var i in objStationDetails)
  {
    objStationDetails[i].tot = objStationDetails[i].ori + objStationDetails[i].dst;
    objStationDetails[i].totp = objStationDetails[i].tot / totalJourneys;
    objStationDetails[i].orip = objStationDetails[i].ori / totalJourneys;
    objStationDetails[i].dstp = objStationDetails[i].dst / totalJourneys;
  }

  // Make a list of all the stations

  for (var i in objStationDetails)
  {
    objListStations.push(objStationDetails[i]);
  }

  objListStations.sort(function (a, b) { return b.tot - a.tot; });
  listVisitedStationCodes.sort(function (a, b) { return objStationDetails[b].tot - objStationDetails[a].tot; });

  // Generate an NxN grid of zeros
  var size = totalVisitedStations;
  for (var x = 0; x < totalVisitedStations; x++)
  {
    gridPctJourneys[x] = [];
    gridCntJourneys[x] = [];

    for (var y = 0; y < totalVisitedStations; y++)
    {
      gridPctJourneys[x][y] = 0;
      gridCntJourneys[x][y] = 0;
    }
  }

  // For each journey, update the journeys table
  for (var i in csv)
  {
    var x = listVisitedStationCodes.indexOf(csv[i].Origin);
    var y = listVisitedStationCodes.indexOf(csv[i].Destination);
    gridPctJourneys[x][y] += (1 / totalJourneys);
    gridCntJourneys[x][y] ++;
  }

  // Group the journeys by class
  journeysByClass = d3.nest()
    .key(function(d) {return d.Class; })
    .rollup(function(v) {return v.length; })
    .entries(csv)
    .map(function (d) { return { "class": d.key, "count": d.values }; });

  listClassNumbers = journeysByClass.map(function (d) { return d.class });

  // Create list of all journeys
  for (var i in csv)
  {
    listRoutesTraveled.push([csv[i].Origin, csv[i].Destination]);
  }

  // For each journey, sort the two ends alphabetically
  for (var i in listRoutesTraveled)
  {
    listRoutesTraveled[i].sort(function (a, b) { return a > b; });
  }

  // Remove any duplicates
  var uniquelist = listRoutesTraveled.filter(function(elem, pos) {
    return listRoutesTraveled.findIndex(function (elem2) { 
      return (elem[0] == elem2[0]) && (elem[1] == elem2[1]); }
    ) == pos;
  }); 
  listRoutesTraveled = uniquelist;

}

function drawAll()
{
  console.log("Starting");
  
  drawStats();
  
  drawHeatCal();

  drawChordDia(objListStations, gridPctJourneys);
  drawMap();

  drawStackedBars("Stations", objListStations, "tot", "code", "name", "#station-graph");
  drawStackedBars("Departures", objListStations, "ori", "code", "name", "#station-dep");
  drawStackedBars("Arrivals", objListStations, "dst", "code", "name", "#station-ari");
  drawBarChart();

  drawStackedBars("Class", journeysByClass, "count", "class", "", "#class-graph");
}

function drawStats()
{
  $('#gen-stats').append("<p>Total journeys: " + totalJourneys + "</p>");
  $('#gen-stats').append("<p>Total stations visited: " + totalVisitedStations + " / " + totalNatRailStations + " (" + percentVisitedStations + ")</p>");
  $('#gen-stats').append("<p>Total fully wheelchair accessible stations visited: " + totalVisitedAccessStations + " / " + totalAccessRailStations + " (" + percentVisitedAccessStations + ")</p>");
  $('#gen-stats').append("<p>Total days spent traveling: " + totalDaysTraveled + " / 365 (" + percentDaysTraveled + ")</p>");
  $('#gen-stats').append("<p>Most rail journeys in one day: " + maxJourneysInDay + "</p>");
  $('#gen-stats').append("<p>Total fully wheelchair accessible National Rail stations: " + totalAccessRailStations + " / " + totalNatRailStations + " (" + percentAccessRailStations + ")</p>");
  
  console.log("List of station codes visited: " + listVisitedStationCodes);
  console.log("Journeys per day: ");
  console.log(journeysPerDay);
}

function drawStackedBars(title,dataset,quantity,label,description,location)
{
  
  var maxWidth = 960;
  var barHeight = 50;
  var xoffset = 100;

  // Work out the start position and end position for each class
  var currentPosition = 0;
  var datatotal = 0;
  var data = [];

  for (var i in dataset)
  {
    data[i] = {
      start: currentPosition,
      end: currentPosition + dataset[i][quantity],
      label: dataset[i][label],
      description: dataset[i][description]
    };

    currentPosition = currentPosition + dataset[i][quantity];

    datatotal = datatotal + dataset[i][quantity];
  }

  var barChart = d3.select(location).append("svg")
    .attr("width", maxWidth)
    .attr("height", barHeight);

  var x = d3.scale.linear()
    .domain([0, datatotal])
    .range([xoffset, maxWidth]);

  var colours = d3.scale.category20()
    .domain(data.map(function (d) { return d.label; } ));

  var titleContainer = barChart.append("g")
    .attr("width", xoffset)
    .attr("height", barHeight);

  titleContainer.append("text")
    .attr("x", 0)
    .attr("y", barHeight / 2)
    .text(title);

  var groupsContainer = barChart.append("g");

  var groups = groupsContainer.selectAll("g")
    .data(data)
    .enter().append("g");

  groups.append("rect")
    .attr("x", function (d) { return x(d.start); } )
    .attr("y", 0)
    .attr("width", function (d) { return x(d.end) - x(d.start); } )
    .attr("height", barHeight)
    .attr("style", function (d) { return "fill:" + colours(d.label); } )
    .append("title").text(function (d) { return d.description; });

  groups.append("text")
    .attr("x", function (d) { return x(d.start) + 5; } )
    .attr("y", barHeight * 0.5)
    .text(function (d) { return d.label; } )
    .attr("glyph-orientation-vertical", "-90")
    .attr("writing-mode", "tb-rl");
}

function drawBarChart()
{
  console.log("Drawing bar chart");

  var barWidth = 800;
	var barHeight = 25;
	var xoffset = 100;

	var x = d3.scale.linear()
		.range([0, barWidth - (xoffset + 10) ]);

	var chart = d3.select("#travel-graph").append("svg")
		.attr("width", barWidth);

	// Set the scale for the x-axis so it goes from 0 to the biggest value
	x.domain([0, d3.max(objListStations, function(d) { return Math.max(d.ori, d.dst); })]); 

	// Set the height of the whole graph
	chart.attr("height", barHeight * objListStations.length);

	// Make a "g" SVG element for each station (this means "group" of items in SVG)
	var bar = chart.selectAll("g")
		.data(objListStations)
		.enter().append("g")
		.attr("transform", function(d, i) { return "translate(0," + (i * barHeight) + ")"; });

	// Make "lines" SVG elements for arrivals and departures
	bar.append("line")
		.attr("x1", xoffset)
		.attr("y1", barHeight * (1/3))
		.attr("x2", function(d) { return xoffset + x(d.ori); })
		.attr("y2", barHeight * (1/3))
		.attr("class", "origin");
	bar.append("line")
		.attr("x1", xoffset)
		.attr("y1", barHeight * (2/3))
		.attr("x2", function(d) { return xoffset + x(d.dst); })
		.attr("y2", barHeight * (2/3))
		.attr("class", "dest");

	// Put some text next to the lines
	bar.append("text")
		.attr("x", xoffset - 10)
		.attr("y", barHeight * 0.5)
		.attr("dy", ".35em")
		.attr("class", "stationCode")
		.text(function(d) { return d.code; })
    .append("title").text(function(d) { return d.name; });

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
		.attr("x", function(d) { return xoffset + x(d.ori) + 5; })
		.attr("y", barHeight * (1/3))
		.attr("dy", ".35em")
		.text(function(d) { return d.ori; });

	bar.append("text")
		.attr("x", function(d) { return xoffset + x(d.dst) + 5; })
		.attr("y", barHeight * (2/3))
		.attr("dy", ".35em")
		.text(function(d) { return d.dst; });
}

// Calendar Heat Graph

var cellSize = 17; // cell size

var day = function(d) { return (d.getDay() + 6) % 7; }, // monday = 0
    week = d3.time.format("%W"), // monday-based week number
    date = d3.time.format("%Y-%m-%d");

var margin = {top: 20, right: 0, bottom: 5.5, left: 19.5},
    hgHeight = 130 - margin.top - margin.bottom,
    size = hgHeight / 7,
    hgWidth = (53 * size) + margin.left + margin.right;

var colour = d3_scale.scaleCool()
    .domain([0, 6])

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

  svg.selectAll(".monthLabel")
    .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
    .enter().append("text")
      .attr("class", "monthLabel")
      .attr("x", function (d) { 

        // Get week number of first day in month
        var first = week(d);

        // Get week number of last day in month
        var last = week(new Date(d.getFullYear(), d.getMonth() + 1, 0));

        // Get an x position half way between these two
        return ((last - first) * size)/2 + (first * size);
       })
      .attr("y", -10)
      .text(function (d) { return months[d.getMonth()]; });

  svg.selectAll(".month")
      .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
    .enter().append("path")
      .attr("class", "month")
      .attr("d", monthPath);

    rect.filter(function(d) { return d in journeysPerDay; })
      .attr("style", function(d) { return "fill:" + colour(journeysPerDay[d]); })
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


// Chord Diagram

function drawChordDia(labelData, matrixData) {

  var width = 720,
      height = 720,
      outerRadius = Math.min(width, height) / 2 - 10,
      innerRadius = outerRadius - 24;

  var formatPercent = d3.format(".1%");

  var arc = d3.svg.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

  var layout = d3.layout.chord()
      .padding(.04)
      .sortSubgroups(d3.descending)
      .sortChords(d3.ascending);

  var colours = d3_scale.scaleRainbow()
    .domain([0, listVisitedStationCodes.length - 1]);

  var path = d3.svg.chord()
      .radius(innerRadius);

  var svg = d3.select("#chord-diagram").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("shape-rendering", "geometricPrecision")
    .append("g")
      .attr("id", "circle")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  svg.append("circle")
      .attr("r", outerRadius);

  // Compute the chord layout.
  layout.matrix(matrixData);

  // Add a group per neighborhood.
  var group = svg.selectAll(".group")
      .data(layout.groups)
    .enter().append("g")
      .attr("class", "group")
      .on("mouseover", mouseover);

  // Add a mouseover title.
  group.append("title").text(function(d, i) {
    return labelData[i].name + ": " + formatPercent(labelData[i].totp) + " of Departures";
  });

  // Add the group arc.
  var groupPath = group.append("path")
      .attr("id", function(d, i) { return "group" + i; })
      .attr("d", arc)
      .style("fill", function (d, i) { return colours(i); });

  // Add a text label.
  var groupText = group.append("text")
      .attr("x", 6)
      .attr("dy", 15);

  groupText.append("textPath")
      .attr("xlink:href", function(d, i) { return "#group" + i; })
      .text(function(d, i) { return labelData[i].code; });

  // Remove the labels that don't fit. :(
  groupText.filter(function(d, i) { return groupPath[0][i].getTotalLength() / 2 - 16 < this.getComputedTextLength(); })
      .remove();
  
  // Add the chords.
  var chord = svg.selectAll(".chord")
      .data(layout.chords)
    .enter().append("path")
      .attr("class", "chord")
      .style("fill", function (d) { 
        return colours(d.source.index); 
      })
      .attr("d", path);

  // Add an elaborate mouseover title for each chord.
  chord.append("title").text(function(d) {
    return labelData[d.source.index].name
        + " → " + labelData[d.target.index].name
        + ": " + formatPercent(d.source.value)
        + "\n" + labelData[d.target.index].name
        + " → " + labelData[d.source.index].name
        + ": " + formatPercent(d.target.value);
  });

  function mouseover(d, i) {
    chord.classed("fade", function(p) {
      return p.source.index != i
          && p.target.index != i;
    });
  }
}

function loadMap()
{
  d3.csv("./travel-data.csv", function(csv)
  {
    d3.csv("./data/station-codes.csv", function (lookupCsv) 
    {
      genDataFromCSV(csv, lookupCsv);
      drawMap();
    });
  });
}

function drawMap()
{
  var width = 960,
    height = 1160;

  var projection = d3.geo.albers()
    .center([0, 55.4])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(6000)
    .translate([width / 2, height / 2]);
  
  var path = d3.geo.path()
    .projection(projection);
  
  var svg = d3.select("#ukmap").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("shape-rendering", "geometricPrecision");

  var colours = d3.scale.category20()
    .domain(objListStations.map(function (d) { return d.code; } ));

  d3.json("test.json", function(error, uk) 
  {
    if (error) return console.error(error);

    // county borders
    svg.append("g")
      .selectAll(".county-outline")
      .data(topojson.feature(uk, uk.objects.counties).features)
      .enter().append("path")
        .attr("d", path)
        .attr("class", "county-outline")
        .attr("id", function (d) {
         return d.properties.postal; 
       })
        .append("title")
          .text(function (d) {
           return d.properties.county + " (" + d.properties.postal + ")"; 
         });

    // external boundaries (coastlines)
    svg.append("path")
      .datum(topojson.mesh(uk, uk.objects.subunits, function(a, b) { return a === b; }))
      .attr("d", path)
      .attr("class", "map-outline");

    // internal boundaries (borders)
    svg.append("path")
      .datum(topojson.mesh(uk, uk.objects.subunits, function(a, b) { return a !== b; }))
      .attr("d", path)
      .attr("class", "map-borders");

    svg.selectAll(".route-path")
      .data(listRoutesTraveled)
      .enter().append("line")
        .attr("class", "route-path")
        .attr("x1", function(d) { return projection([objStationDetails[d[0]].location.longitude, objStationDetails[d[0]].location.latitude])[0]; })
        .attr("y1", function(d) { return projection([objStationDetails[d[0]].location.longitude, objStationDetails[d[0]].location.latitude])[1]; })
        .attr("x2", function(d) { return projection([objStationDetails[d[1]].location.longitude, objStationDetails[d[1]].location.latitude])[0]; })
        .attr("y2", function(d) { return projection([objStationDetails[d[1]].location.longitude, objStationDetails[d[1]].location.latitude])[1]; })
        .append("title").text(function(d) { 
          return objStationDetails[d[0]].name + " → " + objStationDetails[d[1]].name + " : " + 
          gridCntJourneys[listVisitedStationCodes.indexOf(d[0])][listVisitedStationCodes.indexOf(d[1])]
          + "\n" + 
          objStationDetails[d[1]].name + " → " + objStationDetails[d[0]].name + " : " + 
          gridCntJourneys[listVisitedStationCodes.indexOf(d[1])][listVisitedStationCodes.indexOf(d[0])]
        });

    svg.selectAll(".station-dot")
      .data(objListStations)
      .enter().append("circle")
        .attr("r", 5)
        .attr("transform",  function(d) { return "translate(" + projection([d.location.longitude, d.location.latitude]) + ")"; })
        .attr("class", "station-dot")
        .attr("style", function (d) { return "fill:" + colours(d.code); } )
        .append("title").text(function(d) { return d.name; });;

  });

}