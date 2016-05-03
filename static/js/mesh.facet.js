var sb = sb || {};

sb.mesh.facet = function (frame, map, width, height) {
    var self = sb.mesh.base(frame, map, width, height),
        selfId = parseInt(Math.random() * 10000000000, 10);

    // the name of the product line
    self.name = 'facet';

    // making this not global ._.
    var lats = [],
        lons = [],
        places = [],
        bbox = null,
        longestRotationAngle = null,
        cachedPoints = {};

    var decoder = document.createElement('div');

    // main svg
    var main = d3.select(frame || "body").append("div")
        .attr("id", selfId)
        .style("width", width)
        .style("height", height)
        .style("position", "absolute")
        .style("z-index", "1")
        .append("svg")
        .attr("class", "meshu-svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var g = main.append("g")
            .attr("class", "delaunay")
            .attr("transform", "translate(0,0) scale(1) rotate(0,300,300)")
            .attr("fill","none") // needed for rasterizer.js
            .attr("stroke-width","5")
            .attr("stroke","black")
            .attr("stroke-linejoin","round");

    // var hidden = main.append("g")
    //              .attr("class", "hidden");

    // hidden.append("path");

    var uiFrame = d3.select(frame || "body").append("div")
        .attr("style", "position:absolute;z-index:2;")
        .style("width", width)
        .style("height", height);

    var svg = uiFrame.append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var ui = svg.append("g")
        .attr("id", "delaunay-ui");

    var placeList = d3.select("#places");

    var list = placeList.append("ul");

    if (!$("body").hasClass("firefox"))
        $(".place-text input").on("blur", self.removeInput);

    var points = [],
        new_pt = [],
        pixel_bounds = [],
        updateInterval = 0,
        meshuTitle = null;

    var content = $("#content");

    self.hittest = function(target) {
        return d3.event.target != svg.node();
    };

    // update on map drag
    self.on("draggedMap", function() {
        update();
    });

    // point being dragged, location being dragged to
    self.on("draggedPoint", function(dragging, loc) {
        dragging[0] = loc.lon;
        dragging[1] = loc.lat;

        var index = points.indexOf(dragging);
        lats[index] = loc.lat;
        lons[index] = loc.lon;

        /*
            the point was dragged
            so our bounds for this shape may not be correct anymore
        */
        self.dirty = true;
        bbox = null;
        longestRotationAngle = null;
        cachedPoints = {};

        update();
    });

    // location on the map
    self.on("clickedMap", function(loc) {
        self.add(loc.lat, loc.lon, undefined, false);
    });

    // point being clicked
    // self.on("clickedPoint", function(pt) {
    //     // not updating the map when removing points anymore
    //     var index = points.indexOf(pt);
    //     self.remove(index);
    //     self.refresh();
    // });

    self.on("removed", function() {
        if (points.length < 3) $("#scroll-down").fadeIn();
        if (points.length == 1) $("#meshu-container").addClass("inactive");
    });

    self.on("interactiveToggled", function(bool) {
        self.updateCircleBehavior(bool);
    });

    /*
        get the points furthest away from each other in a mesh
    */
    var furthestPoints = function() {
        var max = 0,
            pair = [];

        if (points.length < 2) return;

        // find the furthest points
        for (var i = 0; i < points.length; i++) {
            var pi = map.l2p({ lat: points[i][1], lon: points[i][0] });

            for (var j = i + 1; j < points.length; j++) {
                var pj = map.l2p({ lat: points[j][1], lon: points[j][0] });
                var dx = pi.x - pj.x;
                var dy = pi.y - pj.y;

                var dist = Math.sqrt((dx * dx) + (dy * dy));
                if (dist > max) {
                    max = dist;

                    // rotate the least from the top point
                    if (pj.y > pi.y)
                        pair = [pj, pi];
                    else
                        pair = [pi, pj];
                }
            }
        }

        return pair;
    };

    /*
        angle between two points in degrees
    */
    var lineAngle = function(p1, p2) {
        var dpy = p2.y - p1.y,
            dpx = p2.x - p1.x;

        return Math.atan2(dpy, dpx) * (180 / Math.PI);
    };

    var distance = function(p1, p2) {
        var dpy = p2.y - p1.y,
            dpx = p2.x - p1.x;

        return Math.sqrt((dpx * dpx) + (dpy * dpy));
    };

    var globalize = function(pt, element) {
        var transform = element.getTransformToElement(element.ownerSVGElement);
        return pt.matrixTransform(transform);
    };

    self.getRotationAngle = function(offset) {
        offset = offset || 0;
        if (points.length < 2) return;
        if (longestRotationAngle) return longestRotationAngle + offset;

        var pair = furthestPoints(map, points),
            angle = lineAngle(pair[0], pair[1]);

        if (Math.abs(angle) < 30)
            longestRotationAngle = -angle;
        else
            longestRotationAngle = -angle + 180;
        return longestRotationAngle + offset;
    };

    // cache it so we don't iterate over all the points all the time
    self.getLongestRotation = function(offset) {
        angle = self.getRotationAngle();
        offset = offset || 0;

        return "rotate(" + [angle + offset, 300, 300].join(',') + ") ";
    };

    self.projectPoints = function(transform) {
        if (cachedPoints.transform == transform) {
            return cachedPoints;
        }

        d3.select("#delaunay-ui").attr("transform", transform);

        /*
            new strategy:
            draw a projected delaunay triangulation for the ring preview.
            get the global points from the circles after they've been rotated,
            then use that to find the rotated "bbox", then use that to scale
            into our destination ring-preview-delaunay-container
        */
        var projectedPts = [],
            xvalues = [],
            yvalues = [];
        var circle = d3.selectAll("#delaunay-ui circle").each(function(e, k) {
            var pt = this.ownerSVGElement.createSVGPoint(),
                mapPt = map.l2p({lat: lats[k], lon: lons[k]});

            pt.x = mapPt.x;
            pt.y = mapPt.y;

            var g = globalize(pt, this);
            xvalues.push(g.x);
            yvalues.push(g.y);
            projectedPts.push([g.x, g.y]);
        });

        // revert circles
        d3.select("#delaunay-ui").attr("transform", "translate(0,0) scale(1) rotate(0,300,300)");

        var t_bbox = d3.min(yvalues),
            l_bbox = d3.min(xvalues),
            r_bbox = d3.max(xvalues),
            b_bbox = d3.max(yvalues);

        cachedPoints = {
            pts: projectedPts,
            transform: transform,
            top: t_bbox,
            left: l_bbox,
            right: r_bbox,
            bottom: b_bbox,
            width: r_bbox - l_bbox,
            height: b_bbox - t_bbox
        };

        return cachedPoints;
    };

    self.transformedDelaunay = function(projected, projWidth, projHeight, buffer) {
        buffer = buffer || 0;

        var bbox = projected,
            scaleWidth = projWidth / bbox.width,
            scaleHeight = projHeight / bbox.height;

        var lines = g.selectAll("path")
            .data(d3.geom.delaunay(projected.pts));

        lines.enter().append("path");
        lines.exit().remove();
        lines.attr("stroke-width", 20)
            .attr("fill", "none")
            .attr("d", function(d) {
            var l = d.length;
            var draw = [];
            for (var i = 0; i < l; i++){
                var px = (d[i][0] - bbox.left) * scaleWidth,
                    py = ((d[i][1] - bbox.top) * scaleHeight) + buffer;
                draw.push([px, py]);
            }

            return "M" + draw.join(" L") + "Z";
        });
    };

    function updateMesh(skipAnimation) {
        var circles = ui.selectAll("circle");
        circles.attr("cx", function(d) {
                return map.l2p({
                    lat: parseFloat(d[1]),
                    lon: parseFloat(d[0])
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

        lines.enter().append("path");
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
        if (new_pt && skipAnimation == true) {
            clearInterval(updateInterval);
            new_pt = null;
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
                clearInterval(updateInterval);
                new_pt = null;
            }
        } else {
            clearInterval(updateInterval);
        }
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
    };

    function update(){
        // the transparent circles that serve as ui, allowing for dragging and deleting
        var circles = ui.selectAll("circle")
            .data(points);

        // new circles
        circles.enter()
            .append("circle")
            .attr("id",function(d, i){ return "c-" + i; })
            .attr("r", 10)
            .on("mousedown", function(d) {
                self.dragging = d;

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

        // placeTitle.data(points)
        //     .each(function(d){ d.edit = false; });

        // var rotate_pts = hidden.selectAll("circle.rotation").data(pixel_bounds);
        // rotate_pts.enter()
        //     .append("circle")
        //     .attr("class","rotation")
        //     .attr("r","40")
        //     .attr("cx", function(d, i) {
        //         return d.x;
        //     }).attr("cy", function(d, i) {
        //         return d.y;
        //     });

        // rotate_pts.exit().remove();
        // rotate_pts.attr("cx", function(d, i) {
        //         return d.x;
        //     }).attr("cy", function(d, i) {
        //         return d.y;
        //     });
        // var bounding_box = hidden.select("path");
        // bounding_box.attr("d", function() {
        //     if (pixel_bounds.length == 0) return;
        //     var draw = [];
        //     $.each(pixel_bounds, function(i, p) {
        //         draw.push([p.x,p.y]);
        //     });
        //     return "M" + draw.join("L") + "Z";
        // }).attr("class","hiddenFrame")

        self.updateCircleBehavior();
        updateListBehavior();
        updateMesh();
    };

    self.updateCircleBehavior = function(off) {
        var viewMode = content.hasClass("view");
        var placeHover = $("#place-hover");
        var circles = ui.selectAll("circle");

        circles.on("mouseover", function(d, i) {
            if (off) return;
            else if (viewMode) {
                placeHover.addClass("active").find("span").text(places[i]);

                var p = map.l2p({ lat: d[1], lon: d[0] });
                var w = placeHover.width();
                var top = (p.y - 32) + "px";
                var left = (p.x - (w/2) - 3) + "px";
                var bleft = w/2 - 3 + "px";


                placeHover.css({"top": top, "left": left})
                    .find("b").css("left", bleft);
            }
            else
                list.select("#p-" + i).attr("class", "place highlight");
        });
        circles.on("mouseout", function(d, i) {
            if (off) return;
            else if (viewMode)
                placeHover.removeClass("active");
            else
                list.select("#p-"+i).attr("class","place");
        });
    }

    function updateListBehavior() {
        var names = list.selectAll("li.place");
        names.select(".place-delete").on("click",function(d,i){
            // not updating the map when removing points anymore
            self.remove(i);
            self.refresh();
        });

        names.on("mouseover",function(d,i){
            ui.select("#c-"+i).attr("class","highlight");
        });
        names.on("mouseout",function(d,i){
            ui.select("#c-"+i).attr("class","");
        });
        names.select(".place-edit").on("click",function(d,i){
            var node = $(this).parent();
            if (!d.edit) {
                self.editText(node,i,"place");
                self.removeInput();
            } else self.saveText(node,i,"place");
            d.edit = !d.edit;
        });
        names.select(".place-text").on("click",function(d,i){
            if (d.edit) return;
            self.removeInput();
            self.editText($(this).parent(),i,"place");
            d.edit = !d.edit;
        });
    }

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

        if (points.length >= 3) $("#scroll-down").fadeIn();

        /*
            we've added a point but haven't updated the bounds
        */
        self.dirty = true;
        bbox = null;
        longestRotationAngle = null;
        cachedPoints = {};

        self.added();
        return self;
    };

    self.remove = function(index) {
        points.splice(index, 1);
        lats.splice(index, 1);
        lons.splice(index, 1);
        places.splice(index, 1);

        self.dirty = true;
        bbox = null;
        longestRotationAngle = null;
        cachedPoints = {};

        if (points.length < 3) $("#scroll-down").fadeOut();
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
    self.bakeStyles = function() {
        // hidden.style("display", "none");
    };

    self.unBakeStyles = function() {
        // hidden.style("display", "");
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

    self.editText = function(node,i,type) {
        var button = node.find("." + type + "-edit").text("save");
        var field = node.find("." + type + "-text");
        var value = ((type == "title") ? field.text() : places[i]);

        node.addClass("active");
        field.html('<input value="' + value + '">').find("input").focus();
    };
    self.saveText = function(node, i, type) {
        var button = node.find("." + type + "-edit").text("edit");
        var text = node.find("input").val();

        node.removeClass("active");
        node.find("." + type + "-text").text(text);

        if (type == "place") {
            places[i] = text;
        }
        else return text;
    };
    self.removeInput = function(event){
        var titles = d3.select("#places").selectAll("li.place .title");
        titles.each(function(d, i) {
            if (!d.edit) return;
            d.edit = false;
            self.saveText($(this), i, "place");
        });
        return false;
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
        var rotation = sb.rotator ? sb.rotator.getRotation() : 0;
        g.attr("transform","rotate(" + rotation + ",300,300)");

        var rawSVG = $('#' + selfId).html();

        g.attr("transform","rotate(0)");

        return rawSVG;
    };

    return self;
};