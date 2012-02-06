var sb = sb || {};
var app_key = "dj0yJmk9M1hsekZBSDY1ZjRxJmQ9WVdrOU5uUjZiRzE0TXpRbWNHbzlNVEV5TURZMU1qRTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD00OQ--";

sb.meshu = function(frame, width, height) {
	var self = {},
		map = sb.map(frame, width, height),
		mesh = sb.mesh(frame, map, width, height);

    // need to make these controls optional....
    $(frame).append("<div class='mapui'><div id='zoomin'></div><div id='zoomout'></div></div>");

    $("#zoomin").mousedown(function(e) {
        map.map.zoom(map.map.zoom() + 1);
        mesh.refresh();
    });
    $("#zoomout").mousedown(function(e) {
        map.map.zoom(map.map.zoom() - 1);
        mesh.refresh();
    });

    var searchbox = $("#searchbox");

    searchbox.keypress(function(event) {
      if ( event.which == 13 ) {
         searchPlaces();
         searchbox.val("");
       }
    });
	// this is tied to a global submit button for now
    $("#submit").click(function(){
        searchPlaces();
    });

    function searchPlaces() {
        var input = searchbox.val();
        var query = input.replace(" ","+");

        $.ajax({
            url: "http://where.yahooapis.com/geocode?location="+query+"&flags=J&appid="+app_key,
            cache: false,
            success: function(data){
                var results = data.ResultSet.Results;
                var cases = $("#cases");
                cases.empty().hide();

                //if (results == undefined) XXX: make a 404 "results got bonked" case
                if (results.length == 1)
                    addPoint(results[0],input);
                else {
                    var list = $("<ul>").append($("<li>").attr("class","title").text("Hrm, did you mean:")).appendTo(cases);
                    for (var i = 0; i < results.length; i++) {
                        var r = results[i];
                        $("<li>").text(r.city+", "+r.state+", "+r.country)
                            .addClass("maybe-place")
                            .data("place",r)
                            .appendTo(list);
                    }
                    cases.slideDown('fast');
                    $("#cases li").click(function(){
                        var r = $(this);
                        addPoint(r.data("place"),input);
                        cases.slideUp('fast');
                    });
                }
            }
        });
    }

    function addPoint(place, input) {
        mesh.add(place.latitude, place.longitude, input);
        map.updateBounds(mesh.lats(), mesh.lons());
    }

    self.locations = function(locations) {

        for (var i = 0; i < locations.length; i++) {
            setTimeout(function(loc) {
                return function() {
                    mesh.add(loc.lat, loc.lon, loc.name);
                    map.updateBounds(mesh.lats(), mesh.lons());                 
                };
            }(locations[i]), i * 400);
        }

        // mesh.locations(locations);
        // map.updateBounds(mesh.lats(), mesh.lons());

        // refresh should probably be tied to an event or something
        // mesh.refresh();
    };

    self.locationData = function(data) {
        var locations = data.split('|');
        var newLocs = [];

        for (var i = 0; i < locations.length; i++) {
            var values = locations[i].split('\t');

            newLocs.push({
                lat: parseFloat(values[0]),
                lon: parseFloat(values[1]),
                name: values[2]
            });
        }

        mesh.locations(newLocs);
        map.updateBounds(mesh.lats(), mesh.lons());
        mesh.updatePixelBounds();
        mesh.refresh();
        return self;
    };

    // output the contents of our mesh as svg
    self.outputSVG = function() {
    	return mesh.output();
    };

    self.outputLocationData = function() {
        var dataString = "";
        var cp = mesh.places(),
            clats = mesh.lats(),
            clons = mesh.lons();

        $.each(places, function(i){
            var dataPoint = clats[i] + "\t" + clons[i] + "\t" + cp[i] + "|";
            dataString += dataPoint;
        });

        return dataString;
    };

	return self;
};