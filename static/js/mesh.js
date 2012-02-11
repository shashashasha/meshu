var sb = sb || {};
var lats = [], 
    lons = [],
    places = [];

sb.mesh = function(frame, map, width, height) {
	var self = {},
		selfId = parseInt(Math.random() * 10000000000);

    var main = d3.select(frame || "body").append("div")
        .attr("id", selfId)
        .attr("style", "position:absolute;z-index:100;")
        .append("svg:svg")
        .attr("class","meshu-svg")
        .attr("width", $(frame).width())
        .attr("height", $(frame).height());

    var g = main.append("svg:g")
            .attr("id","delaunay");

    var hidden = main.append("svg:g")
                 .attr("id","hidden");
        hidden.append("svg:path");
    
    var uiFrame = d3.select(frame || "body").append("div")
        .attr("style", "position:absolute;z-index:1337;");

    var svg = uiFrame.append("svg:svg")
        .attr("width", width || "600px")
        .attr("height", height || "600px");

    var ui = svg.append("svg:g")
        .attr("id", "delaunay-ui");

    var placeList = d3.select("#places");
    var placeTitle = placeList.append("h2").attr("class","place-number");
    var list = placeList.append("ul");
                

    var points = [],
    	new_pt = [],
        pixel_bounds = {},
    	updateInterval = 0,
        selected = null,
        moved = false,
        dragging = null;

    d3.select(uiFrame.node())
        .on("mousemove", mousemove)
        .on("mouseup", mouseup);

    function mousemove() {
        if (!$("#content").hasClass("edit")) return;
        if (!dragging) {
            return;
        }

        var m = d3.svg.mouse(main.node());
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

        moved = true;
    }

    function mouseup() {
        if (!$("#content").hasClass("edit")) return;

        if (!dragging) {
            var m = d3.svg.mouse(main.node());
            var loc = map.p2l({
                x: m[0],
                y: m[1]
            });

            self.add(loc.lat, loc.lon);
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

        if (d3.event) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
        }

        moved = false;
        dragging = null;
    }

    self.updatePixelBounds = function(){
        pixel_bounds = [map.l2p({ lat: d3.min(lats), lon: d3.min(lons) }),
                            map.l2p({ lat: d3.max(lats), lon: d3.min(lons) }),
                            map.l2p({ lat: d3.max(lats), lon: d3.max(lons) }),
                            map.l2p({ lat: d3.min(lats), lon: d3.max(lons) })];
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
            var last = points[points.length-1];
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

        circles.enter()
                .append("svg:circle")
                .attr("id",function(d,i){ return "c-"+i; })
                .attr("r", 7)
                .on("mousedown", function(d) {
                    selected = dragging = d;
                });
        
        circles.exit().remove();

        circles.on("mouseover",function(d,i){
            list.select("#p-"+i).attr("class","place highlight");
        });
        circles.on("mouseout",function(d,i){
            list.select("#p-"+i).attr("class","place");
        });

        // place names for the points
        var names = list.selectAll("li.place")
            .data(points);
        
        var place = names.enter().append("li").attr("class","place");
            place.append("span").attr("class","name");
            place.append("span").attr("class","delete-place").html("x");
            place.append("span").attr("class","edit-place").html("edit");
        names.exit().remove();

        names.attr("id",function(d,i){ return "p-"+i; })
            .select(".name")
            .text(function(d,i){
                d.edit = false;
                return places[i];   
            });

        var rotate_pts = hidden.selectAll("circle.hidden").data(pixel_bounds);
        rotate_pts.enter().append("svg:circle").attr("class","hidden").attr("r","20");
        rotate_pts.attr("cx",function(d,i){
                return d.x;
            }).attr("cy",function(d,i){
                return d.y;
            });
        var bounding_box = hidden.select("path");
        bounding_box.attr("d",function(){
            if (!pixel_bounds.length) return;
            var draw = [];
            $.each(pixel_bounds, function(i,p){
                draw.push([p.x,p.y]);
            })
            return "M" + draw.join("L") + "Z"; 
        })

        updateListBehavior();
        updateMesh();
    };

    function updateListBehavior() {
        var names = list.selectAll("li.place");
        names.select(".delete-place").on("click",function(d,i){
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
        names.select(".edit-place").on("click",function(d,i){
            var button = $(this).text(d.edit ? "edit" : "save");
            d.edit = !d.edit;
            var field = button.parent().find(".name");
            if (d.edit) {
                field.html('<input value="'+places[i]+'">');
                field.find("input").focus();
                field.keypress(function(event) {
                    if ( event.which == 13 ) {
                        d.edit = !d.edit;
                        saveText();
                        button.text("edit");
                    }
                });
            } else saveText();

            function saveText() {
                var text = field.find("input").val();
                field.text(text);
                places[i] = text;
            }
        });

        var nameList = $("#places ul")
        if (nameList.height() > 345){
            nameList.css("overflow-y","scroll");
        } else nameList.css("overflow-y","auto");

        placeTitle.text(function(){
            if (places.length == 0) return "";
            else {
                var multiple = places.length > 1;
                return places.length + " Place" + (multiple ? "s " : " " ) + "Added";
            }
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

        if (points.length > 3) $("#finish-button").addClass("active");
        else $("#finish-button").removeClass("active");

        return self;
    };

    self.remove = function(index) {     
        points.splice(index, 1);
        lats.splice(index, 1);
        lons.splice(index, 1);
        places.splice(index, 1);
        if (points.length < 4) $(".finish").removeClass("active");
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

    // outputs svg data
    self.output = function() {
    	return $('#' + selfId).html();
    };

	return self;
};