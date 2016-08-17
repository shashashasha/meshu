var sb = sb || {};

sb.map = function(frame, width, height) {
	var po = org.polymaps;
	var self = d3.dispatch("boundsUpdated"),
		buffer = .5;

	// updating to toner tiles
	// using subdomains on meshu.io for performance
	// var baseURL = "/proxy/tiles/{S}/{Z}/{X}/{Y}"; // "http://{S}tile.stamen.com/toner/{Z}/{X}/{Y}.png"; // http://{S}.meshu.io
	var baseURL = "http://tile.stamen.com/toner/{Z}/{X}/{Y}.png";

	var container = d3.select(frame)[0][0];

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
		// self.map.add(po.geoJson()
	 //    	.url("/static/lib/world.json")
	 //    );
	    self.map.zoom(1.9).center({ lat: 40, lon: -35 });
	}
	else
		self.map.add(image);

	var postcard = $("body").hasClass("postcard");

	// fill the background with white
	d3.select(svgObject)
		.attr("width", width)
		.attr("height", postcard ? "100%" : "600px")
		.select("rect")
		.attr("visibility","visible")
		.attr("fill", print ? "#e7e7e7" : "white");

	self.getStart = function() {
		return cities[c];
	};

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
			var extentWidth = self.l2p(extent[1]).x - self.l2p(extent[0]).x;
			if (extentWidth > totalWidth) {
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

	self.getExtent = function() {
		return self.map.extent();
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