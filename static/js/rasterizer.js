var sb = sb || {};

sb.rasterizer = function() {
	var self = d3.dispatch("rasterized", "rasterizedThumbnail"),
		generated = false,
		canvases = [];

	var makeCanvas = function(name, manualTracking) {
		var canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 400;
		canvas.style.position = 'absolute';
		canvas.style.top = '0';
		canvas.style.left = '0';
		canvas.className = name;

		$(canvas).addClass("hidden");

		if (!manualTracking)
			canvases.push(canvas);
		return canvas;
	};

	// lighten the canvas for the map tiles, then draw the meshu
	var lightenCanvas = function(ctx, percent) {
		ctx.fillStyle = 'rgba(255, 255, 255, ' + percent + ')';
		ctx.fillRect(0, 0, ctx.width, ctx.height);
		ctx.fill();
	};

	var serialize = function(svg) {
		var serializer = new XMLSerializer();
		return serializer.serializeToString(svg);
	};

	/*
		only snap if we have to
	*/
	var snapZoom = function(meshu) {
		var map = meshu.map().map,
			zoom = map.zoom(),
			roundedZoom = Math.round(zoom);

		if (zoom != roundedZoom) {
			map.zoom(roundedZoom);
			meshu.mesh().refresh();
		}
	};

	var drawMeshu = function(frame, canvas, ctx, meshu, callback) {
		var meshuCanvas = makeCanvas();
		frame.appendChild(meshuCanvas);

		meshu.mesh().bakeStyles();

		canvg(meshuCanvas, meshu.outputSVG(), {
			renderCallback: function() {
				// combine the canvases
				meshu.mesh().unBakeStyles();
				ctx.drawImage(meshuCanvas, 0, 0, canvas.width, canvas.height);
				var logo = new Image();
				logo.onload = function(){
					ctx.drawImage(logo, canvas.width-130, canvas.height-35, 117, 22);
					postMeshu(frame, canvas, meshu, callback);
				};
				logo.src = '/static/images/logo_io.png';
			}
		});
	};

	var postMeshu = function(frame, canvas, meshu, callback) {
		/*
			sending all the meshu information. Since we're saving on 'continue'
			we want to save a meshu in our db regardless, to associate with the MeshuImage

			this starts off as assigned to the 'guest' user_profile,
			which once we log in we assign to the logged in user_profile
		*/
		var xhr = meshu.xhr();
		xhr.csrfmiddlewaretoken = $("#csrf input").val();
		xhr.dataurl = canvas.toDataURL();

		/*
			attach the meshu id if we have one,
			this is if we're starting off with a meshu
		*/
		if (meshu.id) {
			xhr.id = meshu.id;
		}

		// TODO just commenting out for now, for rings
		self.clearCanvases();

		// send it to the server to be saved as a png
		$.post('to_png', xhr, function(data) {
			var img = document.createElement('img');
			img.src = data.image_url;
			$(img).addClass("hidden");

			frame.appendChild(img);
			self.generated = true;
			self.rasterized(data);

			if (callback) {
				callback(data);
			}
		}, 'json');
	};

	self.clearCanvases = function() {
		while (canvases.length) {
			var c = canvases.pop()
			// c.getContext('2d').clearRect(0, 0, c.width, c.height);
			$(c).remove();
		}
	};

	self.rasterize = function(meshu, callback) {
		snapZoom(meshu);

		// get the map canvas, the frame, and serialize the map content
		var canvas = makeCanvas(),
			frame = meshu.getFrame(),
			ctx = canvas.getContext('2d'),
			str = serialize(meshu.map().map.container());

		// we need the canvas on the DOM to draw it
		frame.appendChild(canvas);

		// canvg it, then lighten the map and draw the meshu
		canvg(canvas, str, {
			renderCallback: function() {
				// make the map more transparent
				lightenCanvas(ctx, .7);

				// draw the meshu onto a canvas
				drawMeshu(frame, canvas, ctx, meshu, callback);
			}
		});
	};

	// create a canvas version of the mesh that we can use as a thumbnail
	// for products, etc
	self.thumbnail = function(meshu, callback) {
		meshu.mesh().bakeStyles();

		// draw the mesh object
		var canvas = makeCanvas(),
			frame = meshu.getFrame(),
			ctx = canvas.getContext('2d'),
			str = meshu.outputSVG();

		// we need the canvas on the DOM to draw it
		frame.appendChild(canvas);

		canvg(canvas, str, {
			renderCallback: function() {
				// combine the canvases
				meshu.mesh().unBakeStyles();

				if (callback) {
					callback(canvas);
				}
			}
		});
	};

	self.ringPreview = function(meshu, callback) {
		meshu.mesh().bakeStyles();

		var map = meshu.map(),
			points = meshu.mesh().points(),
			max = 0,
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
					pair = [pj, pi];
				}
			}
		}

		var p1 = pair[0],
			p2 = pair[1],
			dpy = p2.y - p1.y,
			dpx = p2.x - p1.x;

		/*
			omg too tired to do this right.
		*/
		var angle = Math.atan2(dpy, dpx) * (180 / Math.PI),
			normalizedAngle = -angle + 180,
			normalizedDist = Math.sqrt((dpx * dpx) + (dpy * dpy)),
			newScale = (600 / normalizedDist),
			newCenter = 300 * newScale,
			centerDif = (300 - (300 * newScale)),
			scale = "scale(" + (600 / normalizedDist) + ") ",
			translate = "translate(" + centerDif + "," + centerDif + ") ",
			rotate = "rotate(" + [normalizedAngle, newCenter, newCenter].join(',') + ") ";

		// pump up da volume
		// d3.select(".delaunay").attr("stroke-width", 30)
		// 	.attr("transform", translate + scale + rotate);

		// simple rotation
		d3.select(".delaunay").attr("stroke-width", 30)
			// .attr("transform", "rotate(" + normalizedAngle + ", 300, 300)");
			.attr("transform", translate + rotate + scale);

		// create our own canvas and don't autoremove it
		var canvas = makeCanvas('ring-canvas', true),
			frame = meshu.getFrame(),
			ctx = canvas.getContext('2d'),
			str = meshu.outputSVG();

		// we need the canvas on the DOM to draw it
		frame.appendChild(canvas);

		canvg(canvas, str, {
			renderCallback: function() {
				// combine the canvases
				meshu.mesh().unBakeStyles();

				d3.select(".delaunay").attr("stroke-width", 5);
					// to reset the meshu
					// .attr("transform", "translate(0,0) scale(1) rotate(0,300,300)");
				d3.selectAll(".ring-canvas").remove();

				var background = document.getCSSCanvasContext('2d', 'ring-preview', 600, 200);
				background.clearRect(0, 0, 600, 200);
				background.fillStyle = 'rgba(255, 255, 255, .75)';
				background.fillRect(0, 0, 600, 200);
				background.drawImage(canvas, 0, 0, 600, 200);

				if (callback) {
					callback(canvas);
				}
			}
		});
	}

	return self;
}();