var sb = sb || {};

sb.minimeshu = function(frame, renderer) {
	var self = {},
        width = $(frame).width() + 'px',
        height = $(frame).height() + 'px',
		map = sb.map(frame, width, height),
        renderer = renderer || 'facet',
		mesh = sb.mesh[renderer](frame, map, width, height);

    function addPoint(place, input) {
        mesh.add(place.latitude, place.longitude, input);
        self.updateBounds();
    }

    self.locations = function(locations) {
        var seen = {},
            locsToAdd = [];

        for (var i = 0; i < locations.length; i++) {
            var loc = locations[i];
            if (!seen[loc.name]) {
                locsToAdd.push({
                    name: loc.times && loc.times > 1 ? loc.name + ' (' + loc.times + ')' : loc.name,
                    latitude: +loc.latitude,
                    longitude: +loc.longitude
                });

                seen[loc.name] = true;
            }
        }

        mesh.locations(locsToAdd);
    };


    function parseLocationData(data) {
        var locations = data.split('|');
        var newLocs = [],
            seen = {};


        for (var i = 0; i < locations.length; i++) {
            var values = locations[i].split('\t');
            if (values.length < 3) {
                continue;
            }

            // check against the lat lon as '37.75--122.45'
            var hash = values[0] + '-' + values[1];
            if (seen[hash]) {
                continue;
            } else {
                seen[hash] = true;
            }

            newLocs.push({
                latitude: parseFloat(values[0]),
                longitude: parseFloat(values[1]),
                name: values[2]
            });
        }

        return newLocs;
    }

    self.initializeFromData = function(data, style, svg) {
        mesh.prerender(svg);

        var locations = parseLocationData(data);
        mesh.locations(locations);   

        // 'drawStyle:knockout|zoom:12' for example
        if (style) {
            mesh.applyStyle(style);
        }
        return self;
    };

    self.mesh = function() {
        return mesh;
    };

    self.updateBounds = function(offset) {
        map.updateBounds(mesh.lats(), mesh.lons(), offset);
    };

    map.on("boundsUpdated", function() {
        mesh.updatePixelBounds();
        mesh.refresh();
    });

    // offset the zoom a bit for legibility
    mesh.on("locationsSet", function() {
        self.updateBounds(-.2); 
    });

    // output the contents of our mesh as svg
    self.outputSVG = function() {
    	return mesh.output();
    };

    self.outputLocationData = function() {
        var dataString = [];
        var cp = mesh.places(),
            clats = mesh.lats(),
            clons = mesh.lons();

        $.each(cp, function(i){
            var dataPoint = clats[i] + "\t" + clons[i] + "\t" + cp[i];
            dataString.push(dataPoint);
        });

        return dataString.join("|");
    };

	return self;
};