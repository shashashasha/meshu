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
    $("#submit").click(function(){
        searchPlaces();
    });

    function searchPlaces() {
        var input = searchbox.val();
        searchbox.val("");
        if (input == "add a city, place, or address") return;
        var query = input.replace(" ","+");

        $.ajax({
            url: "http://where.yahooapis.com/geocode?location="+query+"&flags=J&appid="+app_key,
            cache: false,
            dataType: 'json',
            success: function(data){
                var results = data.ResultSet.Results;
                cases.empty().hide();
                var content = $("#content");

                if (typeof results == "undefined") {
                    searchbox.blur();
                    cases.append(
                        $("<p>").text("Hrm, we weren't able to find your search. Try again?"))
                        .fadeIn();
                }
                else if (results.length == 1)
                    addPoint(results[0],input);
                else {
                    cases.append(
                        $("<p>").text("Oops, we're not sure which place you meant. Try a more specific search?"))
                            .fadeIn();
                        searchbox.blur();
                    // var list = $("<ul>").append($("<li>").attr("class","title").text("Hrm, did you mean:")).appendTo(cases);
                    // for (var i = 0; i < results.length; i++) {
                    //     var r = results[i];
                    //     $("<li>").text(r.city+", "+r.state+", "+r.country)
                    //         .addClass("maybe-place")
                    //         .data("place",r)
                    //         .appendTo(list);
                    // }
                    // content.addClass("cases");
                    // cases.slideDown('fast');
                    // $("#cases li").click(function(){
                    //     var r = $(this);
                    //     addPoint(r.data("place"),input);
                    //     content.removeClass("cases");
                    //     cases.slideUp('fast');
                    // });
                }
            }
        });
    }

    function addPoint(place, input) {
        mesh.add(place.latitude, place.longitude, input);
        self.updateBounds();
    }

    self.locations = function(locations) {
        for (var i = 0; i < locations.length; i++) {
            setTimeout(function(loc) {
                return function() {
                    addPoint(loc, loc.name);
                };
            }(locations[i]), i * 400);
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

    // save the rotation for now
    var cr = 0;
    var rotateInterval;
    self.animateTransform = function(r) {
        if (rotateInterval) {
            clearInterval(rotateInterval);
        }

        var counter = 0;
        var delaunay = d3.select("#delaunay");
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

        $.each(places, function(i){
            var dataPoint = clats[i] + "\t" + clons[i] + "\t" + cp[i];
            dataString.push(dataPoint);
        });

        return dataString.join("|");
    };

	return self;
};