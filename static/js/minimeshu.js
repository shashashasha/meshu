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
        self.updateBounds();
    };

    self.locationData = function(data) {
        var locations = data.split('|');
        var newLocs = [];

        for (var i = 0; i < locations.length; i++) {
            var values = locations[i].split('\t');
            if (values.length < 3) {
                continue;
            }

            newLocs.push({
                latitude: parseFloat(values[0]),
                longitude: parseFloat(values[1]),
                name: values[2]
            });
        }

        mesh.locations(newLocs);
        return self;
    };

    self.mesh = function() {
        return mesh;
    };

    self.updateBounds = function() {
        map.updateBounds(mesh.lats(), mesh.lons());
    };

    map.on("boundsUpdated", function() {
        mesh.updatePixelBounds();
        mesh.refresh();
    });

    mesh.on("locationsSet", self.updateBounds);

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