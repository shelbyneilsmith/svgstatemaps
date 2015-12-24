(function() {
	this.SVGStateMap = function(stateAbbr, parent, scriptDir, mapOptions) {
		this.stateAbbr = stateAbbr;
		this.parentEl = parent;
		this.scriptDir = scriptDir;

		this.mapOptions = typeof mapOptions !== 'undefined' ? mapOptions : {};
		this.mapOptions = {
			mapColor: typeof this.mapOptions.mapColor !== 'undefined' ? this.mapOptions.mapColor : '#ddd',
			snapLabel: typeof this.mapOptions.snapLabel !== 'undefined' ? this.mapOptions.snapLabel : 'county',
		};

		this.countyLabels = [];
		this.counties = [];
	};

	this.SVGStateMap.prototype.createMap = function(mapCallback) {
		// ** Create the wrapper html for the map to live in

		// find all maps on page, in case we have multiple maps going on
		var existing_maps = document.querySelectorAll('.' + this.stateAbbr + '-svg-map');

		// use the length of existing maps for this map's index (0, if only map on page)
		var map_index = existing_maps.length;

		var mapContainerHTML = "<div class='svg-sm-map-wrap'><div id='" + this.stateAbbr + "-svg-map-" + map_index + "' class='" + this.stateAbbr + "-svg-map svg-sm-vector-map'></div></div>";
		var parent_node = document.getElementById(this.parentEl);

		parent_node.innerHTML = mapContainerHTML;
		this.mapContainer = document.getElementById(this.stateAbbr + '-svg-map-' + map_index);

		// Create county labels container
		this.countyLabelsContainer = document.createElement('div');
		this.countyLabelsContainer.className = 'county-labels-container';

		this.mapContainer.appendChild(this.countyLabelsContainer);

		// ** Instantiate Raphael object for map
		this.mapSVG = Raphael(this.mapContainer);

		var _self = this;

		// // Load in the data script for the specified state - WILL COME BACK TO LATER!
		// var script_dir = '/wp-content/themes/yb/assets/scripts/vendor/svgstatemaps';
		var state_data_url = this.scriptDir + '/state_data/' + this.stateAbbr + '-data.json';
		var request = new XMLHttpRequest();
		request.open('GET', state_data_url, true);

		request.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status >= 200 && this.status < 400) {
					// Success!
					var mapData = JSON.parse(this.responseText);

					// Go ahead and set the state name
					_self.mapName = mapData.state_name;

					// ** Make map responsive
					_self.mapSVG.setViewBox(0, 0, mapData.svg_dimensions[0], mapData.svg_dimensions[1], true);
					_self.mapContainer.parentNode.style.paddingBottom = ((mapData.svg_dimensions[1] / mapData.svg_dimensions[0]) * 100) + '%';
					_self.mapSVG.setSize('100%', '100%');

					// var svg = document.querySelector('.ky-svg-map svg');
					_self.mapContainer.removeAttribute("width");
					_self.mapContainer.removeAttribute("height");

					// Create the counties array
					_self.makeCounties(mapData);

					// set up hover behavior for all counties
					for (var i = 0, l = _self.counties.length; i < l; i++) {
						_self.counties[i].node.id = _self.counties[i].data('id');

						_self.counties[i].node.addEventListener('mouseover', _self, false);
						_self.counties[i].node.addEventListener('mouseout', _self, false);
					}

					// add the event listener for the county labels to follow mouse movement
					_self.mapContainer.addEventListener('mousemove', _self, false);

					mapCallback();
				} else {
					// We reached our target server, but it returned an error
					console.log('error?');
				}
			}
		};
		request.send();
		request = null;
	};

	this.SVGStateMap.prototype.makeCounties = function(countiesData) {
		var mapColor = this.mapOptions.mapColor;

		for (var p in countiesData.county_paths) {
			if (countiesData.county_paths.hasOwnProperty(p)) {
				var county_path = this.mapSVG.path(countiesData.county_paths[p]);
				county_path.attr({'fill': mapColor,'stroke-width': '0','stroke-opacity': '1'}).data('id', p);
				this.counties.push(county_path);
			}
		}
	};

	// get an array of county objects from array of county names
	this.SVGStateMap.prototype.getTargetCounties = function(targetCounties) {
		var mapCounties = [];

		for (var i in this.counties) {
			if (targetCounties.indexOf(this.counties[i].data('id')) !== -1) {
				mapCounties.push(this.counties[i]);
			}
		}

		return mapCounties;
	};

	// method for highlighting counties
	this.SVGStateMap.prototype.highlightCounties = function(hlCounties, hlClass, removeCurCounties, countyCallback, callbackData) {
		var thisCounty;
		hlClass = typeof hlClass !== 'undefined' ? hlClass : 'highlight-county';

		removeCurCounties  = typeof removeCurCounties !== 'undefined' ? removeCurCounties : false;
		if (removeCurCounties) {
			this.changeAllCountiesClass('');
		}

		for (var i = 0, l = this.counties.length; i < l; i++) {
			thisCounty = this.counties[i];

			var countyCheck;

			if ( Object.prototype.toString.call( hlCounties ) === '[object Array]' ) {
				countyCheck = (hlCounties.lastIndexOf(thisCounty.data('id')) > -1);
			} else {
				countyCheck = (thisCounty.data('id') === hlCounties);
			}

			if (countyCheck){
				thisCounty.node.setAttribute('class', hlClass);

				if (typeof(countyCallback) === typeof(Function)) {
					countyCallback(thisCounty, callbackData);
				}
			}
		}
	};

	// add/remove county labels
	this.SVGStateMap.prototype.addCountyLabel = function(countyName) {
		var newCountyLabel = document.createElement('span');
		newCountyLabel.className = 'county-label';

		newCountyLabel.innerHTML = countyName + " County";

		this.countyLabelsContainer.appendChild(newCountyLabel);
		this.countyLabels.push(newCountyLabel);
	};
	this.SVGStateMap.prototype.removeCountyLabels = function() {
		this.countyLabelsContainer.innerHTML = '';
		this.countyLabels = [];
	};

	// county label position behaviors
	this.SVGStateMap.prototype.labelWithMouse = function(e) {
		var 	x = e.pageX,
			y = e.pageY;

		var map_offset = getElementOffset(this.mapContainer);

		this.countyLabelsContainer.style.top = (y - map_offset.top + 20) + 'px';
		this.countyLabelsContainer.style.left = (x - map_offset.left + 20) + 'px';
	};
	this.SVGStateMap.prototype.labelWithCounty = function(county) {
		var map_offset = getElementOffset(this.mapContainer);

		var county_node_coords = county.getBoundingClientRect();

		this.countyLabelsContainer.style.opacity = 1;
		this.countyLabelsContainer.style.left = (county_node_coords.left - map_offset.left + 30) + 'px';
		this.countyLabelsContainer.style.top = (county_node_coords.top - map_offset.top + 30) + 'px';
	};

	// main map multi-event handler
	this.SVGStateMap.prototype.handleEvent = function(e) {
		if (!e) {
			e = window.event;
		}

		var county = getEventTarget(e);

		switch(e.type) {
			case 'mouseover' :
				county.style.opacity = 0.7;

				var countyName = county.id;
				this.addCountyLabel(countyName);

				this.countyLabels[0].style.opacity = 1;

				break;

			case 'mouseout' :
				county.style.opacity = 1;
				this.removeCountyLabels();

				break;

			case 'mousemove' :
				var snapLabel = this.mapOptions.snapLabel;

				if (snapLabel === 'mouse') {
					this.labelWithMouse(e);
				} else if (snapLabel === 'county') {
					this.labelWithCounty(county);
				}

				break;
		}

	};

	// quickly switch class for all counties at once
	this.SVGStateMap.prototype.changeAllCountiesClass = function(newClass) {
		// quick way to switch the class on all counties
		for (var i = 0, l = this.counties.length; i < l; i++) {
			var thisCounty = this.counties[i].node;
			thisCounty.setAttribute('class', newClass);
		}
	};

	// Show the map loader animation
	this.SVGStateMap.prototype.showLoaderAnim = function($el) {
		var loaderAnimWrap = document.createElement('div');
		loaderAnimWrap.className = 'mask-loading';

		var loaderInnerHTML = '<div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>';

		loaderAnimWrap.innerHTML = loaderInnerHTML;

		$el.insertBefore(loaderAnimWrap, $el.firstChild);
	};

}());


