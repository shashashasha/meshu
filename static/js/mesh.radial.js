var sb = sb || {};

sb.mesh.radial = function (frame, map, width, height) {
    var self = sb.mesh.base(frame, map, width, height),
        selfId = 'm' + parseInt(Math.random() * 10000000000, 10),
        hosts = ['a', 'b', 'c', 'd'];

    // the name of the product line
    self.name = 'radial';

    // making this not global ._.
    var lats = [],
        lons = [],
        meshuTitle,
        lastZoom;

    var decoder = document.createElement('div');

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

    // var hidden = main.append("svg:g")
    //              .attr("class", "hidden");

    // hidden.append("svg:path");

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

    $("#radial-knockout").click(function(){
        self.style({
            drawStyle: "knockout"
        });
    });
    $("#radial-frame").click(function(){
        self.style({
            drawStyle: "outline"
        });
    });

    var points = [],
        routes = [],
        paths = [],
        pixel_bounds = [],
        requests = {},
        meshuTitle = null;

    var content = $("#content");

    d3.select(uiShield.node())
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    var tooltipTimeout;
    function mouseover() {
        tooltipTimeout = setTimeout(function(){
            $(".map-hint").fadeIn();
        },500);
    }
    function mouseout() {
        clearTimeout(tooltipTimeout);
        $(".map-hint").fadeOut();
    }

    self.hittest = function(target) {
        return d3.event.target != uiShield.node();
    };

    self.on("draggedMap", function() {
        update();
    });

    self.on("clickedMap", function(loc) {
        self.add(loc.lat, loc.lon, undefined, false);
    });

    self.on("removed", function() {
        if (points.length == 0)
             $("#finish-button").removeClass("active");
    });

    /*
        This is how we're listening to style changes
        here we're listening for something like 
        {
            'drawStyle': 'knockout',
            'zoom': 12
        }
    */
    self.on("styled", function(style) {
        if (style.drawStyle) {
            switch (style.drawStyle) {
                case "knockout":
                    $("body").addClass("knockout");
                    $(this).addClass("active");
                    $("#radial-frame").removeClass("active");
                    break;

                case "outline":
                default:
                    $("body").removeClass("knockout");
                    $(this).addClass("active");
                    $("#radial-knockout").removeClass("active");
                    break;
            }
        }

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
        var lines = g.selectAll("path").data(paths);
        lines.enter().append("svg:path");
        lines.exit().remove();

        lines.attr("d", function(d) {
            return drawPath(d.pts);
        });

        lines.attr("stroke", "black")
            .attr("fill", "none")
            .attr("stroke-linecap", "round");

        lines.attr("stroke-width", function(d, i) {
            return 20 * ((1 - Math.pow(d.d, .5)) + .1) + "px";
        });

        lines.style("stroke-width", function(d, i) {
            return 20 * ((1 - Math.pow(d.d, .5)) + .1) + "px";
        });
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
                d: i / waypoints.length // use distance as the index for now
            });
        }

        updateRoutes();
    }

    function checkRequests(zoom) {
        console.log(zoom, requests);
        var allDone = true,
            calculated = 0;
        for (var i = 1; i < points.length; i++) {
            if (requests[zoom][i] != 'done') {
                allDone = false;
            } else {
                calculated++;
            }
        }

        var progress = calculated + '/' + (points.length-1);

        $("#radial-heading").html("Generating radial... " + progress);

        if (allDone) {
            $("#radial-heading").html("Your radial is done!");
            self.added();
        }
    }

    // make all the route requests
    function requestRoutes() {
        var zoom = map.map.zoom(),
            start = points[0];

        lastZoom = zoom;

        // first request is done, requests starts at index 1
        requests[zoom] = ["done"];

        var host = hosts.pop();
        hosts.unshift(host);

        for (var i = 1; i < points.length; i++) {
            var end = points[i];

            // "http://open.mapquestapi.com/directions/v1/route?routeType=pedestrian&outFormat=json&shapeFormat=raw&generalize=200&from="+
            // d.from[1]+","+d.from[0]+"&to="+d.to[1]+","+d.to[0],

            requests[zoom][i] = $.ajax({
                url: "/proxy/router/?from=" + start[1]+","+start[0]+"&to="+end[1]+","+end[0],
                // cache: false,
                dataType: 'json',
                success: function() {
                    var j = i;
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
                }()
            });
        }
    }

    // update rotation and bounding box stuff
    function update(){
        console.log('updating');
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
                if (d && d.title) return d.title;
                else return meshuTitle;
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
        meshContainer.select(".circleFrame").data([[lon,lat]])
            .attr("r",0).attr("stroke-width",0)
            .transition().delay(250).duration(500)
            .attr("r",204).attr("stroke-width",20);

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

        var r = map.getMapRadius();
        map.updateBounds([lat-r.lat, lat+r.lat], [lon-r.lon, lon+r.lon]);

        // here's where we want to recalculate stuff, because the points have changed
        self.recalculate();

        // self.added();
        
        return self;
    };

    self.remove = function(index) {   
        points.splice(index, 1);
        lats.splice(index, 1);
        lons.splice(index, 1);
        // places.splice(index, 1);
        
        if (points.length == 0) $("#finish-button").removeClass("active");
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
    self.hideRotator = function() {
    };

    self.showRotator = function() {
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
        self.locationsSet();

        return self;
    };

    self.prerender = function(svg) {
        // copy over the svg instead of doing all the routing again
        $('#' + selfId + 'prerendered').html(svg);
        var pathGroup = $('#' + selfId + 'prerendered').find(".delaunay");
        $('#' + selfId + 'prerendered').remove();
        $('#' + selfId).find(".delaunay").replaceWith(pathGroup);


        var fw = $(frame).width(),
            fh = $(frame).height();
        if (fw > fh)
            // $('#' + selfId + "prerendered" + ' .delaunay').attr("transform","translate("+(fw-fh)/2+",0)")
            $('#' + selfId + " .delaunay").attr("transform","translate("+(fw-fh)/2+",0)")
    };

    self.recalculate = function() {
        // clear prerendered
        $('#' + selfId + "prerendered").remove();

        $.each(requests, function(i, spokes){
            $.each(spokes, function(i, r) {
                if (r == undefined || r == 'done')
                    return;

                // console.log('aborting', r);
                // r.abort();
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
        if (flag == 'zoomed') {
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