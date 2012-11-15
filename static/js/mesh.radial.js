var sb = sb || {};

sb.mesh = function (frame, map, width, height) {
    var self = sb.meshbase(frame, map, width, height),
        selfId = parseInt(Math.random() * 10000000000, 10);

    // the name of the product line
    self.name = 'radial';

    // making this not global ._.
    var lats = [],
        lons = [],
        meshuTitle;

    var decoder = document.createElement('div');

    // main svg
    var main = d3.select(frame || "body").append("div")
        .attr("id", selfId)
        .style("width", width)
        .style("height", height)
        .style("position", "absolute")
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

    var hidden = main.append("svg:g")
                 .attr("class", "hidden");

    hidden.append("svg:path");

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
        new_pt = [],
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

        if (style.zoom) {
            if (style.zoom != map.map.zoom()) {
                map.map.zoom(style.zoom);   
            }
        }
    })


    function updateMesh(skipAnimation) {
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
        // console.log(paths.length, 'updating');

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

    function showRoutes() {
        var zoom = map.map.zoom();
        requests[zoom] = [];
        for (var i = 1; i < points.length; i++) {
            requests[zoom][i] = $.ajax({
                url: "/proxy/router/?from=" + 
                // "http://open.mapquestapi.com/directions/v1/route?routeType=pedestrian&outFormat=json&shapeFormat=raw&generalize=200&from="+
                // d.from[1]+","+d.from[0]+"&to="+d.to[1]+","+d.to[0],
                points[0][1]+","+points[0][0]+"&to="+points[i][1]+","+points[i][0],
                // cache: false,
                dataType: 'json',
                success: function() {
                    var j = i;
                    return function(data) {
                        if (!data.route.shape || requests[zoom] == undefined || requests[zoom][j] == undefined) {
                            return;
                        }

                        var wayPoints = data.route.shape.shapePoints;
                        addRoute(wayPoints);
                        requests[zoom][j] = 'done';
                    };
                }()
            });
        }
    }

    function update(){

        placeTitle.data(points)
            .each(function(d){ d.edit = false; });

        var rotate_pts = hidden.selectAll("circle.rotation").data(pixel_bounds);
        rotate_pts.enter()
            .append("svg:circle")
            .attr("class","rotation")
            .attr("r","40")
            .attr("cx", function(d, i) {
                return d.x;
            }).attr("cy", function(d, i) {
                return d.y;
            });
            
        rotate_pts.exit().remove();
        rotate_pts.attr("cx", function(d, i) {
                return d.x;
            }).attr("cy", function(d, i) {
                return d.y;
            });
        var bounding_box = hidden.select("path");
        bounding_box.attr("d", function() {
            if (pixel_bounds.length == 0) return;
            var draw = [];
            $.each(pixel_bounds, function(i, p) {
                draw.push([p.x,p.y]);
            });
            return "M" + draw.join("L") + "Z"; 
        }).attr("class","hiddenFrame")

        updateListBehavior();
        updateMesh();
        updateRoutes();
    }

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

        main.select("#radialClip circle").data([[lon,lat]]);
        main.select(".circleFrame").data([[lon,lat]])
            .attr("r",0).attr("stroke-width",0)
            .transition().delay(250).duration(500)
            .attr("r",204).attr("stroke-width",20);

        lats = [lat];
        lons = [lon];

        points = [[lon,lat]];

        if (placename == undefined)
            meshuTitle = latitude.toFixed(3)+", "+longitude.toFixed(3);
        else
            meshuTitle = placename;

        $("#places").removeClass("inactive");

        var r = map.getMapRadius();
        map.updateBounds([lat-r.lat, lat+r.lat], [lon-r.lon, lon+r.lon]);

        addRadialPoints();
        showRoutes();
        update();

        self.added();
        
        return self;
    };

    self.remove = function(index) {   
        points.splice(index, 1);
        lats.splice(index, 1);
        lons.splice(index, 1);
        // places.splice(index, 1);
        
        if (points.length == 0) $("#finish-button").removeClass("active");
        // if (points.length == 0) $("#meshu-container").addClass("inactive");
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
        hidden.style("display", "none");
    };

    self.showRotator = function() {
        hidden.style("display", "");
    };

    self.locations = function(locs) {
        new_pt = null;

        points = [];
        lats = [];
        lons = [];
        // places = [];
        $.each(locs, function(i, loc) {
           points.push([loc.longitude, loc.latitude]);
           lats.push(loc.latitude);
           lons.push(loc.longitude);
           // places.push(loc.name);
        });

        // don't redraw just yet, we'll call this outside in meshu.js
        self.locationsSet();

        return self;
    };

    self.refresh = function() {
        console.log('refreshing', requests);

        $.each(requests, function(i, spokes){
            $.each(spokes, function(i, r) {
                if (r == undefined || r == 'done')
                    return;

                // console.log('aborting', r);
                // r.abort();
            });

            delete requests[i];
        });

        // addRadialPoints();
        // showRoutes();
        
        update();

        // update the zoom
        self.style({
            zoom: map.map.zoom()
        });

        self.refreshed();
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

    return self;
};