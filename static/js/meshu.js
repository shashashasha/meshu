var sb = sb || {};
var app_key = "dj0yJmk9M1hsekZBSDY1ZjRxJmQ9WVdrOU5uUjZiRzE0TXpRbWNHbzlNVEV5TURZMU1qRTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD00OQ--";

sb.meshu = function(frame, renderer, existingMap) {
	var self = {},
        width = $(frame).width() + 'px',
        height = $(frame).height() + 'px',
		map = existingMap || sb.map(frame, width, height),
        renderer = renderer || 'facet',
        // use the renderer given
		mesh = sb.mesh[renderer](frame, map, width, height),
        cases = $("#cases");

    self.offsetX = 0;

    // need to make these controls optional....
    $(frame).append("<div class='mapui'><div id='zoomin'></div><div id='zoomout'></div></div>");

    $("#zoomin").mousedown(function(e) {
        map.map.zoom(map.map.zoom() + 1);
        mesh.refresh("zoomed");
    });
    $("#zoomout").mousedown(function(e) {
        map.map.zoom(map.map.zoom() - 1);
        mesh.refresh("zoomed");
    });

    var searchbox = $("#searchbox");
    // searchbox.focus(function(){
    //     cases.fadeOut();
    // })
    searchbox.keypress(function(event) {
        cases.fadeOut();
        if ( event.which == 13 ) {
            var input = searchbox.val();
            searchPlaces(input);
        }
    });

	// this is tied to a global submit button for now
    $("#search-button").click(function(){
        var input = searchbox.val();
        if (input.split('|').length > 2) {
            var inputs = input.split('|');
            for (var i = 0; i < inputs.length; i++) {
                setTimeout(function(searchPhrase) {
                    return function() {
                        searchPlaces(searchPhrase);
                    }
                }(inputs[i]), i * 1000);
            }
        }
        else {
            searchPlaces(input);
        }
    });

    // self.checkAdded = function() {
    //     pay attention to the number of points
    //     var points = mesh.points();
    //     var minPoints = 3;
    //     if ($("body").hasClass("radial")) minPoints = 1;
    //     if (points.length >= minPoints) $("#finish-button").addClass("active");
    //     else $("#finish-button").removeClass("active");
    // }

    // on click of search button
    function searchPlaces(input) {
        // default input
        if (input == "add a city, place, or address") return;

        var query = input.replace("&","and").replace(/[^\w ]/ig, "").replace(" ","+");

        var url = "/proxy/geocoder/?location=" + query;
            //$('body').hasClass('ie') || window.location.protocol == 'https:'
            // : "http://where.yahooapis.com/geocode?location=" + query + "&flags=J&appid=" + app_key;

        searchbox.val("");

        $.ajax({
            url: url,
            cache: false,
            dataType: 'json',
            error: function(error, error1, error2){
                console.log(error2);
            },
            success: function(data){
                // var results = data.ResultSet.Results || [data.ResultSet.Result];
                var results = data.results;
                cases.empty().hide();

                if (typeof results == "undefined" || results[0].locations.length == 0) {
                    var msg = "Hrm, we weren't able to find your search. Try again?";
                    cases.append($("<p>").text(msg)).fadeIn();
                    searchbox.focus();
                    return;
                }

                else if (results.length > 0) {
                    var first = results[0].locations[0];

                    switch (mesh.name) {
                        case 'facet':
                        case 'print':
                            // mesh.add(first.offsetlat, first.offsetlon, input);
                            mesh.add(first.latLng.lat, first.latLng.lng, input);
                            self.updateBounds();

                            // set the zoom for first point
                            if (mesh.points().length == 1) {
                                // setZoomRadius(first.radius);
                                setZoomGranularity(first.geocodeQuality);
                            }
                            break;
                        case 'radial':
                            // set the zoom based on radius
                            // setZoomRadius(first.radius/10);
                            setZoomGranularity(first.geocodeQuality, 12);
                            // mesh.add(first.offsetlat, first.offsetlon, input);
                            mesh.add(first.latLng.lat, first.latLng.lng, input);
                            break;

                    }
                }
            }
        });
    }

    /*
        Zoom level reference for various levels of granularity of the geocoder
    */
    // function getZoom(rad) {
    //     // region
    //     if (rad > 100000) {
    //         return 4;
    //     }
    //     // bigger city
    //     else if (rad > 10000) {
    //         return 12;
    //     }
    //     // small town
    //     else if (rad > 1000) {
    //         return 13;
    //     }
    //     // address
    //     else if (rad > 400) {
    //         return 14;
    //     }

    //     // default
    //     return 12;
    // };

    // function setZoomRadius(rad) {
    //     var zoom = getZoom(rad);

    //     // don't change it unless it's different
    //     if (zoom != map.map.zoom()) {
    //         map.map.zoom(zoom);
    //     }
    // };
    function getZoomGranularity(granularity) {
        switch (granularity) {
            case 'POINT':
            case 'ADDRESS':
            case 'INTERSECTION':

            case 'STREET':
                return 14;

            case 'ZIP':
            case 'ZIP_EXTENDED':
                return 13;

            case 'CITY':
                return 12;

            case 'COUNTY':
                return 10;

            case 'STATE':
                return 6;
            case 'COUNTRY':
                return 4;

            default:
                return 12;
        }
    };

    function setZoomGranularity(grain, min) {
        var zoom = Math.max(min || 4, getZoomGranularity(grain));

        // to prevent tiles flashing
        if (zoom != map.map.zoom()) {
            map.map.zoom(zoom);
        }
    };

    self.locations = function(locations, skipDelay) {
        for (var i = 0; i < locations.length; i++) {
            if (skipDelay) {
                mesh.add(locations[i].latitude, location[i].longitude, locations[i].name);
            }
            else {
                setTimeout(function(loc) {
                    return function() {
                        mesh.add(loc.latitude, loc.longitude, loc.name);
                        self.updateBounds();
                    };
                }(locations[i]), i * 400);
            }
        }

        if (skipDelay) {
            self.updateBounds();
        }
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

    self.map = function() {
        return map;
    };

    // save the rotation for now
    var cr = 0, cs = 1, ctx = 0, cty = 0;
    var rotateInterval;
    self.animateTransform = function(r, s, tx, ty) {
        if (rotateInterval) {
            clearInterval(rotateInterval);
        }

        var counter = 0;
        var delaunay = d3.select(".delaunay");
        rotateInterval = setInterval(function(){
            if (++counter < 30) {
                cr += (r - cr) * .33;
                cs += (s - cs) * .5;
                ctx += (tx - ctx) * .5;
                cty += (ty - cty) * .5;

                var rotate = "rotate(" + cr + ", 300, 300)";
                var scale = "scale(" + cs + ")";
                var translate = "translate(" + ctx + "," + cty + ")";
                delaunay.attr("transform", scale + translate + rotate);
            }
            else
                clearInterval(rotateInterval);
        }, 40);
    };

    self.refreshWithBounds = function(lats, lons) {
        console.log('refresh with bounds');
        // using a zoomOffset parameter set outside in app.js
        map.updateBounds(lats, lons, self.zoomOffset, self.offsetX);
    };

    /*
        because this forces us to load tiles and stuff
        only actually refresh the bounds if the map is dirty
        ie, if it's been panned, or if points have been added without refreshing
    */
    self.updateBounds = function() {
        if (mesh.dirty) {
            self.refreshWithBounds(mesh.lats(), mesh.lons());
            mesh.dirty = false;
        }
    };

    map.on("boundsUpdated", function() {
        // only facet has this
        if (mesh.updatePixelBounds)
            mesh.updatePixelBounds();

        mesh.refresh();
    });

    mesh.on("locationsSet", self.updateBounds);

    self.getFrame = function() {
        return frame;
    };

    self.getRenderer = function() {
        return renderer;
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

    self.outputMapSVG = function() {
        return $(map.map.container()).html();
    };

    self.hideMesh = function() {
        return self;
    };

    self.showMesh = function() {
        return self;
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

    self.xhr = function() {
        return {
          'xhr': 'true',
          'title' : self.outputTitle(),
          'svg': self.outputSVG(),
          'location_data' : self.outputLocationData(),
          'renderer': mesh.name,
          'metadata': mesh.outputStyle(),
          'promo': meshu.promo
        };
    };

	return self;
};