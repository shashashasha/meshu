var sb = sb || {};

sb.minimeshu = function(frame) {
	var self = {},
        width = $(frame).width() + 'px',
        height = $(frame).height() + 'px',
		map = sb.map(frame, width, height),
		mesh = sb.mesh(frame, map, width, height);

    function addPoint(place, input) {
        mesh.add(place.latitude, place.longitude, input);
        self.updateBounds();
    }

    self.locations = function(locations) {
        var seen = {},
            skip = true; // locations.length > 10 ? locations.length - 10 : 0;

        for (var i = 0; i < locations.length; i++) {
            var loc = locations[i];

            if (!seen[loc.name]) {

                // don't animate all the points
                if (skip) {
                    // skip animation
                    mesh.add(loc.latitude, loc.longitude, loc.times && loc.times > 1 ? loc.name + ' (' + loc.times + ')' : loc.name, true);
                    self.updateBounds();
                }
                else {
                    setTimeout(function(l) {
                        return function() {
                            addPoint(l, l.name);
                        };
                    }(loc), i * 400);   
                }

                seen[loc.name] = true;
            }
        }
    };

    self.locationData = function(data) {
        var locations = data.split('|');
        var newLocs = [];

        for (var i = 0; i < locations.length; i++) {
            var values = locations[i].split('\t');
            if (values.length != 3) {
                continue;
            }

            newLocs.push({
                lat: parseFloat(values[0]),
                lon: parseFloat(values[1]),
                name: values[2]
            });
        }

        mesh.locations(newLocs);
        self.updateBounds();
        return self;
    };

    self.mesh = function() {
        return mesh;
    };

    self.updateBounds = function() {
        map.updateBounds(mesh.lats(), mesh.lons());
        mesh.updatePixelBounds();
        mesh.refresh();
    };

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