var sb = sb || {};

sb.map = function(frame, width, height) {
	var po = org.polymaps;
	var self = d3.dispatch("boundsUpdated"),
		buffer = .5;

	// updating to toner tiles
	// using subdomains on meshu.io for performance
	// var baseURL = "/proxy/tiles/{S}/{Z}/{X}/{Y}"; // "http://{S}tile.stamen.com/toner/{Z}/{X}/{Y}.png"; // http://{S}.meshu.io
	var baseURL = "http://tile.stamen.com/toner/{Z}/{X}/{Y}.png";

	var container = d3.select(frame).append("div")[0][0];
    container.style.position = "absolute";
    container.style.width = width;
    container.style.height = height;

    d3.select(frame).append("div").attr("class","render");

	var image = po.image()
		.url(po.url(baseURL)
	    // .hosts(["a.", "b.", "c.", "d.", ""]));
		.hosts(["a", "b", "c", "d"]));

	self.dispatch = d3.dispatch("show");

	var cities = [{"name":"San Francisco","lat":37.775,"lon":-122.43,"zoom":13},
				  {"name":"New York City","lat":40.718,"lon":-73.997,"zoom":14},
				  {"name":"London","lat":51.506325,"lon":-0.127144,"zoom":13},
				  {"name":"Paris","lat":48.85693,"lon":2.3412,"zoom":14},
				  {"name":"Moscow","lat":55.75,"lon":37.614975,"zoom":14},
				  {"name":"Montreal","lat":45.512303,"lon":-73.554431,"zoom":13},
				  {"name":"Tokyo","lat":35.70,"lon":139.774414,"zoom":14}];

	var svgObject = container.appendChild(po.svg("svg"));
	var c = Math.floor(Math.random()*cities.length);
	self.map = po.map()
		.container(svgObject)
		.zoom(cities[c].zoom)
		.center({ lat: cities[c].lat, lon: cities[c].lon });

	// set the size, this fixes firefox bugs
	self.map.size({
		x: $(frame).width(),
		y: $(frame).height()
	});

	var print = $("body").hasClass("print");
	if (print) {
		self.map.add(po.geoJson()
	    	.url("/static/lib/world.json")
	    );
	    self.map.zoom(2).center({ lat: 35, lon: 5 });
	}
	else
		self.map.add(image);

	// fill the background with white
	d3.select(svgObject)
		.attr("width", "100%")
		.attr("height", "100%")
		.select("rect")
		.attr("visibility","visible")
		.attr("fill","white");

	self.frame = function() {
		return container;
	};

	self.show = function() {
		if (!image.map()) {
			self.map.add(image);
		}
	};

	self.hide = function() {
		if (image.map()) {
			self.map.remove(image);
		}
	};

	self.buffer = function(b) {
		buffer = b;
		return self;
	};

	self.centerOn = function(loc, offsetX) {
		var center = self.l2p(loc);
		center.x -= offsetX || 0;

		loc = self.p2l(center);
		self.map.center(loc);
	};

	self.updateBounds = function(lats, lons, zoomOffset, offsetX) {
		console.log('updatebounds', lats, lons, zoomOffset, offsetX);
		if (lats.length == 0 || lons.length == 0) return;
		if (lats.length == 1 && lons.length == 1) {
			self.centerOn({
				lat: lats[0],
				lon: lons[0]
			}, offsetX);

			self.boundsUpdated();
			return;
		}

		// south-west, north-east
		var extent = [{
			lat: d3.min(lats),
			lon: d3.min(lons)
		},
		{
			lat: d3.max(lats),
			lon: d3.max(lons)
		}];
		self.map.extent(extent);


		// if there is an offset, adjust the center
		// if it's too wide, zoom out
		if (offsetX) {
			var totalWidth = $(frame).width() - offsetX;
			console.log('totalwidth', totalWidth);
			var extentWidth = self.l2p(extent[1]).x - self.l2p(extent[0]).x;
			if (extentWidth > totalWidth) {
				console.log('too wide, zooming out', extentWidth);
				self.map.zoom(self.map.zoom()-.5);
			}
			self.centerOn(self.map.center(), offsetX);
		}


		// keep it to whole number zoom levels
		// before we were subtracting half a zoom, which gives more room
		// but messes up the rasterizer.js
		offset = zoomOffset || 0;
		var zoom = Math.floor(self.map.zoom()) + offset;
		if (zoom != self.map.zoom())
			self.map.zoom(zoom);

		// refresh the mesh (meshu.js is listening to this, calls mesh.refresh())
		self.boundsUpdated();
	};

	// this was old, from when we were updating the proportions of the map.
	// there are a lot of quirks here because of the difference
	// between the extent you give it and the one polymaps ends up with
	self.resizeContainer = function(lats, lons) {
		// south-west, north-east
		var extent = [{
			lat: d3.min(lats),
			lon: d3.min(lons)
		},
		{
			lat: d3.max(lats),
			lon: d3.max(lons)
		}];

		// reset the view for a bit
		self.map.zoom(10).center({
			lat: 0, lon: 0
		});

		var sw_pt = self.map.locationPoint(extent[0]);
		var ne_pt = self.map.locationPoint(extent[1]);

		var width = Math.abs(ne_pt.x - sw_pt.x);
		var height = Math.abs(ne_pt.y - sw_pt.y);
		var max = 430; // so it can rotate in a 600x600 square
		var ratio = width > height ? max / width : max / height;

		width *= ratio;
		height *= ratio;

		container.style.width = (width) + 'px';
		container.style.height = (height) + 'px';

		self.map.extent(extent);

		var dif = self.l2p(extent[0]).y - self.l2p(self.map.extent()[0]).y;

		if (dif) {
			container.style.top = (150 - dif) + 'px';
		}
	};

	// take extent and get it in x y
	self.getBounds = function() {
		var extent = self.map.extent();
		var sw_pt = self.map.locationPoint(extent[0]);
		var ne_pt = self.map.locationPoint(extent[1]);

		return {
			t: ne_pt.y,
			b: sw_pt.y,
			l: sw_pt.x,
			r: ne_pt.x
		};
	};

	self.getMapRadius = function() {
		var e = self.map.extent();
		return {
			lat: Math.abs(e[0].lat - e[1].lat)/3,
			lon: Math.abs(e[0].lon - e[1].lon)/3
		}
	};

	// location to point converter
	self.l2p = function(loc) {
		return self.map.locationPoint(loc);
	};

	// point to location converter
	self.p2l = function(pt) {
		return self.map.pointLocation(pt);
	};

	return self;
};