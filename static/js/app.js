$(function() {
	var svgEnabled = $("html").hasClass("svg");

	// initialize the catalog with the current promotion if any
	// sorry about this, future us. signed, past sha.
	var promotion = loadedMeshu ? loadedMeshu.promo : null,
		currentRenderer = loadedMeshu ? loadedMeshu.renderer : 'facet';
							$("body").hasClass("radial") ? 'radial' : 'facet';

	if ($("body").hasClass("radial")) currentRenderer = "radial";
	else if ($("body").hasClass("print")) currentRenderer = "print";
	else if ($("body").hasClass("orbit")) currentRenderer = "orbit";


	// the list of all available meshu products for purchase
	var catalog = sb.catalog(currentRenderer, promotion);

	// this listens to material and product selection changes, updates prices
	sb.materializer.initialize(catalog);

	// create a meshu object for a single meshu container
	meshu = sb.meshu($("#meshu-container")[0], currentRenderer);

	// hotfix for postcard pages
	meshu.zoomOffset = window.location.href.search("postcard") > 0 ? -.25 : 0;
	meshu.isReadymade = loadedMeshu && loadedMeshu.product != '';

	// initialize ordering ui
	// it listens to when the form ui is validated, then moves to the review view
	sb.ui.orderer.initialize(meshu, catalog);

	if (loadedMeshu) {
		// create a saver object, in saver.js

		saver.initialize(meshu);
		saver.updateMeshuData(loadedMeshu);

		// checking the page view type, setting our flows accordingly
		user.updateLogoutActions(pageType);


		switch (pageType) {
			case 'view':
				// initialize the social sharing ui
				// facebook, twitter, pinterest buttons
				sb.ui.socialsharer(meshu);

				if (svgEnabled)
					meshu.map().buffer(0);
				break;
		}

		// if svg is enabled
		if (svgEnabled) {
			// readymade.js
			if (meshu.isReadymade && readymade) {
				readymade.initialize(meshu);
			}

			// render the meshu
			meshu.initializeFromData(loadedMeshu.location_data, loadedMeshu.metadata, loadedMeshu.svg);
		}

		// initialize product picker
		// this needs to be after the meshu is initialized because it needs to copy the mesh over
		if (pageType != 'postcard' && pageType != 'print') {
			generateProductThumbnails();
		}

		$("#meshu-container").removeClass("inactive");

		// creates the location list
		var rows = loadedMeshu.location_data.split("|");
		$.each(rows,function(i,row){
			var cols = row.split("\t");
			if (cols.length == 3) {
				// decoder div. dumb way to do this
				// http://stackoverflow.com/questions/3700326/decode-amp-back-to-in-javascript
				var div = document.createElement('div');
				div.innerHTML = cols[2];
				var decoded = div.firstChild.nodeValue;

				$("<li>").html(decoded).appendTo($("#display-places"));
			}
		});

		d3.select("#places").attr("class","")
			.select("#place-title")
			.attr("class","")
			.select(".title-text")
            .html(function(d){
                d.title = loadedMeshu.title;
                meshu.updateTitle(d.title);
                return d.title;
            });

	} else {
		saver.initializeNewMeshu(meshu);
	}

	// check if we need an account screen
	sb.viewhandler.on("next", makeNextView);
	sb.viewhandler.on("prev", makePrevView);

	/*
		Checking if we have tooltips to show

		Hide them if we click anywhere on the screen
	*/
	var docClicked = false;
	if (!user.loggedIn && !loadedMeshu && window.location.hash != '#skipintro') {
		$(".tooltip").each(function(i, e) {
			setTimeout(function() {
				if (!docClicked)
					$(e).fadeIn();
			}, i * 1000);
		});

		$(document).click(function() {
			docClicked = true;
			$(".tooltip").fadeOut();
		});
	}

	/*
		This handles when people select a product to order
		and go to the materials / color selection page
	*/
	$("#product-preview .wrapper").live("click", function() {

		var wrapper = $(this);
		wrapper.parent().find(".wrapper").removeClass("selected");
		wrapper.addClass("selected");
		var product = wrapper.attr("id").split("-")[1];

		var material = sb.materializer.material(),
			color = sb.materializer.color();

		if (!(color+"-"+material in catalog.getMaterials(product))) {
			sb.materializer.material("reset");
		}

		if (currentRenderer == "print") {
			if (product != sb.materializer.product()) 
				$(".frame-wrapper").removeClass("selected").removeClass("possible");
			$("#frame-"+product).addClass("possible");
			sb.materializer.material("unframed");
		}

		if (currentRenderer == "facet" && (product == "small_poster" || product == "medium_poster")) {
			$("#materials").fadeOut();
   			$("#add-ons").fadeOut();
   			$(".print-hide").fadeOut();
   			sb.materializer.material("unframed");
   			sb.materializer.color("null");
		} else {
			$("#materials").fadeIn();
   			$("#add-ons").fadeIn();
   			$(".print-hide").fadeIn();
		}

   		switch (product) {
   			case 'small_poster':
   			case 'medium_poster':
   			case 'cufflinks':
   				$("#final-rotate").hide();
				$("#final-ring").hide();
	   			sb.ui.orderer.clearMetadata("ringSize");
   				break;
   			case 'ring':
   				$("#final-rotate").hide();
				$("#final-ring").show();

				sb.rotator.on("ringSizeUpdated", function(size) {
					sb.ui.orderer.metadata({"ringSize":size});
				});

				sb.rotator.updateRing();
   				break;
   			default:
   				$("#final-rotate").show();
				$("#final-ring").hide();

				if (currentRenderer == 'facet' || currentRenderer == 'orbit') {
					sb.rotator.update(product);
					sb.rotator.on("rotated", function() {
						sb.ui.orderer.updated();
					});
				}

				sb.ui.orderer.clearMetadata("ringSize");
   				break;
   		}

		/*
			i suck.
		*/
		sb.materializer.product(product);
		sb.ui.orderer.updated();
	});

	// initialize product picker
	// todo - fix
	function generateProductThumbnails() {
		if (meshu.mesh().name == "facet") {
			sb.product.initialize(".delaunay", catalog);

			// create ring preview, it's in rasterizer
			var isIE = $("body").hasClass("ie9") || $("body").hasClass("ie10");
			if (!isIE) {
				sb.rasterizer.ringPreview(meshu);
			}
		}
		else if (meshu.mesh().name == "radial") {
			sb.rasterizer.thumbnail(meshu, function(canvas) {
				sb.product.initialize(canvas, catalog);
			});
		} else if (meshu.mesh().name == "orbit") {
			sb.product.initialize(".delaunay", catalog);
		}
	}

	// called when a next button is clicked
	function makeNextView() {
		var view = sb.viewhandler.view();
		switch (view) {
			case 'edit':
				meshu.updateBounds();
				meshu.mesh().interactive(true);

				if (currentRenderer == "print") meshu.mesh().copyMap();

				generateProductThumbnails();
				break;

			case 'make':
			case 'readymade':
				meshu.mesh().interactive(false);

			// 	// update the render background to be the product preview
			// 	var productPreview = static_url + 'images/render/' + product + '_preview.jpg',
			// 		url = "url(" + productPreview + ")";
			// 	$(".render").css("background-image", url);
				break;
		}
	}

	// called when a back button is clicked
	function makePrevView() {
		var view = sb.viewhandler.view();
		switch (view) {
			case 'edit':
				meshu.mesh().interactive(true);
				break;
		}
	}

	$(".show-places").click(function(){
		$("#display-places").slideToggle();
		$(".show-places").toggle();
	});
});