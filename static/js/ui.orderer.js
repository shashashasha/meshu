var sb = sb || {};

// using a new sb.ui object, hopefully to pull more out of app.js
sb.ui = sb.ui || {};

/*

	Pulling apart some JQuery listeners
	from app.js into here.

	The idea is that stuff in here either
	listens to events related to the ordering form
	and the end event here is adding to cart

*/
sb.ui.orderer = function() {
	var self = d3.dispatch("updated"),
		meshu = null,
		catalog = null,
		style = {};

	self.on("updated", function() {
		// update hidden form
		updateForm();
		populateReviewText();
	});

	self.initialize = function(m, c) {
		meshu = m, catalog = c;

		/*
			plug into events on initialize
		*/
		$("#postcard-note-form").keyup(function(e) {
			var note = e.target.value;
			$("#postcard-note").val(note);
		});

		$("#save-and-view").click(function() {
			// if the user is not logged in we should force them to log in
			var createAndView = function() {
				saver.createOrUpdateMeshu(function(data) {
					window.location.href = data.meshu_url;
				});
			};

			if (!user.loggedIn) {
				forceUserLogin();
				user.afterLogIn = createAndView;
			}
			else {
				createAndView();
			}
		});

	    $("#add-to-cart").click(function(){
	    	self.updated();
	    	$("#order-form")[0].submit();
	    });
	};

	function onFormValidated() {
		if (!user.loggedIn) {
			forceUserLogin(onFormValidated);
			return;
		}

		self.updated();
		self.validated();
		return false;
	}

	function forceUserLogin(callback) {
		user.showModal();

		// after a user logs in, click the button
		user.afterLogIn = function() {
			if (callback) {
				saver.createOrUpdateMeshu(function() {
					// wait a bit...
					setTimeout(callback, 200);
				});
			}
		};
	}


	/*
		updateForm runs when we click 'review your order'
		here's where we populate our hidden form with all of the data we'll be sending
		also telling stripe how much to charge once the "submit" button is pressed
	*/
	function updateForm() {
		// let our stripe object know what object we're purchasing
		// it'll know the price, given the options beforehand
		// we also can't change options once it's set, so no one can mess with it
		var product = sb.materializer.product(),
			material = sb.materializer.material(),
			color = sb.materializer.color(),
			priceCents = catalog.getPrice(product, material) * 100;

		$("#object-type").val(product);
		$("#object-material").val(material);
		$("#object-color").val(color ? color.toLowerCase() : '');
		$("#object-amount").val(priceCents);

		$("#svg-theta").val(sb.rotator ? sb.rotator.getRotation() : 0);

		// outputting meshu data
		// if (meshu.mesh().name == "streets")
		// 	$("#svg-file").val('<svg class="meshu-svg" width="80" height="80">'+meshu.outputSVG()+"</svg>");
		// else
			$("#svg-file").val(meshu.outputSVG());
		$("#meshu-data").val(meshu.outputLocationData());
		$("#meshu-title").val(loadedMeshu ? loadedMeshu.title : meshu.outputTitle());

		$("#meshu-renderer").val(meshu.mesh().name);
		$("#meshu-metadata").val(meshu.mesh().outputStyle());

		$("#postcard-note").val($("#postcard-note-form").val());

		// set the ring size to send to backend
		$("#order-metadata").val(self.outputMetadata());
	}

	function populateReviewText() {
		var product = sb.materializer.product(),
			material = sb.materializer.material(),
			color = sb.materializer.color(),
			priceCents = catalog.getPrice(product, material),
			renderer = meshu.mesh().name,
			review = $("#review");

		// correct for base rotation
		var rotation = sb.rotator ? sb.rotator.getRotation() - sb.rotator.getBaseRotation() : 0;
		if (renderer != "print" && product && product.split("_")[1] == "poster")
			rotation = sb.transforms.getOrientation(product,"product").rotation;

		var transform = "translate(75, 75) scale(.25) rotate(" + rotation + ")";
		var miniDelaunay = $("#product-preview .selected .product-transformer").clone()
				.attr("class","review-delaunay").attr("transform", transform);

		review.find(".review-svg").empty().append(miniDelaunay);

		if (product) {
			if (product == "ring") {
				var size = sb.ui.orderer.metadata().ringSize ? sb.ui.orderer.metadata().ringSize : "<span class='inactive'>not chosen</span>";
				review.find(".review-product").removeClass("inactive").html(product+" — size "+size);
			} else {
				var displayText = product.replace("_"," ");
				if (displayText.indexOf("Dense") != -1) displayText = displayText.split(" ")[1];
				review.find(".review-product").removeClass("inactive").text(displayText);
			}
		}

		if (color && material)
			review.find(".review-material").removeClass("inactive").text(sb.materializer.color()+" "+material);
		else
			review.find(".review-material").addClass("inactive").text("not chosen");

		if ((product && color && material) || (renderer == "print" && product)) {
			review.find(".review-price").html("<span class='dollar'>$</span>" + priceCents + '.00');
			review.find(".review-make-time").text(catalog.getMakeTime(material));

			if (renderer == "facet" && miniDelaunay.children().length ||
				renderer == "radial" && $(".meshu-svg .radial").children().length ||
				renderer == "print" || renderer == "orbit" || renderer == "streets") {
				if (product == "ring" && !sb.ui.orderer.metadata().ringSize)
					return;
				review.find("#add-to-cart").removeClass("inactive");
			}
		} else {
			review.find(".review-price").text("");
			review.find(".review-make-time").text("");
			review.find("#add-to-cart").addClass("inactive");
		}
	}

	self.metadata = function(s) {
        if (!arguments.length) return style;

        for (var i in s) {
            style[i] = s[i];
        }
    };

    self.clearMetadata = function(value) {
    	if (style[value])
	    	delete style[value];
    };

    self.outputMetadata = function() {
        var styles = [];
        for (var i in style) {
            styles.push(i + ":" + style[i]);
        }

        return styles.join('|');
    };

	return self;
}();