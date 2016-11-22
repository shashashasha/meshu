var sb = sb || {};

sb.mesh.streets = function (frame, map, width, height) {
    var self = sb.mesh.base(frame, map, width, height),
        selfId = 'm' + parseInt(Math.random() * 10000000000, 10),
        offsetX = 0,
        offsetY = 0;
    //vector-tiles-9rqLeje



    var layers = [
    { layer: 'roads',
      display: true,
      types: []} ,
    ];

var width = $("#meshu-container").width(),
    height = $("#meshu-container").height();

var firefox = $("body").hasClass("firefox");

var tile = d3.geo.tile()
    .size([width, height]);

var start = map.getStart();
map.hide();
var origin = [start.lon, start.lat, start.zoom];

// translating tile zoom levels to d3's scale
var projection = d3.geo.mercator()
    .scale((1 << (8 + origin[2])) / 2 / Math.PI) // change scale here, 21 is about z13
    .translate([-width / 2, -height / 2]); // just temporary

var tileProjection = d3.geo.mercator();

var tilePath = d3.geo.path()
    .projection(tileProjection);

var zoom = d3.behavior.zoom()
    .scale(projection.scale() * 2 * Math.PI)
    .scaleExtent([1 << 12, 1 << 25]) // 12 to 25 is roughly z4-z5 to z17
    // .translate(projection([-74.0059, 40.7128]) //nyc
    .translate(projection([origin[0], origin[1]]) //la
    // .translate(projection([-122.4407, 37.7524]) //sf
    .map(function(x) { return -x; }));

if (!$("body").hasClass("display") && !$("body").hasClass("postcard"))
  zoom
    .on("zoom", zoomed)
    .on("zoomend", endZoom);

var mapShape = d3.select("#meshu-container").append("div")
    .attr("id", "map-now")
    .style({"position":"absolute","top":"0"})
    .style("width", width + "px")
    .style("height", height + "px")
    .call(zoom)
    .on("mousewheel.zoom", null)
    .on("DOMMouseScroll.zoom", null);

mapShape.append("div")
    .attr("class", "layer");

var rasters = mapShape.select(".layer")
    .append("svg").attr("id","raster-tiles")
    .attr("width",width).attr("height",height)
    .append("g");
  
var vSVG = mapShape.select(".layer")
    .append("div").attr("id","map-boundary")
    .append("svg").attr("id","streets-svg")
    .attr("width",width).attr("height",height);
    
vSVG.append("defs").append("clipPath").attr("id","circle-clip")
    .append("circle")
    .attr("cx",width/2).attr("cy",height/2).attr("r",280);

vSVG.append("circle").attr("id","border")
    .attr("cx",width/2).attr("cy",height/2)
    .attr("r",280);

var svg = vSVG.append("g").attr("clip-path","url(#circle-clip)")
  .append("g").attr("id","vector-tiles");

var info = d3.select("#attribution")
    .html('<a href="http://bl.ocks.org/mbostock/5593150" target="_top">Mike Bostock</a> | © <a href="https://www.openstreetmap.org/copyright" target="_top">OpenStreetMap contributors</a> | <a href="https://mapzen.com/projects/vector-tiles" title="Tiles courtesy of Mapzen" target="_top">Mapzen</a>');

$(".review-svg").replaceWith(function() {
    return $("<div>",{'class':'review-svg'});
});

zoomed();

function endZoom() {
  self.style({
      scale: zoom.scale(),
      translate: zoom.translate().join(",")
  });
}
 
function zoomed(event) {
  if (event && event.type == "wheel") {
    zoom.scale(projection.scale() * 2 * Math.PI);
    return;
  }

  var tiles = tile
      .scale(zoom.scale())
      .translate(zoom.translate())
      ();

  projection
      .scale(zoom.scale() / 2 / Math.PI)
      .translate(zoom.translate());

  var zoomLevel = tiles[0][2]
  // mapCenter = projection.invert([width/2, height/2]);

  // adding zoom level as a class  
  d3.select("#map-now .layer").attr("class",function(){ return "layer z"+zoomLevel; });

  var image = svg
      .attr("transform", matrix3d(tiles.scale, tiles.translate))
    .selectAll(".tile")
      .data(tiles, function(d){ return d; });

  image.exit()
      .each(function(d) { this._xhr.abort(); })
      .remove();

  image.enter().append("g")
      .attr("class", "tile")
      .attr("transform",function(d){ return "translate("+ d[0] * 256 +","+ d[1] * 256 +")"; });
  
  image.each(renderTiles);

  // setTimeout(function(){
  //   var displayed = d3.selectAll(".tile path")[0].filter(function(d){ return d3.select(d).style("display") != "none"; })
  //   console.log(d3.selectAll("path")[0].length, displayed.length)
  // },1000);

  var raster = rasters
      .attr("transform", matrix3d(tiles.scale, tiles.translate))
    .selectAll(".tile")
      .data(tiles, function(d){ return d; });

  raster.exit().remove();
  raster.enter().append("g")
      .attr("class", "tile")
      .attr("transform",function(d){ return "translate("+ d[0] * 256 +","+ d[1] * 256 +")"; })
      .append("image");

  raster.select("image")
    .attr("xlink:href", function(d) { return "http://tile.stamen.com/toner/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
    .attr("opacity",.2)
    .attr("width", 256)
    .attr("height", 256)
}

//use d3 nest to group the entire page's features by type
function sortData(thorough) {
  var mapData = svg.selectAll("path").data();
  var t = d3.nest()
    .key(function(d){ return d.layer_name; })
    .key(function(d){ 
      var kind = d.properties.kind;
      if (thorough && d.properties.boundary==true)
        kind += '_boundary';
      return kind; })
    .entries(mapData);

  if (t[0] && t[0].values)
    t[0].values = t[0].values.filter(function(d){
      return d3.select("."+d.key.replace("_","-")).style("display") != "none";
    });
  return t;
}

var svg2 = d3.select("body").append("div")
    .attr("id","svg-download").style("display","none")
    .append("svg").attr("width","100%").attr("height","100%")
    clipGroup = svg2.append("g").attr("clip-path","url(#dl-clip)").attr("class","delaunay")
    group = clipGroup.append("g").attr("class","tile");

svg2.append("defs").append("clipPath").attr("id","dl-clip")
    .append("circle")
    .attr("cx",300).attr("cy",300).attr("r",280);

clipGroup.append("circle").attr("cx",300).attr("cy",300)
    .attr("r",280).attr("fill","none");

//get list of feature types and figure out which are currently visible
function sortFeatures() {
  var featureTypes = sortData();

    var tiles = tile.scale(zoom.scale()).translate(zoom.translate())(),
      top = tiles[0],
      k = Math.pow(2, top[2]) * 256; // size of the world in pixels

    tilePath.projection()
        .translate([k / 2 - top[0] * 256, k / 2 - top[1] * 256]) // [0°,0°] in pixels
        .scale(k / 2 / Math.PI)
        .precision(0);

    var featureList = ["svg", "tile"];

    var layerType = svg2.selectAll(".tile").data(featureTypes);

    var features = layerType.selectAll(".feature-type")
      .data(function(d){ return d.values; });
    features.enter().append("g").attr("class","feature-type");
    features.attr("id",function(d){ featureList.push(d.key.replace("_","-")); return d.key; });
    features.exit().remove();

    var paths = features.selectAll("path").data(function(d){ return d.values; });
    paths.enter().append("path");
    paths.exit().remove();
    paths.attr("class", function(d) {
        var kind = d.properties.kind || '',
          kind = kind.replace("_","-");
        if(d.properties.boundary==true)
          {kind += '_boundary';} 
        return d.layer_name + '-layer ' + kind; })
      .attr("d", tilePath)
      .attr("fill","none").attr("stroke-width",7);

    var circle = projection.invert([width/2,height/2]),
      topLeft = projection.invert([0,0]);

    var t = projection.translate(),
      s = projection.scale();

    projection.translate([k / 2 - top[0] * 256, k / 2 - top[1] * 256]) // [0°,0°] in pixels
        .scale(k / 2 / Math.PI);

  var newCircle = projection(circle),
    translateG = projection(topLeft);

  svg2.select(".tile").attr("transform","translate(-"+translateG[0]+",-"+translateG[1]+")")

  projection.translate(t).scale(s);
}

function matrix3d(scale, translate) {
  var k = scale / 256, r = scale % 1 ? Number : Math.round;
  return "translate("+r(translate[0] * scale)+","+r(translate[1] * scale)+") scale("+k+")";
}

// zoom controls

function interpolateZoom (translate, scale) {
    var self = this;
    return d3.transition().duration(350).tween("zoom", function () {
        var iTranslate = d3.interpolate(zoom.translate(), translate),
            iScale = d3.interpolate(zoom.scale(), scale);

        return function (t) {
            zoom
                .scale(iScale(t))
                .translate(iTranslate(t));
            zoomed();
        };
    });
}

function fitZoom(bbox) {
  var pi = Math.PI,
    tau = 2 * pi;
  var p0 = projection([bbox[0], bbox[1]]),
    p1 = projection([bbox[2], bbox[3]]);

  function floor(k) {
    return Math.pow(2, Math.floor(Math.log(k * tau) / Math.LN2)) / tau;
  }

  //var k = floor(0.95 / Math.max((p1[0] - p0[0]) / width, (p1[1] - p0[1]) / height)) * 2 * Math.PI;
  var k = floor(0.95 / Math.max((p1[0] - p0[0]) / width, (p1[1] - p0[1]) / height)) * zoom.scale();
  return k;
}

  self.zoomTo = function(latlon, bbox) {
    var proj = projection(latlon).map(function(x){ return -x; }),
        center = [width / 2 + proj[0], height / 2 + proj[1] ],
        translate = zoom.translate(),
        view = {x: translate[0], y: translate[1], k: zoom.scale()};

    view.x += center[0];
    view.y += center[1];


    zoom.translate([view.x, view.y]).scale(view.k);
    zoomed();
    setTimeout(endZoom, 100);
  };

function zoomClick(dir) {
    var target_zoom = 1,
        center = [width / 2, height / 2],
        extent = zoom.scaleExtent(),
        translate = zoom.translate(),
        translate0 = [],
        l = [],
        view = {x: translate[0], y: translate[1], k: zoom.scale()};

    d3.event.preventDefault();
    direction = (dir === 'zoomin') ? 2 : .5;
    target_zoom = zoom.scale() * direction;

    if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

    translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
    view.k = target_zoom;
    l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

    view.x += center[0] - l[0];
    view.y += center[1] - l[1];

    interpolateZoom([view.x, view.y], view.k);
    setTimeout(endZoom, 350);
}

function renderTiles(d) {
  var displayLayers = layers.filter(function(d){ return d.display; })
      .map(function(d){ return d.layer; }),
    // requestLayers = displayLayers.join(",");
    requestLayers = "all";

  var svg = d3.select(this);
  var zoom = d[2];
  this._xhr = d3.json("https://tile.mapzen.com/mapzen/vector/v1/all/" + zoom + "/" + d[0] + "/" + d[1] + ".topojson?api_key=vector-tiles-9rqLeje", function(error, json) {
    var k = Math.pow(2, d[2]) * 256; // size of the world in pixels

    tilePath.projection()
        .translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256]) // [0°,0°] in pixels
        .scale(k / 2 / Math.PI)
        .precision(0);
    
    var data = {};
    for (var key in json.objects) {
      data[key] = topojson.feature(json, json.objects[key]);
    }
  
    // build up a single concatenated array of all tile features from all tile layers
    var features = [];
    layers.forEach(function(l){
      if (!l.display) return;
      var layer = l.layer;
      if(data[layer])
      {
        // Don't show large buildings at z13 or below.
        if(zoom <= 13 && layer == 'buildings') return;

        var sorted = d3.nest()
          .key(function(d){ return d.properties.kind; })
          .entries(data[layer].features);

        for (var i in sorted) {
          var displayFeature = true;
          if (l.types.length)
            l.types.forEach(function(t){ if (t.type == sorted[i].key) displayFeature = t.display; })

          var kind = sorted[i].key;
          for (var j in sorted[i].values) {
            // Don't include any label placement points
            if(sorted[i].values[j].properties.label_placement == true) { continue }

            if(sorted[i].values[j].properties.kind == 'path' || sorted[i].values[j].properties.kind == 'ferry') { continue }
            // Don't show small buildings at z14 or below.
            if(zoom <= 14 && layer == 'buildings' && sorted[i].values[j].properties.area < 2000) { continue }

            if(zoom <=14 && zoom>=11 && sorted[i].values[j].properties.kind == 'minor_road'){ continue;}
            if(zoom <=12 && zoom>=10 && sorted[i].values[j].properties.kind == 'major_road'){ continue;}

            sorted[i].values[j].layer_name = layer;
            sorted[i].values[j].display = displayFeature;
            features.push(sorted[i].values[j]);
          }
        }
      }
    });
    
    // put all the features into SVG paths
    var paths = svg.selectAll("path")
      .data(features.sort(function(a, b) { 
        return a.properties.sort_rank ? a.properties.sort_rank - b.properties.sort_rank : 0 }));
    paths.enter().append("path");
    paths.exit().remove();
    paths
      .attr("class", function(d) {
        var kind = d.properties.kind || '',
          kind = kind.replace("_","-");
        if(d.properties.boundary==true)
          {kind += '_boundary';} 
        return d.layer_name + '-layer ' + kind; })
      .attr("d", tilePath);
  });
}

setTimeout(function(){
    d3.selectAll('.mapui div').on('click', function(){
      zoomClick(d3.select(this).attr("id"));
    });
    
},1000);




    // the name of the product line
    self.name = 'streets';

    var lats = [],
        lons = [],
        meshuTitle;

    var points = [],
        meshuTitle = null;

    var content = $("#content");

    self.on("removed", function() {
        if (points.length == 0) $("#scroll-down").fadeOut();
    });

    // self.on("draggedMap", function() {
    //   zoomed();
    // });

    // update rotation and bounding box stuff
    function update(){
        //zoomed();
    }
    self.refresh = function(flag) {
        // if (flag == 'zoomed' && lats.length > 0 && lons.length > 0) {
        //     self.add(lats[0], lons[0], meshuTitle);
        // } else {
        //     update();
        //     self.refreshed();
        // }
    };

    self.add = function(latitude, longitude, placename, skipAnimation) {
        var lat = parseFloat(latitude);
        var lon = parseFloat(longitude);

        lats = [lat];
        lons = [lon];

        points = [[lon,lat]];

        if (placename == undefined) {
            meshuTitle = latitude.toFixed(3)+", "+longitude.toFixed(3);
        }
        else {
            meshuTitle = placename[0].toUpperCase() + placename.substr(1, placename.length-1);
        }

        $("#place-title").text(meshuTitle);


        $("#places").removeClass("inactive");
        $("#scroll-down").fadeIn();

        return self;
    };

    self.remove = function(index) {
        points.splice(index, 1);
        lats.splice(index, 1);
        lons.splice(index, 1);
        // places.splice(index, 1);

        if (points.length == 0) $("#scroll-down").fadeOut();
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
        self.dirty = true;
        self.locationsSet();
        mesh.applyStyle(loadedMeshu.metadata);
        
        if (self.style() != undefined) {
          var t = self.style().translate.split(",").map(function(a){ return parseFloat(a); }),
            s = parseFloat(self.style().scale);
          if ($("body").hasClass("display"))
            t[0] += 200;
          else if ($("body").hasClass("postcard")) {
            t[0] += 540;
            t[1] += 337.5;
          }
          zoom.scale(s).translate(t);
          zoomed();
        }


        return self;
    };

    self.hittest = function(target) {
        return d3.event.target != svg.node();
    };

    self.updateTitle = function(t) {
        meshuTitle = t;
    };

    self.outputTitle = function() {
        return meshuTitle || "My Meshu";
    };
    self.bakeStyles = function() {

      sortFeatures();
      console.log(firefox)
      d3.select("#border")
        .attr("r", firefox ? 300 : 280)
        .attr("stroke-width",15).attr("fill","none").attr("stroke","black");
      // var stroke = $(".streets path").css("stroke-width");
      // console.log(stroke)
      d3.selectAll("#streets-svg path")
        .attr("stroke-width",7).attr("fill","none").attr("stroke","black");
    };
    self.unBakeStyles = function() {
        d3.select("#border").attr("r",280)
        d3.selectAll("#streets-svg path").attr('stroke-width','');  
    };

    self.outputG = function() {
      sortFeatures();
      return $("#svg-download svg").parent().html();
    };

    // outputs svg data
    self.output = function() {
        sortFeatures();
        return $('#svg-download').html();
    };

    self.id = function() {
        return selfId;
    };

    return self;
};