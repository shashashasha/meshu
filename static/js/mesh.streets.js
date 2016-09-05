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

var width = 600,
    height = 600;

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
      .map(function(x) { return -x; }))
    .on("zoom", zoomed)
    .on("zoomend",function(){
      setTimeout(sortFeatures, 1000);
    });

function search(text) {
  var text = document.getElementById('search-text').value;
  d3.json("https://search.mapzen.com/v1/search?text="+text+"&api_key=search-owZDPeC", function(error, json) {
        var latlon = json.features[0].geometry.coordinates;
        zoomTo(latlon);
        document.getElementById('search-text').value = '';
    });
}

var mapShape = d3.select("#meshu-container").append("div")
    .attr("id", "map-now")
    .style({"position":"absolute","top":"0"})
    .style("width", width + "px")
    .style("height", height + "px")
    .call(zoom);

mapShape.append("div")
    .attr("class", "layer");

var rasters = mapShape.select(".layer")
    .append("svg").attr("id","raster-tiles")
    .attr("width","600px").attr("height","600px")
    .append("g");
  
var svg = mapShape.select(".layer")
    .append("div").attr("id","map-boundary")
    .append("svg").attr("width","600px").attr("height","600px")
    .append("g").attr("id","vector-tiles");

var zoom_controls = mapShape.append("div")
    .attr("class", "zoom-container");

var zoom_in = zoom_controls.append("a")
    .attr("class", "zoom")
    .attr("id", "zoom_in")
    .text("+");

var zoom_out = zoom_controls.append("a")
    .attr("class", "zoom")
    .attr("id", "zoom_out")
    .text("-");

var info = mapShape.append("div")
    .attr("class", "info")
    .html('<a href="http://bl.ocks.org/mbostock/5593150" target="_top">Mike Bostock</a> | © <a href="https://www.openstreetmap.org/copyright" target="_top">OpenStreetMap contributors</a> | <a href="https://mapzen.com/projects/vector-tiles" title="Tiles courtesy of Mapzen" target="_top">Mapzen</a>');

zoomed();
setTimeout(sortFeatures, 1500);

function zoomed() {

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
  var mapData = d3.select("svg").selectAll("path").data();
  var t = d3.nest()
    .key(function(d){ return d.layer_name; })
    .key(function(d){ 
      var kind = d.properties.kind;
      if (thorough && d.properties.boundary=='yes')
        kind += '_boundary';
      return kind; })
    .entries(mapData);

  return t;
}

//get list of feature types and figure out which are currently visible
function sortFeatures() {
  var featureTypes = sortData();
  featureTypes.forEach(function(l){
    var layerIndex;
    layers.forEach(function(d,i){ if (d.layer == l.key) layerIndex = i; });
    var currentTypes = l.values.map(function(d){ return d.key; });
    
    layers[layerIndex].types.forEach(function(d,i){ d.visible = false; });

    l.values.forEach(function(f){
      var featureIndex = -1;
      layers[layerIndex].types.forEach(function(d,i){ if (d.type == f.key) featureIndex = i; });
      if (featureIndex == -1)
        layers[layerIndex].types.push({
          type: f.key,
          display: true,
          visible: true
        });
      else
        layers[layerIndex].types[featureIndex].visible = true;
    });
  });

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

  self.zoomTo = function(latlon) {
    var proj = projection(latlon).map(function(x){ return -x; }),
        center = [width / 2 + proj[0], height / 2 + proj[1] ],
        translate = zoom.translate(),
        view = {x: translate[0], y: translate[1], k: zoom.scale()};

    view.x += center[0];
    view.y += center[1];

    zoom.translate([view.x, view.y]).scale(view.k);
    zoomed();
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
}

function renderTiles(d) {
  var displayLayers = layers.filter(function(d){ return d.display; })
      .map(function(d){ return d.layer; }),
    requestLayers = displayLayers.join(",");

  var svg = d3.select(this);
  var zoom = d[2];
  this._xhr = d3.json("https://vector.mapzen.com/osm/"+requestLayers+"/" + zoom + "/" + d[0] + "/" + d[1] + ".topojson?api_key=vector-tiles-LM25tq4", function(error, json) {
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
      var layer = displayLayers.length > 1 ? l.layer : 'vectile';
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
            if(sorted[i].values[j].properties.label_placement == 'yes') { continue }
            // Don't show small buildings at z14 or below.
            if(zoom <= 14 && layer == 'buildings' && sorted[i].values[j].properties.area < 2000) { continue }

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
        return a.properties.sort_key ? a.properties.sort_key - b.properties.sort_key : 0 }));
    paths.enter().append("path");
    paths.exit().remove();
    paths
      .attr("class", function(d) {
        var kind = d.properties.kind || '',
          kind = kind.replace("_","-");
        if(d.properties.boundary=='yes')
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

    // update the place title editing
    function updateListBehavior() {
        placeTitle.attr("class","").select(".title-text")
            .text(function(d){
                if (d && d.title)
                    return d.title;
                else
                    return meshuTitle;
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

    self.editText = function(node,i,type) {
        var button = node.find("." + type + "-edit").text("save");
        var field = node.find("." + type + "-text");
        var value = field.text();

        node.addClass("active");
        field.html('<input value="' + value + '">').find("input").focus();
    };
    self.saveText = function(node, i, type) {
        var button = node.find("." + type + "-edit").text("edit");
        var text = node.find("input").val();

        node.removeClass("active");
        node.find("." + type + "-text").text(text);

        return text;
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

    // outputs svg data
    self.output = function() {
        return $('#' + selfId).html();
    };

    self.id = function() {
        return selfId;
    };

    return self;
};