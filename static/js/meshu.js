var sb = sb || {};
var app_key = "dj0yJmk9M1hsekZBSDY1ZjRxJmQ9WVdrOU5uUjZiRzE0TXpRbWNHbzlNVEV5TURZMU1qRTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD00OQ--";

sb.meshu = function(frame) {
	var self = {},
        width = $(frame).width() + 'px',
        height = $(frame).height() + 'px',
		map = sb.map(frame, width, height),
		mesh = sb.mesh(frame, map, width, height),
        cases = $("#cases");

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

    searchbox.focus(function(){
        cases.fadeOut();
    })

    searchbox.keypress(function(event) {
        if ( event.which == 13 ) {
            searchPlaces();
        }
    });
	// this is tied to a global submit button for now
    $("#search-button").click(function(){
        searchPlaces();
    });

    mesh.on("added", checkAdded);
    function checkAdded() { 
        // pay attention to the number of points
        var points = mesh.points();
        if (points.length > 3) $("#finish-button").addClass("active");
        else $("#finish-button").removeClass("active");
    }

    // on click of search button
    function searchPlaces() {
        var input = searchbox.val();

        // default input
        if (input == "add a city, place, or address") return;

        var query = input.replace("&","and").replace(/[^\w ]/ig, "").replace(" ","+");

        var url = $('body').hasClass('ie') ? "/proxy/geocoder/?location=" + query 
            : "http://where.yahooapis.com/geocode?location=" + query + "&flags=J&appid=" + app_key;
        
        searchbox.val("");

        $.ajax({
            url: url,
            cache: false,
            dataType: 'json',
            error: function(error, error1, error2){
                console.log(error2);
            },
            success: function(data){
                var results = data.ResultSet.Results;
                var content = $("#content");
                cases.empty().hide();

                if (typeof results == "undefined") {
                    searchbox.blur();
                    cases.append(
                        $("<p>").text("Hrm, we weren't able to find your search. Try again?"))
                        .fadeIn();
                }
                else if (results.length == 1) {
                    addPoint(results[0],input);

                    // if only one point, let's zoom it to a proper level
                    if (mesh.points().length == 1) {
                        var rad = results[0].radius;
                        if (rad > 1000000) {
                            map.map.zoom(3);
                        } else if (rad > 100000) {
                            map.map.zoom(4);
                        } else if (rad > 10000) {
                            map.map.zoom(12);
                        } else if (rad > 400) {
                            map.map.zoom(14);
                        } 
                    }
                }
                else {
                    cases.append(
                        $("<p>").text("Oops, we're not sure which place you meant. Try a more specific search?"))
                            .fadeIn();
                    searchbox.blur();
                }
            }
        });
    }

    function addPoint(place, input) {
        mesh.add(place.latitude, place.longitude, input);
        self.updateBounds();

        checkAdded();
    };

    self.locations = function(locations, skipDelay) {
        for (var i = 0; i < locations.length; i++) {
            if (skipDelay) {
                addPoint(locations[i], locations[i].name);
            }
            else {
                setTimeout(function(loc) {
                    return function() {
                        addPoint(loc, loc.name);
                    };
                }(locations[i]), i * 400);   
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
                latitude: parseFloat(values[0]),
                longitude: parseFloat(values[1]),
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

    // save the rotation for now
    var cr = 0;
    var rotateInterval;
    self.animateTransform = function(r) {
        if (rotateInterval) {
            clearInterval(rotateInterval);
        }

        var counter = 0;
        var delaunay = d3.select(".delaunay");
        rotateInterval = setInterval(function(){
            if (++counter < 30) {
                cr += (r - cr) * .33;

                var rotate = "rotate(" + cr + ",300,300)";
                delaunay.attr("transform", rotate);
            }
            else
                clearInterval(rotateInterval);
        }, 40);
    };

    self.updateBounds = function() {
        map.updateBounds(mesh.lats(), mesh.lons());
        mesh.updatePixelBounds();
        mesh.refresh();
    };

    self.updateTitle = function(t) {
        mesh.updateTitle(t);
    };

    self.outputTitle = function() {
        return mesh.outputTitle();
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