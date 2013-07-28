var sb = sb || {};

sb.mesh.radial = function (frame, map, width, height) {
    var self = sb.mesh.base(frame, map, width, height),
        selfId = 'm' + parseInt(Math.random() * 10000000000, 10);

    // the name of the product line
    self.name = 'radial';

    var lats = [],
        lons = [],
        meshuTitle;

    var meshContainer = d3.select(frame || "body").append("div")
            .attr("id", selfId)
            .style("width", width)
            .style("height", height)
            .style("position", "absolute");

    var meshPrerendered = d3.select(frame || "body").append("div")
            .attr("id", selfId + 'prerendered')
            .style("width", width)
            .style("height", height)
            .style("position", "absolute");

    var main = d3.select('#' + selfId)
        .append("svg:svg")
        .attr("class", "meshu-svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var wrapper = main.append("svg:g").attr("class","delaunay");

    wrapper.append("svg:circle").data([[-122.445,37.755]])
        .attr("class","circleFrame")
        .attr("cx",300).attr("cy",300)
        .attr("r",0).attr("stroke-width",0);

    var g = wrapper.append("svg:g")
            .attr("class", "radial")
            .attr("transform", "translate(0,0) scale(1) rotate(0,300,300)")
            .attr("fill","none")
            .attr("stroke-linejoin","round")
            .attr("clip-path","url(#radialClip)");

    wrapper.append("svg:clipPath").attr("id","radialClip")
        .append("svg:circle")
        .data([[-122.445,37.755]])
        .attr("cx",300).attr("cy",300).attr("r",200);

    var uiShield = d3.select(frame)
        .append("div")
        .attr("id","ui-shield")
        .style("width","100%")
        .style("height","100%")
        .style("position","absolute");

    var placeTitle = d3.select("#place-title").attr("class", "inactive");
        placeTitle.append("span").attr("class", "title-text");
        placeTitle.append("span").attr("class", "title-edit").html("edit");

    if (!$("body").hasClass("firefox"))
        $(".place-text input").live("blur", self.removeInput);

    var points = [],
        routes = [],
        paths = [],
        pixel_bounds = [],
        requests = {},
        meshuTitle = null;

    var content = $("#content");

    self.hittest = function(target) {
        return d3.event.target != uiShield.node();
    };

    self.on("draggedMap", function() {
        update();
    });

    self.on("clickedMap", function(loc) {
        self.add(loc.lat, loc.lon, undefined, false);
    });

    // self.on("removed", function() {
    //     if (points.length == 0)
    //          $("#finish-button").removeClass("active");
    // });

    /*
        This is how we're listening to style changes
        here we're listening for something like
        {
            // 'drawStyle': 'knockout', // no more knockout style, but keeping zoom
            'zoom': 12
        }
    */
    self.on("styled", function(style) {
        if (style.zoom && style.zoom != map.map.zoom()) {
            map.map.zoom(style.zoom);
        }
    });

    // update the border circle
    function updateBorderCircle() {
        var circles = wrapper.selectAll("circle");
        circles.attr("cx", function(d) {
                return map.l2p({
                    lat: d[1],
                    lon: d[0]
                }).x;
            })
            .attr("cy", function(d) {
                return map.l2p({
                    lat: d[1],
                    lon: d[0]
                }).y;
            });
    }

    function updateRoutes() {
        var strokeWidth = function(d, i) {
            var max = Math.min(16, d.total - 4),
                min = 5,
                percent = (1 - Math.sqrt(d.d)),
                thickness = (max * percent) + min;

            return thickness + "px";
        };

        var stroke = "black";
        if (self.style() != undefined && self.style().drawStyle) {
            stroke = self.style().drawStyle == "outline" ? "black" : "white";
        }

        var lines = g.selectAll("path").data(paths);

        if ($("body").hasClass("firefox")) {
            lines.enter()
                .append("svg:path")
                .attr("fill", "none")
                .attr("stroke-linecap", "round")
                .style("stroke-width", strokeWidth);
        }
        else {
            lines.enter()
                .append("svg:path")
                .attr("fill", "none")
                .attr("stroke-linecap", "round")
                .style("stroke-width", 0)
                .transition()
                .duration(500)
                .style("stroke-width", strokeWidth);
        }

        lines.exit().remove();

        lines.attr("d", function(d) {
                return drawPath(d.pts);
            })
            .attr("stroke", stroke);
    }

    // draw the path based on an array of points
    function drawPath(p) {
        var draw = [];
        var l = p.length;
        for (var i = 0; i < l; i++){
            var loc = {
                lat: p[i][0],
                lon: p[i][1]
            };
            var pt = map.l2p(loc);
            draw.push([pt.x, pt.y]);
        }
        return "M" + draw.join("L");
    }

    // add a route as a series of segments
    function addRoute(waypoints) {
        routes.push(waypoints);

        var l = waypoints.length;
        for (var i = 0; i < l-2; i+=2){
            var start = [waypoints[i], waypoints[i+1]];
            var end = [waypoints[i+2], waypoints[i+3]];
            paths.push({
                pts: [start, end], // start and end
                total: waypoints.length,
                d: i / waypoints.length // use distance as the index for now
            });
        }

        updateRoutes();
    }

    function checkRequests(zoom) {
        var allDone = true,
            calculated = 0;
        for (var i = 1; i < points.length; i++) {
            if (requests[zoom][i] != 'done') {
                allDone = false;
            } else {
                calculated++;
            }
        }

        /*
            update progress bar for the radial calculations
            and only let you click "continue"
            when they're all done
        */
        var progress = (calculated/(points.length-1)*100).toFixed(0) + "%";

        $("#radial-heading").html("Generating radial... " + progress);

        if (allDone) {
            $("#radial-heading").html("Your radial is done!");
            self.added();
        }
    }

    // make all the route requests
    function requestRoutes() {
        var zoom = map.map.zoom(),
            start = points[0]
            startCoords = start[1]+","+start[0];

        // first request is done, requests starts at index 1
        requests[zoom] = ["done"];

        // jquery automatically adds a callback param
        // use https proxy for apis that don't support
        var mapquest = $('body').hasClass('ie') || window.location.protocol == 'https:'
            ? "https://meshu.io/proxy/router/?from="
            : "http://open.mapquestapi.com/directions/v1/route?routeType=pedestrian&outFormat=json&shapeFormat=raw&generalize=200&from=";

        var base = mapquest + '{start}&to={end}';

        for (var i = 1; i < points.length; i++) {
            var end = points[i],
                endCoords = end[1]+","+end[0],
                url = base.replace("{start}", startCoords).replace("{end}", endCoords);

            requests[zoom][i] = $.jsonp({
                url: url,
                callbackParameter: 'callback',
                error: function(j) {
                    return function(data) {
                        requests[zoom][j] = 'done';
                        checkRequests(zoom);
                    };
                }(i),
                success: function(j) {
                    return function(data) {
                        if (!data.route.shape) {
                            requests[zoom][j] = 'done';
                            return;
                        } else if (requests[zoom] == undefined || requests[zoom][j] == undefined || requests[zoom] == 'inactive') {
                            return;
                        }

                        var wayPoints = data.route.shape.shapePoints;
                        addRoute(wayPoints);
                        requests[zoom][j] = 'done';

                        checkRequests(zoom);
                    };
                }(i)
            });
        }
    }

    // update rotation and bounding box stuff
    function update(){
        placeTitle.data(points)
            .each(function(d){ d.edit = false; });

        updateListBehavior();
        updateBorderCircle();
        updateRoutes();
    }

    // update the place title editing
    function updateListBehavior() {
        placeTitle.attr("class","").select(".title-text")
            .text(function(d){
                if (d && d.title) {
                    return d.title;
                }
                else {
                    return meshuTitle;
                }

            });

        placeTitle.select(".title-text").on("click",function(d){
            if (d.edit) return;
            self.editText($(this).parent(),0,"title");
            d.edit = !d.edit;
        });

        placeTitle.select(".title-edit").on("click",function(d){
            var node = $(this).parent();
            if (!d.edit) self.editText(node,0,"title");
            else d.title = meshuTitle = self.saveText(node,0,"title");
            d.edit = !d.edit;
        });
    }

    // take a single point and turn it a ring of points
    function addRadialPoints() {
        main.selectAll("path").remove();

        paths = [];
        points = [points[0]];
        lats = [lats[0]];
        lons = [lons[0]];

        var tempLat, tempLon;

        // before i < 24, PI/12
        for (var i = 0; i < 24; i++) {
            var theta = i*(Math.PI/12);
            var l = map.p2l({
                x: 300+Math.sin(theta)*200,
                y: 300+Math.cos(theta)*200
            });
            tempLon = l.lon;
            tempLat = l.lat;
            lats.push(tempLat);
            lons.push(tempLon);
            points.push([tempLon, tempLat]);
        }
    }

    self.add = function(latitude, longitude, placename, skipAnimation) {
        var lat = parseFloat(latitude);
        var lon = parseFloat(longitude);

        meshContainer.select("#radialClip circle").data([[lon,lat]]);

        // hardcoding these styles because drawing it in canvas requires it.
        meshContainer.select(".circleFrame").data([[lon,lat]])
            .attr("r",0).attr("stroke-width",0)
            .transition().delay(250).duration(500)
            .attr("r", 204)
            .attr("stroke-width", 17);

        lats = [lat];
        lons = [lon];

        points = [[lon,lat]];

        if (placename == undefined) {
            meshuTitle = latitude.toFixed(3)+", "+longitude.toFixed(3);
        }
        else {
            meshuTitle = placename[0].toUpperCase() + placename.substr(1, placename.length-1);
        }


        $("#places").removeClass("inactive");

        /*
            just recentering so we don't clear out all the tiles
            (meshu.js handles zooming if it's a searched result)
            but we also have to run boundsUpdated() so that
            the title / pixelbounds / etc are updated
        */
        var r = map.getMapRadius();
        map.map.center({ lat: lat, lon: lon });
        map.boundsUpdated();

        // here's where we want to recalculate stuff, because the points have changed
        self.recalculate();

        return self;
    };

    self.remove = function(index) {
        points.splice(index, 1);
        lats.splice(index, 1);
        lons.splice(index, 1);
        // places.splice(index, 1);

        // if (points.length == 0) $("#finish-button").removeClass("active");
    };

    self.lats = function() {
        return lats;
    };

    self.lons = function() {
        return lons;
    };

    self.places = function() {
        return [meshuTitle];
    };

    self.points = function(pts) {
        if (!arguments.length) {
            return points;
        }

        points = pts;
        return self;
    };

    /*
        this bit of code is called by rasterizer.js because
        we need explicit styling for the canvg code to
        rasterize it correctly - yikes!
    */
    self.bakeStyles = function() {
        var stroke = $(".circleFrame").css("stroke"),
            fill = $(".circleFrame").css("fill"),
            pathStroke = $(".radial path").css("stroke");

        $(".circleFrame").attr("stroke", stroke);

        $(".circleFrame").attr("fill", fill);

        $(".radial path").attr("stroke", pathStroke);
    };

    self.unBakeStyles = function() {
        $(".circleFrame").attr("stroke", "")
            .attr("fill", "");

        $(".radial path").css("stroke", "");
    };

    self.locations = function(locs) {
        points = [];
        lats = [];
        lons = [];

        $.each(locs, function(i, loc) {
           points.push([loc.longitude, loc.latitude]);
           lats.push(loc.latitude);
           lons.push(loc.longitude);
        });

        // don't redraw just yet, we'll call this outside in meshu.js
        self.dirty = true;
        self.locationsSet();

        return self;
    };

    self.prerender = function(svg, multiplier) {
        multiplier = multiplier || 1;

        // copy over the svg instead of doing all the routing again
        $('#' + selfId + 'prerendered').html(svg);
        var pathGroup = $('#' + selfId + 'prerendered').find(".delaunay");
        // $('#' + selfId + 'prerendered').remove();

        $('#' + selfId).find(".delaunay").replaceWith(pathGroup);


        var fw = $(frame).width(),
            fh = $(frame).height(),
            r = 600 * multiplier,
            translate = "translate("+(fw-r)/2+","+(fh-r)/2+") ",
            scale = " scale(" + multiplier + "," + multiplier + ")";

        $('#' + selfId + " .delaunay").attr("transform", translate + scale);
    };

    self.recalculate = function() {
        // clear prerendered
        $('#' + selfId + "prerendered").remove();

        $.each(requests, function(i, spokes){
            $.each(spokes, function(j, r) {
                if (r == undefined || r == 'done')
                    return;

                if (r.abort) {
                    r.abort();
                }
            });

            requests[i] = 'inactive';
        });

        addRadialPoints();
        requestRoutes();

        // update the zoom
        self.style({
            zoom: map.map.zoom()
        });

        /*
            when we recalculate, things are recentered around the central point
            so our bounds are clean
        */
        self.dirty = false;
    };

    self.refresh = function(flag) {
        if (flag == 'zoomed' && lats.length > 0 && lons.length > 0) {
            self.add(lats[0], lons[0], meshuTitle);
        } else {
            update();
            self.refreshed();
        }
    };

    self.updateTitle = function(t) {
        meshuTitle = t;
    };

    self.outputTitle = function() {
        return meshuTitle || "My Meshu";
    };

    // outputs svg data
    self.output = function() {
        return $('#' + selfId).html();
    };

    self.id = function() {
        return selfId;
    };

    return self;
};