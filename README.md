# svgstatemaps
Interactive SVG maps for each U.S. state w/ counties.

*Right now*, only four states are available (KY, OH, TN, IN), but eventually all 50 will be included!


## Usage

For now, you must specify the relative path to this script.
``` js
var script_dir = '/path/to/svgstatemaps';
```

Then, instantiate a map object by passing a state abbreviation, the id of the container element and the path to this script:
``` js
var map = new SVGStateMap('ky', 'ky-map', script_dir);
```

Finally, go ahead and create the map, passing in a callback function, where you can do whatever you want with the map after it is generated.
``` js
map.createMap(callBackFunction);
```
