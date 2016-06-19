
<<<<<<<-readme.md
## Library

https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.js

## Train Classes
=======
## Links

https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.js

http://www.jstott.me.uk/jscoord/

https://data.gov.uk/data-request/rail-station-codes-and-locations
>>>>>>>+readme.md

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


<<<<<<< readme.md
visitedStations code:NOT name: Nottingham origin:2 dept:2 x:50 y:50
=======
visitedStations code:NOT name: Nottingham origin:2 dept:2 x:50 y:50

# TopoJSON

```
topojson -o test.json --properties country=NAME --properties county=name --properties name=NAME --properties postal=postal -- subunits.json counties.json
```
>>>>>>>+readme.md
