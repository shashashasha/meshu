var sb = sb || {};

var processing_page = $("body").hasClass("processing");

sb.mesh.orbit = function (frame, map, width, height) {
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
            .data(projected.pts);

        var anchor = projected.pts[0];

        var arc = d3.svg.arc()
            .innerRadius(function(d){ return d[2]; })
            .outerRadius(function(d){ return d[2]+4; })
            .startAngle(0) //converting from degs to radians
            .endAngle(Math.PI*2);

        lines.enter().append("path");
        lines.exit().remove();
        lines.attr("stroke-width", 20)
            .attr("fill", "none")
            .attr("transform", function(d) {
                var s = [(anchor[0] - bbox.left) * scaleWidth, ((anchor[1] - bbox.top) * scaleHeight) + buffer],
                    e = [(d[0] - bbox.left) * scaleWidth, ((d[1] - bbox.top) * scaleHeight) + buffer];
                d[2] = Math.sqrt(Math.pow(e[0]-s[0],2) + Math.pow(e[1]-s[1],2))/2;
                return "translate("+(e[0] + (s[0]-e[0])/2)+","+(e[1] + (s[1]-e[1])/2)+")";
        }).attr("d", arc);
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
        
        var anchor = points[0];
        var lines = g.selectAll("path")
            .data(points);

        var arc = d3.svg.arc()
            .innerRadius(function(d){ return d[2]-2; })
            .outerRadius(function(d){ return d[2]+2; })
            .startAngle(0) //converting from degs to radians
            .endAngle(Math.PI*2);

        lines.enter().append("path");
        lines.exit().remove();
        lines.attr("transform",function(d){
                var s = map.l2p({lat: d[1], lon: d[0]}),
                    e = map.l2p({lat: anchor[1], lon: anchor[0]});
                d[2] = Math.sqrt(Math.pow(e.x-s.x,2) + Math.pow(e.y-s.y,2))/2;
                return "translate("+(e.x + (s.x-e.x)/2)+","+(e.y + (s.y-e.y)/2)+")";
            }).attr("d", arc);

             // clearInterval(updateInterval);
        if (new_pt && skipAnimation == true) {
            clearInterval(updateInterval);
            new_pt = null;
        }
        else if (new_pt) {
            // var last = points[points.length-1] || [];
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
        // var title = place.append("span").attr("class", "title");
            place.append("span").attr("class", "place-text")
                .html(function(d, i) {
                    decoder.innerHTML = places[i];
                    return decoder.firstChild.nodeValue;
                });
            // title.append("span").attr("class", "place-edit").html("edit");
            place.append("span").attr("class", "place-delete").html("x");

        names.exit().remove();

        names.attr("id", function(d, i) { return "p-" + i; })
            // .select(".title").each(function(d) { d.edit = false; })
            // .attr("class","title")
            .select(".place-text")
            .text(function(d, i) {
                // decode the text
                // http://stackoverflow.com/questions/3700326/decode-amp-back-to-in-javascript
                decoder.innerHTML = places[i];
                return decoder.firstChild.nodeValue;
            });

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

        var tempIndex = 0;
        if (!processing_page) {
            $( "#places ul" ).sortable({ 
                axis:"y", 
                cursor:"move",
                start: function(event, ui) {
                    tempIndex = ui.item.index();
                },
                stop: function(event, ui) {
                    var newIndex = ui.item.index();
                    if (tempIndex == newIndex) return;

                    places.splice(newIndex, 0, places.splice(tempIndex, 1)[0]);
                    points.splice(newIndex, 0, points.splice(tempIndex, 1)[0]);
                    lats.splice(newIndex, 0, lats.splice(tempIndex, 1)[0]);
                    lons.splice(newIndex, 0, lons.splice(tempIndex, 1)[0]);
                    tempIndex = 0;
                    update();
                }
            });
            $( "#places ul" ).disableSelection();
        }
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
                // var last = points[points.length-1];
                var last = points[0];
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