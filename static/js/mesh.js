var sb = sb || {};
var lats = [],
    lons = [],
    places = [];

sb.mesh = function (frame, map, width, height) {
	var self = {},
		selfId = parseInt(Math.random() * 10000000000, 10);

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
            .attr("id", "delaunay")
            .attr("transform", "translate(0,0) scale(1) rotate(0,300,300)");

    var hidden = main.append("svg:g")
                 .attr("id", "hidden");

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

    $(".place-text input").live("blur", removeInput);

    var points = [],
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

    d3.select(uiFrame.node())
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
        if (d3.event.target.tagName != 'circle' && d3.event.target != svg.node())  return;

        // if we're not dragging and we're not dragging the map, we're adding a point
        if (!dragging && !map_dragging) {
            var m = d3.svg.mouse(main.node());
            var loc = map.p2l({
                x: m[0],
                y: m[1]
            });

            self.add(loc.lat, loc.lon);
            map_dragging = null;
            return;
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

    self.updatePixelBounds = function(){
        if (lats.length && lons.length)
            pixel_bounds = [map.l2p({ lat: d3.min(lats), lon: d3.min(lons) }),
                            map.l2p({ lat: d3.max(lats), lon: d3.min(lons) }),
                            map.l2p({ lat: d3.max(lats), lon: d3.max(lons) }),
                            map.l2p({ lat: d3.min(lats), lon: d3.max(lons) })];
        else pixel_bounds = [];
    }

    function updateMesh() {
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
            .data(d3.geom.delaunay(points));

        lines.enter().append("svg:path");
        lines.exit().remove();
        lines.attr("d", function(d) {
                var l = d.length;
                var draw = [];
                for (var i = 0; i < l; i++){
                    var loc = {
                        lat: parseFloat(d[i][1]),
                        lon: parseFloat(d[i][0])
                    };
                    var pt = map.l2p(loc);
                    draw.push([pt.x, pt.y]);
                } 
                return "M" + draw.join("L") + "Z"; 
            });

        // we move the newest point closer and closer to its destination
        if (new_pt) {
            var last = points[points.length-1] || [];
            if (Math.abs(last[0] - new_pt[0]) > .0003) {
                last[0] += (new_pt[0] - last[0]) / 3;
            }    
            if (Math.abs(last[1] - new_pt[1]) > .0003) {
                last[1] += (new_pt[1] - last[1]) / 3;
            }    

            points[points.length - 1] = last;
            
            var dlon = Math.abs(last[0] - new_pt[0]);
            var dlat = Math.abs(last[1] - new_pt[1]);
            if (dlat < .0005 && dlon < .0005) {
                clearInterval(updateInterval);
                new_pt = null;
            }   
        } else {
            clearInterval(updateInterval);
        }
    }

    function update(){
        // the transparent circles that serve as ui, allowing for dragging and deleting
        var circles = ui.selectAll("circle")
            .data(points);

        // new circles
        circles.enter()
            .append("svg:circle")
            .attr("id",function(d, i){ return "c-" + i; })
            .attr("r", 7)
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
            title.append("span").attr("class", "place-text");
            title.append("span").attr("class", "place-edit").html("edit");
            place.append("span").attr("class", "place-delete").html("x");

        names.exit().remove();

        names.attr("id", function(d, i) { return "p-" + i; })
            .select(".title").each(function(d) { d.edit = false; })
            .select(".place-text")
            .text(function(d, i) {
                return places[i];   
            });

        placeTitle.data(points)
            .each(function(d){ d.edit = false; });

        var rotate_pts = hidden.selectAll("circle.hidden").data(pixel_bounds);
        rotate_pts.enter().append("svg:circle").attr("class","hidden").attr("r","20");
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
        });

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
                var left = (p.x - (w/2)) + "px";
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
    function removeInput(){
        var titles = list.selectAll("li.place .title");
        titles.each(function(d, i) {
            if (!d.edit) return;
            d.edit = false;
            saveText($(this), i, "place");
        });
    }

    self.add = function(latitude, longitude, placename) {
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

        	// make the new point start from the last location
            var last = points[points.length-1];
            points.push([last[0], last[1]]);
            self.updatePixelBounds();
            update();

            // animate the new point in place
            updateInterval = setInterval(updateMesh, 40);
        } else {
            points.push([lon, lat]);
            update();
        }

        cases.fadeOut();
        if (points.length > 3) $("#finish-button").addClass("active");
        else $("#finish-button").removeClass("active");

        return self;
    };

    self.remove = function(index) {   
        points.splice(index, 1);
        lats.splice(index, 1);
        lons.splice(index, 1);
        places.splice(index, 1);
        if (points.length < 4) $("#finish-button").removeClass("active");
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

    self.locations = function(locs) {
        new_pt = null;

        points = [];
        lats = [];
        lons = [];
        places = [];
        $.each(locs, function(i, loc) {
           points.push([loc.lon, loc.lat]);
           lats.push(loc.lat);
           lons.push(loc.lon);
           places.push(loc.name);
        });

        // redraw the mesh with new locations
        update();

        return self;
    };

    self.refresh = function() {
        update();
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