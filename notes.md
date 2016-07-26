# Notes

## JavaScript Libraries

https://wzrd.in/standalone/ospoint@latest
https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.js
https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-rc1/jquery.min.js
https://d3js.org/d3.v3.min.js
https://d3js.org/d3-array.v0.7.min.js
https://d3js.org/d3-collection.v0.2.min.js
https://d3js.org/d3-color.v0.4.min.js
https://d3js.org/d3-format.v0.5.min.js
https://d3js.org/d3-interpolate.v0.8.min.js
https://d3js.org/d3-time.v0.2.min.js
https://d3js.org/d3-time-format.v0.3.min.js
https://d3js.org/d3-scale.v0.7.min.js
https://d3js.org/topojson.v1.min.js

## Links

https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.js

http://www.jstott.me.uk/jscoord/

https://data.gov.uk/data-request/rail-station-codes-and-locations

https://en.wikipedia.org/wiki/British_Rail_Class_###

## Chord Diagram

Needs data in a square matrix, e.g.

		NOT STP BFR
NOT 0		2		0
STP 2		0		1
BFR 0		2		0

var stationGrid = 
[[0, 2, 0]
[2, 0, 1]
[0, 2, 0]]


var stations = ["NOT", "STP", "BFR"];

var stationGrid = 
[[0, 0, 0]
[0, 0, 0]
[0, 0, 0]];

for (var row in csv)
{
	stationGrid[row.origin][row.destination] ++;
}

visitedStations code:NOT name: Nottingham origin:2 dept:2 x:50 y:50

# TopoJSON

```
topojson -o test.json --properties country=NAME --properties county=name --properties name=NAME --properties postal=postal -- subunits.json counties.json
```