// Helper functions
//===============================

function getEventTarget(e) {
	var targ;
	if (!e) {
		e = window.event;
	}
	if (e.target) {
		targ = e.target;
	} else {
		targ = e.srcElement;
	}
	if (targ.nodeType === 3) {
		targ = targ.parentNode;
	}

	return targ;
}

function getElementOffset( el ) {
	// gets true element offset and takes in account scroll position
	var _x = 0;
	var _y = 0;
	while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
		_x += el.offsetLeft - el.scrollLeft;
		_y += el.offsetTop - el.scrollTop;
		el = el.offsetParent;
	}
	return { top: _y, left: _x };
}

// Polyfill for IE8 addEventListener + handleEvent
//====================================================

// fn arg can be an object or a function, thanks to handleEvent
function on(el, evt, fn, bubble) {
	if("addEventListener" in el) {
		// BBOS6 doesn't support handleEvent, catch and polyfill
		try {
			el.addEventListener(evt, fn, bubble);
		} catch(e) {
			if(typeof fn == "object" && fn.handleEvent) {
				el.addEventListener(evt, function(e){
					// Bind fn as this and set first arg as event object
					fn.handleEvent.call(fn,e);
				}, bubble);
			} else {
				throw e;
			}
		}
	} else if("attachEvent" in el) {
		// check if the callback is an object and contains handleEvent
		if(typeof fn == "object" && fn.handleEvent) {
			el.attachEvent("on" + evt, function(){
				// Bind fn as this
				fn.handleEvent.call(fn);
			});
		} else {
			el.attachEvent("on" + evt, fn);
		}
	}
}
