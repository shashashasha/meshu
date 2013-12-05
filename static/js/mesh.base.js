var sb = sb || {};

sb.mesh = {};
sb.mesh.base = function (frame, map, width, height) {
	var self = d3.dispatch("added", 
                            "refreshed", 
                            "locationsSet", 
                            "removed", 
                            "draggedMap", 
                            "draggedPoint", 
                            "clickedMap", 
                            "clickedPoint",
                            "styled",
                            "interactiveToggled"),
		selfId = parseInt(Math.random() * 10000000000, 10);

    // iz alwayz durty
    self.dirty = true;

    // making this not global ._.
    var lats = [],
        lons = [],
        places = [],
        style = {};

    var points = [],
    	new_pt = [],
        pixel_bounds = [],
    	updateInterval = 0,
        selected = null,
        moved = false,
        mouse_down = null,
        map_dragging = null,
        last_mouse = null,
        meshuTitle = null;

    var content = $("#content");

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
        if (!self.dragging && !mouse_down) {
            return;
        }

        var m = d3.svg.mouse(frame);

        // if we're dragging a point, we need to update its data
        if (self.dragging) {
            var l = map.p2l({
                x: m[0],
                y: m[1]
            });
            self.draggedPoint(self.dragging, l);
        }

        if (moved && mouse_down) {
            // if we've moved and the mouse is down, we're dragging the map
            map_dragging = true;

            // move the map by the delta
            if (last_mouse)
                map.map.panBy({ x: m[0] - last_mouse[0], y: m[1] - last_mouse[1] });

            /*
                the map is dirty when its been dragged
            */
            self.dirty = true;
            self.draggedMap();
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
        if (d3.event.target.tagName != 'circle' && self.hittest(d3.event.target) && d3.event.target.tagName != "image")  return;

        // if we're not dragging and we're not dragging the map, we're adding a point
        if (!self.dragging && !map_dragging) {
            var m = d3.svg.mouse(frame);
            var loc = map.p2l({
                x: m[0],
                y: m[1]
            });

            self.clickedMap(loc);
            map_dragging = null;
            return;
        }

        // delete the point if we mouseup on a point 
        if (!moved && self.dragging) {
            self.clickedPoint(self.dragging);
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
        self.dragging = null;
        map_dragging = null;
    }

    self.interactive = function(bool) {
        self.interactiveToggled(bool);
    };

    self.refresh = function() {
        update();

        self.refreshed();
    };

    // before loading in new locations, we can blit the svg onto the screen
    self.prerender = function() {
        
    };

    self.applyStyle = function(styleString) {
        var styles = styleString.split("|");

        var s = {};
        for (var i = 0; i < styles.length; i++) {
            var kv = styles[i].split(":");
            s[kv[0]] = kv[1];
        }

        self.style(s);
    };

    self.style = function(s) {
        if (!arguments.length) return style;

        for (var i in s) {
            style[i] = s[i];
        }
        self.styled(style);
    };

    self.outputStyle = function() {
        var styles = [];
        for (var i in style) {
            styles.push(i + ":" + style[i]);
        }

        return styles.join('|');
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

    self.outputMesh = function() {
        return ".delaunay";
    };

	return self;
};