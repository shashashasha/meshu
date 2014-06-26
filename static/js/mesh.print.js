var sb = sb || {};

sb.mesh.print = function (frame, map, width, height) {
    var self = sb.mesh.base(frame, map, width, height),
        selfId = parseInt(Math.random() * 10000000000, 10);

    // the name of the product line
    self.name = 'print';

    // making this not global ._.
    var lats = [],
        lons = [],
        places = [],
        modes = [];

    var decoder = document.createElement('div');

    // main svg
    var main = d3.select(frame || "body").append("div")
        .attr("id", selfId)
        .style("width", width)
        .style("height", height)
        .style("position", "absolute")
        .style("z-index", "1")
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
        .attr("style", "position:absolute;z-index:2;")
        .style("width", width)
        .style("height", height);

    var svg = uiFrame.append("svg:svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var ui = svg.append("svg:g")
        .attr("id", "delaunay-ui");

    var placeList = d3.select("#places");
    var placeTitle = placeList.select("#place-title").attr("class", "inactive");
        placeTitle.append("span").attr("class", "title-text");
        placeTitle.append("span").attr("class", "title-edit").html("edit");

    var list = placeList.append("ul");

    if (!$("body").hasClass("firefox"))
        $(".place-text input").live("blur", self.removeInput);

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
        dragging[0] = loc[0];
        dragging[1] = loc[1];

        var index = points.indexOf(dragging);
        lons[index] = loc[0];
        lats[index] = loc[1];

        /*
            the point was dragged
            so our bounds for this shape may not be correct anymore
        */
        self.dirty = true;
    
        update();
    });

    var projection = d3.geo.mercator().scale(1).translate([0, 0]);
    var mapPath = d3.geo.path().projection(projection);
        
    $.getJSON('/static/lib/world_borders.json', function(json) {
        // console.log(json)
        updateProjection();

        var countries = d3.select(".map").selectAll("path").data(json.features);
        countries.enter().append("path").attr("d",mapPath)
        .attr("class",function(d){
            return d.properties.ISO2;
        });
    });

    self.highlightCountry = function(countryCode){
        var c = d3.select(".map").selectAll("path")
            .filter(function(d){
                return d.properties.ISO2 == countryCode;
            }).classed("current",true)
            .each(function(){
                this.parentNode.appendChild(this);
            });
    }

    function updateProjection(){
        width = height = 600;
        projection.scale(1).translate([0, 0]);
        var e = map.getExtent(),

        // dumb thing where polymaps sets an extent outside of lat/lon limits
        // but d3 freaks out. so clamping from the polymaps extent

        b = [projection([Math.max(e[0].lon,-180), Math.max(e[0].lat,-90)]), 
             projection([Math.min(e[1].lon,180), Math.min(e[1].lat,90)])],

        s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

        projection.scale(s).translate(t);
        d3.select(".map").selectAll("path").attr("d",mapPath);
    }

    // location on the map
    self.on("clickedMap", function(loc) {
        self.add(loc[1], loc[0], undefined, false);
    });

    // point being clicked
    // self.on("clickedPoint", function(pt) {
    //     var index = points.indexOf(pt);
    //     self.remove(index);

    //     map.updateBounds(lats, lons);
    //     self.updatePixelBounds();

    //     /*
    //         the map was updated
    //         so our bounds aren't dirty
    //     */
    //     self.dirty = false;
    //     update();
    // });

    self.on("removed", function() {
        if (points.length < 3) $("#finish-button").removeClass("active");
        if (points.length == 1) $("#meshu-container").addClass("inactive");
    });

    self.on("interactiveToggled", function(bool) {
        self.updateCircleBehavior(bool);
    });

    function updateMesh(skipAnimation) {
        var circles = ui.selectAll("circle");
        circles.attr("cx", function(d) {
                return projection(d)[0];
            })
            .attr("cy", function(d) {
                return projection(d)[1];
            });
        var linePairs = [];
        $.each(points,function(i,v){
            if (i == points.length-1) return;
            linePairs.push(
            {
                "points" : [points[i], points[i+1]],
                "mode" : modes[i]
            });
        })
        // the delaunay mesh paths
        var lines = g.selectAll("path")
            // .data(d3.geom.delaunay(points));
            .data(linePairs);

        var radiusScale = d3.scale.linear().domain([0,600]).range([.5,.65]);

        lines.enter().append("svg:path");
        lines.exit().remove();
        lines.attr("d", function(d) {
                var l = d.points.length;
                var draw = [];
                for (var i = 0; i < l; i++){
                    // var loc = {
                    //     lat: parseFloat(d.points[i][1]),
                    //     lon: parseFloat(d.points[i][0])
                    // };
                    // var pt = map.l2p(loc);
                    // draw.push([pt.x, pt.y]);
                    var pt = projection(d.points[i]);
                    draw.push(pt);
                } 
                // return "M" + draw.join("L") + "Z"; 
                var pathObject = this;

                if (d.mode == "air") {
                    var dist = Math.sqrt(Math.pow(draw[0][0] - draw[1][0],2) + Math.pow(draw[0][1] - draw[1][1],2));
                    return "M" + draw[0] + " A "+dist*radiusScale(dist)+" "+dist*radiusScale(dist)+" 0 0 0 " + draw[1];
                }
                else if (d.mode == "road"){
                    var base = "http://open.mapquestapi.com/directions/v1/route?generalize=10&outFormat=json&shapeFormat=raw&generalize=200&from=";
                    var url = base + d.points[0][1]+","+d.points[0][0]+"&to="+d.points[1][1]+","+d.points[1][0]+"&key="+mapquestapi;

                    $.ajax({
                        url: url,
                        dataType: 'jsonp',
                        success: function(data) {
                            var wayPoints = data.route.shape.shapePoints;

                            var drawI = [];
                            var lI = wayPoints.length;
                            for (var i = 0; i < lI; i+=2){
                                var pt = projection([wayPoints[i+1],wayPoints[i]]);
                                drawI.push(pt);
                            }
                            var pathLines =  "M" + drawI.join("L");
                            d3.select(pathObject).attr("d",pathLines);
                        }
                    });
                }
                else
                    return "M" + draw[0] + " L" + draw[1];
            }).attr("class",function(d){
                return d.mode;
            });
        /*

        Code for the roadtrip meshu stuff, in case we want to bring that in

        function showRoutes() {
            g.selectAll("path").each(function(d){
                var line = d3.select(this);
                var pairKey = d.from[0]+"-"+d.to[1];
                if (pairKey in routes) {
                    line.attr("d",makeRoute(routes[pairKey])).classed("straight",false);
                } else  {
                    $.ajax({
                        url: "http://open.mapquestapi.com/directions/v1/route?generalize=10&outFormat=json&shapeFormat=raw&generalize=200&from="+
                        d.from[1]+","+d.from[0]+"&to="+d.to[1]+","+d.to[0],
                        // cache: false,
                        dataType: 'jsonp',
                        success: function(data) {
                            var wayPoints = data.route.shape.shapePoints;
                            routes[pairKey] = wayPoints;

                            line.attr("d",makeRoute(wayPoints)).classed("straight",false);
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
        */

        // we move the newest point closer and closer to its destination
        // if (new_pt && skipAnimation == true) {
        //     clearInterval(updateInterval);
        //     new_pt = null;
        // }
        // else if (new_pt) {
        //     var last = points[points.length-1] || [];
        //     if (Math.abs(last[0] - new_pt[0]) > .0002) {
        //         last[0] += (new_pt[0] - last[0]) / 3;
        //     }    
        //     if (Math.abs(last[1] - new_pt[1]) > .0002) {
        //         last[1] += (new_pt[1] - last[1]) / 3;
        //     }    

        //     points[points.length - 1] = last;
            
        //     var dlon = Math.abs(last[0] - new_pt[0]);
        //     var dlat = Math.abs(last[1] - new_pt[1]);
        //     if (dlat < .0002 && dlon < .0002) {
        //         clearInterval(updateInterval);
        //         new_pt = null;
        //     }
        // } else {
            clearInterval(updateInterval);
        // }
    }

    self.updatePixelBounds = function() {
        if (lats.length && lons.length) {
            pixel_bounds = [projection([d3.min(lats),d3.min(lons)]),
                            projection([d3.max(lats),d3.min(lons)]),
                            projection([d3.max(lats),d3.max(lons)]),
                            projection([d3.min(lats),d3.max(lons)]),
                            ];
        }
        else { 
            pixel_bounds = [];
        }
    };

    function update(){
        updateProjection();
        // the transparent circles that serve as ui, allowing for dragging and deleting
        var circles = ui.selectAll("circle")
            .data(points);

        // new circles
        circles.enter()
            .append("svg:circle")
            .attr("id",function(d, i){ return "c-" + i; })
            .attr("r", 4)
            .on("mousedown", function(d) {
                self.dragging = d;

                // stop prop to prevent map dragging
                d3.event.stopPropagation();
            });
        
        circles.exit().remove();

        // place names for the points
        var names = list.selectAll("li.place")
            .data(points);
        
        var place = names.enter().append("li").attr("class", "place").attr("id", function(d, i) { return "p-" + i; });
            var mode = place.append("span").attr("class", "mode");
                mode.append("span").attr("class", "air").html("&#x2708;");
                mode.append("span").attr("class", "rail").html("rail");
                mode.append("span").attr("class", "road").html("car");

            mode.selectAll("span").on("click",function(d,i){
                var index = $(this.parentNode.parentNode).index() - 1,
                m = d3.select(this).attr("class");
                modes[index] = m;
                updateMesh();

                // var c = svg.select(this).attr("class");
                // svg.select(g.selectAll(path))
            });
            place.append("span").attr("class", "place-text")
                .html(function(d, i) {
                    decoder.innerHTML = places[i];
                    return decoder.firstChild.nodeValue;
                });
            place.append("span").attr("class", "place-delete").html("x");

        names.exit().remove();

        names.each(function(d) { d.edit = false; })
            .select(".place-text")
            .html(function(d) {
                // decode the text
                // http://stackoverflow.com/questions/3700326/decode-amp-back-to-in-javascript
                var i = $(this).parent().attr("id").split("-")[1];
                decoder.innerHTML = places[i];
                return decoder.firstChild.nodeValue;
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
                
                var p = projection(d); //map.l2p({ lat: d[1], lon: d[0] });
                var w = placeHover.width();
                var top = (p[1] - 32) + "px";
                var left = (p[0] - (w/2) - 3) + "px";
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
            // var node = $(this).parent();
            // if (!d.edit) self.editText(node,i,"place");
            // else self.saveText(node,i,"place");
            // d.edit = !d.edit;
            points[i].air = !points[i].air;
            update();
        });
        // names.select(".place-text").on("click",function(d,i){
        //     if (d.edit) return;
        //     self.editText($(this).parent(),i,"place");
        //     d.edit = !d.edit;
        // });
        $( "#places ul" ).sortable({ axis:"y", cursor:"move"});
        $( "#places ul" ).disableSelection();
        $(".place-text").mouseup(function(){
            var dataNew = [];
            setTimeout(function(){
                $("#places li").each(function(e,i){
                    d3.select(this).each(function(d){
                        dataNew.push(d);
                    })  
                });
                points = dataNew;
                update(true);
            },100);
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
        map.updateBounds(lats, lons);

        if (placename == undefined)
            places.push(latitude.toFixed(3)+", "+longitude.toFixed(3));
        else
            places.push(placename);

        if (points.length) {
            $("#meshu-container").removeClass("inactive");
            
            new_pt = [lon, lat];
            modes.push("air");
            if (skipAnimation) {
                points.push([new_pt[0], new_pt[1]]);

                self.updatePixelBounds();
                update();
                updateMesh(skipAnimation);
            } else { 
                // make the new point start from the last location
                var last = points[points.length-1];
                // points.push([last[0], last[1]]);
                points.push([new_pt[0], new_pt[1]]);
                self.updatePixelBounds();
                update();

                // animate the new point in place
                // updateInterval = setInterval(updateMesh, 40);
            }
        } else {
            points.push([lon, lat]);
            update();
        }
        

        /*
            we've added a point but haven't updated the bounds
        */
        self.dirty = true;
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
    self.bakeStyles = function() {
        hidden.style("display", "none");
    };

    self.unBakeStyles = function() {
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

    self.getProjection = function(point){
        return projection.invert(point);
    }

    return self;
};