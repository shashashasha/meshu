var sb = sb || {};

sb.mesh.print = function (frame, map, width, height) {
    var self = sb.mesh.base(frame, map, width, height),
        selfId = parseInt(Math.random() * 10000000000, 10);

    // the name of the product line
    self.name = 'print';
    var processing_page = $("body").hasClass("processing");

    // making this not global ._.
    var lats = [],
        lons = [],
        places = [],
        countries = [],
        roadData = [],
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

    var uiFrame = d3.select(frame || "body").append("div")
        .attr("style", "position:absolute;z-index:2;")
        .style("width", width)
        .style("height", height);

    var svg = uiFrame.append("svg:svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var ui = svg.append("svg:g")
        .attr("class", "delaunay-ui");

    var placeList = d3.select("#places");

    var list = placeList.append("ul");

    if (!$("body").hasClass("firefox"))
        $(".place-text input").live("blur", self.removeInput);

    $(frame).append($("<div>").attr("class","route-error").text("Sorry, no route found! Try another mode?"));

    var points = [],
        new_pt = [],
        pixel_bounds = [],
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
    var features;

    $.getJSON('/static/lib/world_borders.json', function(json) {
        updateProjection(parseInt(width),parseInt(height));

        features = json.features;

        var countryPaths = d3.select(".map").selectAll("path").data(json.features);
        countryPaths.enter().append("path").attr("d",mapPath)
        .attr("class",function(d){
            return d.properties.ISO2;
        }).style("fill","#bbb").style("stroke","#aaa").style("stroke-width","0");

        if (loadedMeshu) {
            countries.forEach(function(e,i) {
                highlightCountry(e, true);
            });
            $("#"+self.style().projection).click();
            $(".map-style").find("li[data-color="+self.style().mapStyle+"]").click();
            $(".dot-style").find("li[data-color="+self.style().dotColor+"]").click();
            $(".country-style").find("li[data-color="+self.style().countryStyle+"]").click();
        } else {
            self.style({
                mapStyle:"light",
                dotColor:"FF3FB4",
                countryStyle:"on"
            });
        }
        if (processing_page) {
            self.copyMap();
            mesh.applyStyle(loadedMeshu.metadata);
            applyProjection(self.style().projection, self.style().zoom, self.style().translate);
            colorMap("meshu-container");
            colorDots("meshu-container");
        }
    });

    self.copyMap = function() {
        var svg = $(".projection-preview").empty();

        var mapSVG = $(".map").clone();
        var lines = $(".delaunay").clone();
        var circles = $(".delaunay-ui").clone();

        if (processing_page) {
            $(".delaunay").remove();
            $(".delaunay-ui").remove();
        }

        mapSVG.find("rect").remove();

        var newMapSVG = d3.select(mapSVG).node()[0];

        var copySVG = d3.selectAll(".projection-preview");

        var defs = copySVG.append("defs");

        defs.append("path")
            .datum({type: "Sphere"})
            .attr("id", "sphere-" + selfId);

        defs.append("clipPath")
            .attr("id", "clip")
          .append("use")
            .attr("xlink:href", "#sphere-" + selfId);

        copySVG.append("g")
            .attr("class", "projection-clip")
          .append("use")
            .attr("class", "fill")
            .attr("xlink:href", "#sphere-" + selfId);

        var m = d3.selectAll(".projection-preview")
            .append("g").attr("class","map");

        svg.find(".map").html(newMapSVG);

        svg.append(lines);
        svg.append(circles);

        copySVG.selectAll("circle").attr("r", 2);

        var p = "zoomed-to-fit";
        $(".proj").each(function(){
            if ($(this).hasClass("selected"))
                p = $(this).attr("id");
        });
        applyProjection(p);
    };

    function applyProjection(proj, scale, translate) {

        var copyProjection, 
            pW = processing_page ? parseInt(width) : 575, 
            pH = processing_page ? parseInt(height) : 425;

        switch (proj) {
            case 'mercator':
                copyProjection = d3.geo.mercator().scale(pW/6.25).translate([pW/2,pH/2]);
                break;
            case 'hammer':
                copyProjection = d3.geo.hammer().scale(pW/6).translate([pW/2,pH/2]);
                break;
            case 'august':
                copyProjection = d3.geo.august().scale(pW/11.5).translate([pW/2,pH/2]);
                break;
            case 'lagrange':
                copyProjection = d3.geo.lagrange().scale(pW/5.57).translate([pW/2,pH/2]);
                break;
            case 'eckert1':
                copyProjection = d3.geo.eckert1().scale(pW/6).translate([pW/2,pH/2]);
                break;
            case 'butterfly':
                copyProjection = d3.geo.polyhedron.butterfly().scale(pW/8.45).translate([pW/2,5*pH/7]);
                break;
            case 'zoomed-to-fit':
                updateProjection(pW, pH, .8);
                copyProjection = projection;
                break;
        }

        var copySVG = d3.selectAll(".projection-preview")
            .attr("class","projection-preview meshu-svg").classed(proj, true);

        copySVG.style("background-color",(proj == "zoomed-to-fit") ? "#e7e7e7" : "#bbb");

        var radius = processing_page ? parseInt(width)/350 : ((proj == 'zoomed-to-fit') ? 3 : 2.5);
        copySVG.selectAll("circle").attr("r",radius);

        var strokeWidth = processing_page ? parseInt(width)/2500 : 1;

        var copyPath = d3.geo.path().projection(copyProjection);
        var lines = copySVG.select(".map")
            .selectAll("path").data(features)
            .attr("clip-path", "url(#clip)")
            .attr("d",copyPath)
            .attr("class",function(d){
                var current = d3.select("#meshu-container")
                    .select("."+d.properties.ISO2).classed("current");

                d3.select(this)
                    .style("fill", current ? "white" : "#bbb")
                    .style("stroke-width", current ? strokeWidth : "0");

                return current ? (d.properties.ISO2 + " current") : d.properties.ISO2;
            });
        d3.selectAll(".projection-preview #sphere-" + selfId).attr("d",copyPath);
        updateMesh("projection", copyProjection);
        updateMesh("design", copyProjection);

        if (processing_page) {
            projection = copyProjection;
            updateMesh("meshu-container", projection);
        }

        self.style({
            projection:proj,
            scale:copyProjection.scale(),
            translate:copyProjection.translate()
        });

        colorMap("design");
        colorDots("design");
    }

    $(".proj").click(function(){
        $(".proj").removeClass("selected");
        $(this).addClass("selected");

        var proj = $(this).attr("id");
        applyProjection(proj);
    });

    $(".map-style li").click(function(){
        var style = $(this).attr("data-color");
        self.style({ mapStyle:style });

        $(this).parent().find("li").removeClass("selected");
        $(this).addClass("selected");
        colorMap("design");
    });

    $(".dot-style li").click(function(){
        var color = $(this).attr("data-color");
        $(this).parent().find("li").removeClass("selected");
        $(this).addClass("selected");
        self.style({ dotColor:color });
        colorDots("design");
    });

    $(".country-style li").click(function(){
        var highlight = $(this).attr("data-color");
        self.style({ countryStyle:highlight });

        $(this).parent().find("li").removeClass("selected");
        $(this).addClass("selected");
        colorMap("design");
    });

    $(".frame-wrapper").click(function(){
        if ($(this).attr("id").split("-")[1] != sb.materializer.product()) return;

        if ($(this).hasClass("selected")){
            sb.materializer.material("unframed");
            sb.ui.orderer.updated();
            $(this).removeClass("selected");
        } else {
            sb.materializer.material("framed");
            $(".frame-wrapper").removeClass("selected");
            $(this).addClass("selected");
            sb.ui.orderer.updated();
        }
    });

    function colorMap(id) {
        var design = d3.select("#"+id+" .projection-preview");
        var lightC, darkC, highlightC, highlightS, stroke;
        var style = self.style().mapStyle,
            highlight = self.style().countryStyle;
        switch (style) {
            case 'light':
                lightC = "#e7e7e7";
                darkC = "#bbb";
                highlightC = "#fff";
                highlightS = "#aaa";
                stroke = "#555";
                break;
            case 'dark':
                lightC = "#222";
                darkC = "#000";
                highlightC = "#333";
                highlightS = "#666";
                stroke = "#aaa";
                break;
            case 'no':
                lightC = "#fff";
                darkC = "#fff";
                highlightC = "#e7e7e7";
                highlightS = "#e7e7e7";
                stroke = "#000";
                break;
        }
        if (self.style().projection == "zoomed-to-fit")
            design.style("background-color",lightC);
        else
            design.style("background-color",darkC);

        design.select(".fill").attr("fill",lightC);
        design.select(".map").selectAll("path").style("fill",darkC).style("stroke","none");
        if (highlight == "on") {
            design.select(".map").selectAll("path")
            .filter(function(d){
                return (countries.indexOf(d.properties.ISO2) != -1);
            }).style("fill", highlightC)
            .style("stroke", highlightS)
            .each(function(){
                this.parentNode.appendChild(this);
            });
        }
        design.select(".delaunay").selectAll("path").style("stroke",stroke);
    }

    function colorDots(id) {
        d3.select("#"+id+" .projection-preview").selectAll("circle")
            .style("fill","#"+self.style().dotColor);
    }

    self.addCountry = function(country) {
        countries.push(country);
        highlightCountry(country, true);
    };

    function highlightCountry(countryCode, flag) {
        var c = d3.select(".map").selectAll("path")
            .filter(function(d){
                //mapquest returns ISO2, mapzen is ISO3
                //diff between clicking and searching for place
                return d.properties.ISO2 == countryCode || d.properties.ISO3 == countryCode;
            }).classed("current",flag)
            .each(function(){
                this.parentNode.appendChild(this);
            }).style("fill", flag ? "white" : "#bbb")
            .style("stroke-width", flag ? "1" : "0");
    };

    function updateProjection(w, h, scale){
        projection.scale(1).translate([0, 0]);

        var e = map.getExtent(),

        // dumb thing where polymaps sets an extent outside of lat/lon limits
        // but d3 freaks out. so clamping from the polymaps extent

        b = [projection([Math.max(e[0].lon,-180), Math.max(e[0].lat,-90)]),
             projection([Math.min(e[1].lon,180), Math.min(e[1].lat,90)])],

        s = Math.min(6000,(scale ? scale : .95) / Math.max((b[1][0] - b[0][0]) / w, (b[1][1] - b[0][1]) / h)),
        t = [(w - s * (b[1][0] + b[0][0])) / 2, (h - s * (b[1][1] + b[0][1])) / 2];

        if (w == 600) {
            if (s < 100) {
                $("#zoomed-to-fit").hide();
                $("#hammer").css("display","inline-block");
            } else {
                $("#zoomed-to-fit").show();
                $("#hammer").hide();
            }

            projection.scale(s).translate(t);
            d3.select("#meshu-container").select(".map").selectAll("path").attr("d",mapPath);
        } else {
            projection.scale(s).translate(t);
            d3.selectAll(".projection-preview").select(".map").selectAll("path").attr("d",mapPath);   
        }
    }

    // location on the map
    self.on("clickedMap", function(loc) {
        meshu.findCountry(loc);
        self.add(loc[1], loc[0], undefined, false);
    });

    self.on("removed", function() {
        if (points.length < 3) $("#finish-button").removeClass("active");
        if (points.length == 1) $("#meshu-container").addClass("inactive");
    });

    function updateMesh(id, proj) {
        var uiGroup = d3.select("#"+id).select(".delaunay-ui");
        var gGroup = d3.select("#"+id).select(".delaunay");

        var circles = uiGroup.selectAll("circle").data(points);
        circles.attr("cx", function(d) {
                return proj(d)[0];
            })
            .attr("cy", function(d) {
                return proj(d)[1];
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
        var lines = gGroup.selectAll("path")
            .data(linePairs);

        var radiusScale = d3.scale.linear().domain([0,2600]).range([.5,.65]);

        lines.enter().append("svg:path");
        lines.exit().remove();
        lines.attr("d", function(d) {
                var l = d.points.length;
                var draw = [];
                for (var i = 0; i < l; i++){
                    var pt = proj(d.points[i]);
                    draw.push(pt);
                }

                var pathObject = this;

                if (d.mode == "air") {
                    var dist = Math.sqrt(Math.pow(draw[0][0] - draw[1][0],2) + Math.pow(draw[0][1] - draw[1][1],2));
                    return "M" + draw[0] + " A "+dist*radiusScale(dist)+" "+dist*radiusScale(dist)+" 0 0 0 " + draw[1];
                }
                else if (d.mode == "road"){
                    var roadPath = null;
                    if (!loadedMeshu) {
                        roadData.forEach(function(e,i){
                            //I'm sorry
                            if (e.points[0][0] == d.points[0][0] && e.points[1][1] == d.points[1][1]) {
                                roadPath = drawRoadPath(e.wayPoints);
                                return;
                            }
                        });
                        if (roadPath == "undefined") return "";
                        else if (roadPath) return roadPath;
                    }

                    var base = "http://open.mapquestapi.com/directions/v1/route?generalize=500&outFormat=json&shapeFormat=raw&generalize=200&from=";
                    var url = base + d.points[0][1]+","+d.points[0][0]+"&to="+d.points[1][1]+","+d.points[1][0]+"&key="+mapquestapi;

                    $.ajax({
                        url: url,
                        dataType: 'jsonp',
                        success: function(data) {
                            var wayPoints = [];
                            if (data.info.statuscode != 0) {
                                $(".route-error").fadeIn().delay(3000).fadeOut('slow');
                                roadData.push({
                                    "points":d.points,
                                    "wayPoints":wayPoints
                                });
                                d3.select(pathObject).attr("d","");
                            } else {
                                wayPoints = data.route.shape.shapePoints;
                                roadData.push({
                                    "points":d.points,
                                    "wayPoints":wayPoints
                                });
                                d3.select(pathObject).attr("d",drawRoadPath(wayPoints));
                            }
                        }
                    });
                }
                else
                    return "M" + draw[0] + " L" + draw[1];

            }).attr("class",function(d){
                return d.mode;
            }).style("stroke","#555")
            .style("stroke-width",function(d){ return getWidth(d.mode); })
            .style("stroke-dasharray",function(d){ return getDash(d.mode); });

            function getWidth(mode) {
                if (processing_page) {
                    var d = parseInt(width);
                    return (d/600);
                }
                if (mode == "air") {
                    if (id == "meshu-container") return 2;
                    return 1.5;
                } else {
                    if (id == "meshu-container") return 3;
                    return 2.5;
                }
            }
            function getDash(mode) {
                if (mode != "air") return;
                if (processing_page) {
                    var d = parseInt(width);
                    return (d/300) + " " + (d/300);
                }
                if (id == "meshu-container") return "4 4";
                return "3 3";
            }

            function drawRoadPath(wayPoints) {
                var drawI = [];
                var lI = wayPoints.length;
                for (var i = 0; i < lI; i+=2){
                    var pt = proj([wayPoints[i+1],wayPoints[i]]);
                    drawI.push(pt);
                }
                var pathLines =  "M" + drawI.join("L");
                return (wayPoints.length == 0) ? "undefined" : pathLines;
            }
    }

    function update(){
        updateProjection(parseInt(width),parseInt(height));
        // the transparent circles that serve as ui, allowing for dragging and deleting
        var circles = ui.selectAll("circle")
            .data(points);

        // new circles
        circles.enter()
            .append("svg:circle")
            .attr("id",function(d, i){ return "c-" + i; })
            .attr("r", 4)
            .attr("fill","#FF3FB4")
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
            mode.append("span").attr("class", "origin").html("Origin:");
            mode.append("span").attr("class", "air selected");
            mode.append("span").attr("class", "rail");
            mode.append("span").attr("class", "road");

        mode.selectAll("span").on("click",function(d,i){
            var index = $(this.parentNode.parentNode).index() - 1,
                m = d3.select(this).attr("class");
            modes[index] = m;
            updateMesh("meshu-container", projection);
            $(this.parentNode).find("span").removeClass("selected");
            $(this).addClass("selected");
        });
        place.append("span").attr("class", "place-text")
            .html(function(d, i) {
                decoder.innerHTML = places[i];
                return decoder.firstChild.nodeValue;
            });
        place.append("span").attr("class", "place-delete").html("x");

        names.exit().remove();

        names.each(function(d) { d.edit = false; })
            .attr("id",function(d,i){ return "p-"+i; })
            .select(".place-text")
            .html(function(d, j) {
                // decode the text
                // http://stackoverflow.com/questions/3700326/decode-amp-back-to-in-javascript
                var i = $(this).parent().attr("id").split("-")[1];
                decoder.innerHTML = places[i];
                return decoder.firstChild.nodeValue;
            });

        names.select(".mode").each(function(d,i){
            if (i == 0) return;

            var modeSet = d3.select(this).selectAll("span");
            modeSet.classed("selected",false);
            modeSet.classed("selected",function(e,j){
                return $(this).attr("class") == modes[i-1];
            });
        });

        updateListBehavior();
        updateMesh("meshu-container", projection);
    };

    function updateListBehavior() {
        var names = list.selectAll("li.place");
        names.select(".place-delete").on("click",function(d,i){
            self.remove(i);
            map.updateBounds(lats, lons);
            update();
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
                    countries.splice(newIndex, 0, countries.splice(tempIndex, 1)[0]);
                    tempIndex = 0;
                }
            });
            $( "#places ul" ).disableSelection();
        }
    }

    self.add = function(latitude, longitude, placename, skipAnimation) {
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

                update();
                updateMesh("meshu-container", projection);
            } else {
                // make the new point start from the last location
                var last = points[points.length-1];
                points.push([new_pt[0], new_pt[1]]);
                update();
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

        var c = countries[index];

        points.splice(index, 1);
        lats.splice(index, 1);
        lons.splice(index, 1);
        places.splice(index, 1);
        countries.splice(index, 1);

        if (index == 0) modes.splice(index, 1);
        else modes.splice(index-1,1);

        if (countries.indexOf(c) == -1) highlightCountry(c, false);

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

    self.locations = function(locs, data) {

        mesh.applyStyle(loadedMeshu.metadata);
        countries = self.style().countries.split(",");
        modes = self.style().modes.split(",");

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

        self.locationsSet();

        if (processing_page) {
            d3.select(".map").attr("height","100%").select(".layer").remove();

            d3.select("#meshu-container").append("svg").attr("class","projection-preview")
                .style("position","absolute").style("top","0");

        }

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
        
        var SVG = $(".projection-preview").last().clone();

        // remove the map for lighter svg storage
        SVG.find(".map").remove();

        var cData = countries.join(","),
            mData = modes.join(",");

        self.style({
            countries:cData,
            modes:mData
        });
        
        return new XMLSerializer().serializeToString(d3.select(SVG).node()[0]);
    };

    self.getProjection = function(point){
        return projection.invert(point);
    }

    return self;
};