var sb = sb || {};

sb.mesh = function (frame, map, width, height) {
	var self = d3.dispatch("added", "refreshed", "locationsSet"),
		selfId = parseInt(Math.random() * 10000000000, 10);

    // making this not global ._.
    var lats = [],
        lons = [],
        places = [];

    var decoder = document.createElement('div');

    // main svg
    var main = d3.select(frame || "body").append("div")
        .attr("id", selfId)
        .style("width", width)
        .style("height", height)
        .style("position", "absolute")
        .style("z-index", "100")
        .append("svg:svg")
        .attr("class", "meshu-svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var g = main.append("svg:g")
            .attr("class", "delaunay")
            .attr("transform", "translate(0,0) scale(1) rotate(0,300,300)")
            .attr("fill","none")
            .attr("stroke-width","5")
            .attr("stroke","black")
            .attr("stroke-linejoin","round");

    var hidden = main.append("svg:g")
                 .attr("class", "hidden");

    hidden.append("svg:path");

    var uiFrame = d3.select(frame || "body").append("div")
        .attr("style", "position:absolute;z-index:1337;")
        .style("width", width)
        .style("height", height);

    var svg = uiFrame.append("svg:svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var ui = svg.append("svg:g")
        .attr("id", "delaunay-ui");

    var placeList = d3.select("#places");
    var placeTitle = placeList.select("#place-number").attr("class", "inactive");
        placeTitle.append("span").attr("class", "title-text");
        placeTitle.append("span").attr("class", "title-edit").html("edit");

    var list = placeList.append("ul");

    if (!$("body").hasClass("firefox"))
        $(".place-text input").live("blur", removeInput);

    var points = [],
        routes = {},
    	new_pt = [],
        pixel_bounds = [],
    	updateInterval = 0,
        selected = null,
        moved = false,
        dragging = null,
        mouse_down = null,
        map_dragging = null,
        last_mouse = null,
        meshuTitle = null;

    var content = $("#content"),
        cases = $("#cases");

    // d3.select(uiFrame.node())
    d3.select(".frame")
        .on("mousemove", mousemove)
        .on("mousedown", mousedown);

    d3.select('body').on("mouseup", mouseup);

    function mousedown() {
        if (!content.hasClass("edit")) return;

        // mouse is down, get ready to track map dragging
        mouse_down = true;
    }

    function mousemove() {
        // disable mousemove detection when we're not editing
        if (!content.hasClass("edit")) return;

        // if we're not dragging anything and the mouse isn't down, ignore
        if (!dragging && !mouse_down) {
            return;
        }

        var m = d3.svg.mouse(main.node());

        // if we're dragging a point, we need to update its data
        if (dragging) {
            var l = map.p2l({
                x: m[0],
                y: m[1]
            });
            dragging[0] = l.lon;
            dragging[1] = l.lat;

            var index = points.indexOf(dragging);
            lats[index] = l.lat;
            lons[index] = l.lon;
        
            update();
        }

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
        if (d3.event.target.tagName != 'circle' && d3.event.target != svg.node() && d3.event.target.tagName != "image")  return;

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

        if (dragging) {
            console.log(routes);
            showRoutes();
        }

        // delete the point if we mouseup on a point 
        if (!moved && dragging) {
            var index = points.indexOf(dragging);
            self.remove(index);

            map.updateBounds(lats, lons);
            self.updatePixelBounds();
            update();
        } else {
            mousemove();
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
        var circles = ui.selectAll("circle");
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

        // the delaunay mesh paths
        var lines = g.selectAll("path")
            .data(function(){
                var lineArray = [];
                for (var i = 0; i < points.length-1; i++) {
                    lineArray.push({"from":points[i],"to":points[i+1]});
                }
                return lineArray;
            });

        lines.enter().append("svg:path");
        lines.exit().remove();
        lines.attr("d", function(d) {
                var p = [d.from[1],d.from[0],d.to[1],d.to[0]];
                return makeRoute(p);
            });

        // we move the newest point closer and closer to its destination
        if (new_pt && skipAnimation == true) {
            clearInterval(updateInterval);
            new_pt = null;
            showRoutes();
        }
        else if (new_pt) {
            var last = points[points.length-1] || [];
            if (Math.abs(last[0] - new_pt[0]) > .0002) {
                last[0] += (new_pt[0] - last[0]) / 3;
            }    
            if (Math.abs(last[1] - new_pt[1]) > .0002) {
                last[1] += (new_pt[1] - last[1]) / 3;
            }    

            points[points.length - 1] = last;
            
            var dlon = Math.abs(last[0] - new_pt[0]);
            var dlat = Math.abs(last[1] - new_pt[1]);
            if (dlat < .0002 && dlon < .0002) {
                //finished!
                clearInterval(updateInterval);
                new_pt = null;
                showRoutes();
            }
        } else {
            clearInterval(updateInterval);
        }
    }

    function showRoutes() {
        g.selectAll("path").each(function(d){
            var line = d3.select(this);
            var pairKey = d.from[0]+"-"+d.to[1];
            if (pairKey in routes) {
                line.attr("d",makeRoute(routes[pairKey]));
            } else  {
                $.ajax({
                    url: "http://open.mapquestapi.com/directions/v1/route?generalize=10&outFormat=json&shapeFormat=raw&from="+
                    d.from[1]+","+d.from[0]+"&to="+d.to[1]+","+d.to[0],
                    // cache: false,
                    dataType: 'jsonp',
                    success: function(data) {
                        var wayPoints = data.route.shape.shapePoints;
                        routes[pairKey] = wayPoints;

                        line.attr("d",makeRoute(wayPoints));
                    }
                });
            }
        });
    }

    function makeRoute(p) {
        var draw = [];
        var l = p.length;
        for (var i = 0; i < l; i+=2){
            var loc = {
                lat: p[i],
                lon: p[i+1]
            };
            var pt = map.l2p(loc);
            draw.push([pt.x, pt.y]);
        }
        return "M" + draw.join("L");
    }

    function update(){
        // the transparent circles that serve as ui, allowing for dragging and deleting
        var circles = ui.selectAll("circle")
            .data(points);

        // new circles
        circles.enter()
            .append("svg:circle")
            .attr("id",function(d, i){ return "c-" + i; })
            .attr("r", 10)
            .on("mousedown", function(d) {
                selected = dragging = d;

                // stop prop to prevent map dragging
                d3.event.stopPropagation();
            });
        
        circles.exit().remove();

        // place names for the points
        var names = list.selectAll("li.place")
            .data(points);
        
        var place = names.enter().append("li").attr("class", "place");
        var title = place.append("span").attr("class", "title");
            title.append("span").attr("class", "place-text")
                .html(function(d, i) {
                    decoder.innerHTML = places[i];
                    return decoder.firstChild.nodeValue;
                });
            title.append("span").attr("class", "place-edit").html("edit");
            place.append("span").attr("class", "place-delete").html("x");

        names.exit().remove();

        names.attr("id", function(d, i) { return "p-" + i; })
            .select(".title").each(function(d) { d.edit = false; })
            .attr("class","title")
            .select(".place-text")
            .html(function(d, i) {
                // decode the text
                // http://stackoverflow.com/questions/3700326/decode-amp-back-to-in-javascript
                decoder.innerHTML = places[i];
                return decoder.firstChild.nodeValue;
            });

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

        self.updateCircleBehavior();
        updateListBehavior();
        updateMesh();
    };

    self.updateCircleBehavior = function(off) {
        var editMode = content.hasClass("edit");
        var placeHover = $("#place-hover");
        var circles = ui.selectAll("circle");

        circles.on("mouseover", function(d, i) {
            if (off) return;
            else if (editMode)
                list.select("#p-" + i).attr("class", "place highlight");
            else {
                placeHover.addClass("active").find("span").text(places[i]);
                
                var p = map.l2p({ lat: d[1], lon: d[0] });
                var w = placeHover.width();
                var top = (p.y - 32) + "px";
                var left = (p.x - (w/2) - 3) + "px";
                var bleft = w/2 - 3 + "px";

                
                placeHover.css({"top": top, "left": left})
                    .find("b").css("left", bleft);
            }
        });
        circles.on("mouseout", function(d, i) {
            if (off) return;
            else if (editMode)
                list.select("#p-"+i).attr("class","place");
            else
                placeHover.removeClass("active");
        });
    }

    function updateListBehavior() {
        var names = list.selectAll("li.place");
        names.select(".place-delete").on("click",function(d,i){
            self.remove(i);
            self.updatePixelBounds();
            map.updateBounds(lats, lons);
            update();
        });

        names.on("mouseover",function(d,i){
            ui.select("#c-"+i).attr("class","highlight");
        });
        names.on("mouseout",function(d,i){
            ui.select("#c-"+i).attr("class","");
        });
        names.select(".place-edit").on("click",function(d,i){
            var node = $(this).parent();
            if (!d.edit) editText(node,i,"place");
            else saveText(node,i,"place");
            d.edit = !d.edit;
        });
        names.select(".place-text").on("click",function(d,i){
            if (d.edit) return;
            editText($(this).parent(),i,"place");
            d.edit = !d.edit;
        });

        placeTitle.attr("class","").select(".title-text")
            .text(function(d){
                if (d && d.title) return d.title;
                else return "My Meshu";
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
        var value = ((type == "title") ? field.text() : places[i]);

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

        if (type == "place") places[i] = text;
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

    self.add = function(latitude, longitude, placename, skipAnimation) {
    	// clear previous update
    	if (updateInterval) {
            clearInterval(updateInterval);
    	}

        var lat = parseFloat(latitude);
        var lon = parseFloat(longitude);

        lats.push(lat);
        lons.push(lon);
        if (placename == undefined)
            places.push(latitude.toFixed(3)+", "+longitude.toFixed(3));
        else
            places.push(placename);

        if (points.length) {
            $("#meshu-container").removeClass("inactive");
        	
            new_pt = [lon, lat];   
            if (skipAnimation) {
                points.push([new_pt[0], new_pt[1]]);

                self.updatePixelBounds();
                update();
                updateMesh(skipAnimation);
            } else { 
                // make the new point start from the last location
                var last = points[points.length-1];
                points.push([last[0], last[1]]);
                self.updatePixelBounds();
                update();

                // animate the new point in place
                updateInterval = setInterval(updateMesh, 40);
            }
        } else {
            points.push([lon, lat]);
            update();
        }

        cases.fadeOut();
        
        self.added();
        return self;
    };

    self.remove = function(index) {   
        points.splice(index, 1);
        lats.splice(index, 1);
        lons.splice(index, 1);
        places.splice(index, 1);
        
        if (points.length < 3) $("#finish-button").removeClass("active");
        if (points.length == 1) $("#meshu-container").addClass("inactive");
    };

    self.lats = function() {
    	return lats;
    };

    self.lons = function() {
    	return lons;
    };

    self.places = function() {
        return places;
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
        places = [];
        $.each(locs, function(i, loc) {
           points.push([loc.longitude, loc.latitude]);
           lats.push(loc.latitude);
           lons.push(loc.longitude);
           places.push(loc.name);
        });

        // don't redraw just yet, we'll call this outside in meshu.js
        // update();
        self.locationsSet();

        return self;
    };

    self.refresh = function() {
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