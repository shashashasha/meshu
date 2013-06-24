$(function() {
	var svgEnabled = $("html").hasClass("svg");

	// initialize the catalog with the current promotion if any
	// sorry about this, future us. signed, past sha.
	var promotion = loadedMeshu ? loadedMeshu.promo : null,
		isReadymade = loadedMeshu && loadedMeshu.product != '',
		zoomOffset = window.location.href.search("postcard") > 0 ? -.25 : 0,
		currentRenderer = loadedMeshu ? loadedMeshu.renderer :
							$("body").hasClass("radial") ? 'radial' : null;

		if ($("body").hasClass("print"))
			currentRenderer = "print";

	var catalog = sb.catalog(currentRenderer, promotion);

	// create a stripe payment object
	orderer.catalog(catalog);
	sb.materializer.initialize(catalog);

	// create a meshu object for a single meshu container
	meshu = sb.meshu($("#meshu-container")[0], currentRenderer);

	// hotfix for postcard pages
	meshu.zoomOffset = zoomOffset;
	meshu.isReadymade = isReadymade;

	// initialize ordering ui
	// it listens to when the form ui is validated, then moves to the review view
	var orderForm = sb.ui.orderer(meshu);
	orderForm.on("validated", function() {
		sb.viewhandler.view('review');
		makeNextView('review');
		return false;
	});

	// initialize the social sharing ui
	// facebook, twitter, pinterest buttons
	sb.ui.socialsharer(meshu);

	// initialize the viewhandler
	sb.viewhandler.initialize();

	if (loadedMeshu) {
		// create a saver object, in saver.js
		saver.initialize(meshu);
		saver.updateMeshuData(loadedMeshu);

		// checking the page view type, setting our flows accordingly
		user.updateLogoutActions(pageType);

		// viewhandler handles next / prev buttons, shuffling account view
		sb.viewhandler.updateViews(pageType);

		switch (pageType) {
			case 'view':
				if (svgEnabled) 
					meshu.map().buffer(0);
				break;
			
			case 'product':
				var product = $("#product");
				product.find(".nav").remove();
				product.find(".make-wrapper").removeClass("make-wrapper");
				break;

			default:
				$("#materials").addClass("ready");

				var product = loadedMeshu.product.length ? loadedMeshu.product : 'necklace';
				sb.materializer.product(product);
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
		if (pageType != 'postcard') {
			generateProductThumbnails();
		}
		

		$("#finish-button").addClass("active");
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
	sb.viewhandler.updateAccountView();
	sb.viewhandler.on("next", makeNextView);
	sb.viewhandler.on("prev", makePrevView);

	/*
		Checking if we have tooltips to show

		Hide them if we click anywhere on the screen
	*/
	if (!user.loggedIn && !loadedMeshu && window.location.hash != '#skipintro') {
		$(".tooltip").each(function(i, e) {
			setTimeout(function() {
				$(e).fadeIn();
			}, i * 1000);
		});

		$(document).click(function() {
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
		
		$(".make-option").hide();

		$("#make-" + product).show();

		sb.rotator.update(product);

		/* 
			i suck.
		*/
		sb.materializer.product(product);

		// sync the rotation between the product picker and the product rotator
		sb.rotator.on("rotated", sb.product.rotation);
	});

	function generateProductThumbnails() {
		// initialize product picker
		// todo - fix
		if (meshu.mesh().name == "facet") {
			sb.product.initialize(".delaunay", catalog);

			// rasterize the meshu, add it as an image on to the page 
			// this means we can then pin it / fb it
			sb.rasterizer.rasterize(meshu);
		}
		else if (meshu.mesh().name == "radial") {
			sb.rasterizer.thumbnail(meshu, function(canvas) {
				sb.product.initialize(canvas, catalog);
				sb.rasterizer.rasterize(meshu);
			});
		}
	}

	// called when a next button is clicked
	function makeNextView() {
		var view = sb.viewhandler.view();
		switch (view) {
			case 'edit':
				meshu.updateBounds();
				meshu.mesh().interactive(true);

				generateProductThumbnails();
				break;

			case 'make':
			case 'readymade':
				meshu.mesh().interactive(false);

				// animate meshu
				var product = sb.materializer.product();
				var t = sb.transforms[product]["render"];

				meshu.animateTransform(sb.rotator ? sb.rotator.rotation() : 0, t.scale, t.transform.x, t.transform.y);

				// add the product class to the mesh
				d3.select(".delaunay").attr("class","delaunay "+product);

				// update the render background to be the product preview
				var productPreview = static_url + 'images/render/' + product + '_preview.jpg',
					url = "url(" + productPreview + ")";
				$(".render").css("background-image", url);
				break;

			case 'review':
				orderForm.updated();
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

			case 'make':
			case 'readymade':
				meshu.mesh().interactive(true);
				meshu.animateTransform(0, 1, 0, 0);
				break;
		}
	}

	$(".show-places").click(function(){
		$("#display-places").slideToggle();
		$(".show-places").toggle();
	});
});