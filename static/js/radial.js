var sb = sb || {};

sb.mesh = function (frame, map, width, height) {
    var self = d3.dispatch("added", "refreshed", "locationsSet"),
        selfId = parseInt(Math.random() * 10000000000, 10);

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
        $(".place-text input").live("blur", removeInput);

    $("#radial-knockout").click(function(){
        $("body").addClass("knockout");
        $(this).addClass("active");
        $("#radial-frame").removeClass("active");
    });
    $("#radial-frame").click(function(){
        $("body").removeClass("knockout");
        $(this).addClass("active");
        $("#radial-knockout").removeClass("active");
    });

    var points = [],
        routes = [],
        paths = [],
        new_pt = [],
        pixel_bounds = [],
        requests = {},
        updateInterval = 0,
        selected = null,
        moved = false,
        dragging = null,
        mouse_down = null,
        map_dragging = null,
        last_mouse = null,
        meshuTitle = null;

    var content = $("#content");

    d3.select(".frame")
        .on("mousemove", mousemove)
        .on("mousedown", mousedown)
        
    d3.select(uiShield.node())
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    d3.select('body').on("mouseup", mouseup);

    function mousedown() {
        if (!content.hasClass("edit")) return;

        // mouse is down, get ready to track map dragging
        mouse_down = true;
    }

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

    function mousemove() {
        // disable mousemove detection when we're not editing
        if (!content.hasClass("edit")) return;

        // if we're not dragging anything and the mouse isn't down, ignore
        if (!dragging && !mouse_down) {
            return;
        }

        var m = d3.svg.mouse(main.node());

        if (moved && mouse_down) {
            // if we've moved and the mouse is down, we're dragging the map
            map_dragging = true;

            // move the map by the delta
            if (last_mouse)
                map.map.panBy({ x: m[0] - last_mouse[0], y: m[1] - last_mouse[1] });

            update();
        }

        moved = true;
        last_mouse = m;
    }

    function mouseup() {
        mouse_down = null;
        last_mouse = null;

        // if we're not on the right page, ignore
        if (!content.hasClass("edit")) return;

        // ignore zoom buttons, other ui
        // if it's a circle we need to continue because that means it's a point that's being dragged
        // image for IE fix!
        if (d3.event.target.id != 'ui-shield' && d3.event.target != main.node() && d3.event.target.tagName != "image")  return;

        // if we're not dragging and we're not dragging the map, we're adding a point
        if (!dragging && !map_dragging) {
            var m = d3.svg.mouse(main.node());
            var loc = map.p2l({
                x: m[0],
                y: m[1]
            });

            self.add(loc.lat, loc.lon, undefined, false);
            map_dragging = null;
            return;
        }

        // ignore other events
        if (d3.event) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
        }

        // reset the dragging flags
        moved = false;
        dragging = null;
        map_dragging = null;
    }

    self.updatePixelBounds = function() {
        if (lats.length && lons.length) {
            pixel_bounds = [map.l2p({ lat: d3.min(lats), lon: d3.min(lons) }),
                            map.l2p({ lat: d3.max(lats), lon: d3.min(lons) }),
                            map.l2p({ lat: d3.max(lats), lon: d3.max(lons) }),
                            map.l2p({ lat: d3.min(lats), lon: d3.max(lons) })];
        }
        else { 
            pixel_bounds = [];
        }
    }

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
        // var radius = Math.sqrt(Math.pow((r0[0]-r1[0],2)+Math.pow((r0[1]-r1[1]),2)));
        // main.select(".circleFrame").attr("r",radius);
        // the transparent circles that serve as ui, allowing for dragging and deleting
        // var circles = ui.selectAll("circle")
        //     .data([points[0]]);

        // // new radial circles
        // circles.enter()
        //     .append("svg:circle")
        //     .attr("id",function(d, i){ return "c-" + i; })
        //     .attr("r", 10)
        //     .on("mousedown", function(d) {
        //         selected = dragging = d;

        //         // stop prop to prevent map dragging
        //         d3.event.stopPropagation();
        //     });
        
        // circles.exit().remove();

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
            editText($(this).parent(),0,"title");
            d.edit = !d.edit;
        });

        placeTitle.select(".title-edit").on("click",function(d){
            var node = $(this).parent();
            if (!d.edit) editText(node,0,"title");
            else d.title = meshuTitle = saveText(node,0,"title");
            d.edit = !d.edit;
        });
    }

    function editText(node,i,type) {
        var button = node.find("." + type + "-edit").text("save");
        var field = node.find("." + type + "-text");
        var value = ((type == "title") ? field.text() : meshuTitle);

        node.addClass("active");
        field.html('<input value="' + value + '">').find("input").focus();

        // TODO: pressing enter saves the value
        // right now has issues with event propogation 
        // also going from one edit field to another

        // field.keyup(function(event) {
        //     if (event.which != 13) return;
        //     saveText(node, i, type);
        //     button.text("edit");
        //     field.unbind('keyup'); 
        // });
    }
    function saveText(node, i, type) {
        var button = node.find("." + type + "-edit").text("edit");
        var text = node.find("input").val();

        node.removeClass("active");
        node.find("." + type + "-text").text(text);

        if (type == "place") meshuTitle = text;
        else return text;
    }
    function removeInput(event){
        var titles = list.selectAll("li.place .title");
        titles.each(function(d, i) {
            if (!d.edit) return;
            d.edit = false;
            saveText($(this), i, "place");
        });
        return false;
    };

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
        // clear previous update
        if (updateInterval) {
            clearInterval(updateInterval);
        }

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
        return meshuTitle;
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
        // update();
        self.locationsSet();

        return self;
    };

    self.refresh = function() {
        console.log(requests);
        $.each(requests, function(i, spokes){
            $.each(spokes, function(i, r) {
                if (r == undefined || r == 'done')
                    return;

                console.log('aborting', r);
                r.abort();
            });

            delete requests[i];
        });
        console.log(requests);

        addRadialPoints();
        showRoutes();
        update();

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