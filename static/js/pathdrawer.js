var sb = sb || {};

sb.pathdrawer = function (map) {
	var self = {},
		routes = [],
		paths = [];

    var main = d3.select("#meshu-container").append("div")
        .style("width", "600px")
        .style("height", "600px")
        .style("position", "absolute")
        .style("z-index", "100")
        .append("svg:svg")
        .attr("class", "meshu-svg")
        .attr("width", "100%")
        .attr("height", "100%");

    var g = main.append("svg:g");


    self.update = function() {
		var lines = g.selectAll("path").data(paths);
		lines.enter().append("svg:path");
		lines.exit().remove();

		lines.attr("d", function(d) {
	        return self.drawPath(d.pts);
	    });

	    lines.attr("stroke", "black")
	    	.attr("fill", "none")
	    	.attr("stroke-linecap", "round");

	    lines.attr("stroke-width", function(d, i) {
	    	return 20 * Math.pow(1 - d.d, .5) + "px";
	    });

	    lines.style("stroke-width", function(d, i) {
	    	return 20 * Math.pow(1 - d.d, .5) + "px";
	    });
    };

    self.drawPath = function (p) {
        var draw = [];
        var l = p.length;
        for (var i = 0; i < l; i++){
            var loc = {
                lat: p[i][0],
                lon: p[i][1]
            };
            var pt = map.l2p(loc);
            draw.push([pt.x, pt.y]);
        }
        return "M" + draw.join("L");
    };

	self.addRoute = function(waypoints) {
		routes.push(waypoints);

        var l = waypoints.length;
        for (var i = 0; i < l-2; i+=2){
        	var start = [waypoints[i], waypoints[i+1]];
        	var end = [waypoints[i+2], waypoints[i+3]];
            paths.push({
            	pts: [start, end], // start and end
            	d: i / waypoints.length // use distance as the index for now
            });
        }

        self.update();
	};

	return self;
};