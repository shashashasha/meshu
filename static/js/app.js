$(function() {

	// create a stripe payment object
	orderer.catalog(sb.catalog);
	sb.materializer.initialize(sb.catalog);

	// create a meshu object for a single meshu container
	var meshu = sb.meshu($("#meshu-container")[0]);

	// hotfix for postcard pages
	meshu.zoomOffset = window.location.href.search("postcard") > 0 ? -.25 : 0;

	meshu.isReadymade = loadedMeshu && loadedMeshu.product != '';

	// initialize ordering ui
	// it listens to when the form ui is validated, then moves to the review view
	sb.ui.orderer(meshu).on("validated", function() {
		content.attr("class", "review");
		makeNextView('review');
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

		// if svg is enabled
		if ($("html").hasClass("svg")) {
			if (meshu.isReadymade) {
				// readymade.js
				try {
					readymade.initialize(meshu);	
				}
				catch(e) {
					// ignore if we don't have readymade.js
				}
			}

			if (pageType == 'view') {
				meshu.map().buffer(0);
			}
			
			meshu.locationData(loadedMeshu.location_data);
		}

		// checking the page view type, setting our flows accordingly
		user.updateLogoutActions(pageType);

		// initialize product picker
		sb.product.initialize(".delaunay", sb.catalog);

		// viewhandler handles next / prev buttons, shuffling account view
		sb.viewhandler.updateViews(pageType);

		switch (pageType) {
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

		$("#finish-button").addClass("active");
		$("#meshu-container").removeClass("inactive");
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

		d3.select("#place-number")
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
		Checking if we need to show the initial helper modal
	*/	
	var hash = window.location.hash;
	var showIntro = function() {
		$("#edit-help").fadeIn();
		$("#modal-bg").fadeIn();
		$("#close-help").click(function(){
			$("#edit-help").fadeOut();
			$("#modal-bg").fadeOut();
		});
	};
	if (!user.loggedIn && !loadedMeshu && hash != '#skipintro') {
		showIntro();
	} else if (hash == '#showintro') {
		showIntro();
		window.location.hash = "";
	} else if (hash == '#skipintro') {
		window.location.hash = "";
	}

	/* 
		This handles when people select a product to order
		and go to the materials / color selection page
	*/
	$("#product-preview svg").live("click", function() {

		var product = $(this).attr("id").split("-")[1];
		
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

	// called when a next button is clicked
	function makeNextView() {
		var view = sb.viewhandler.view();
		switch (view) {
			case 'edit':
				meshu.updateBounds();

				meshu.mesh().updateCircleBehavior();

				// initialize product picker
				// todo - fix
				sb.product.initialize(".delaunay", sb.catalog);

				// rasterize the meshu, add it as an image on to the page 
				// this means we can then pin it / fb it
				console.log('rasterizing', meshu);
				sb.rasterizer.rasterize(meshu);
				break;

			case 'make':
			case 'readymade':
				meshu.mesh().updateCircleBehavior(true);
				// animate meshu
				var product = sb.materializer.product();
				var t = sb.transforms[product]["render"];
				meshu.animateTransform(sb.rotator ? sb.rotator.rotation() : 0, t.scale, t.transform.x, t.transform.y);
				d3.select(".delaunay").attr("class","delaunay "+product);

				// update the render background to be the product preview
				var productPreview = static_url + 'images/render/' + product + '_preview.jpg';
				$(".render").css("background-image","url(" + productPreview + ")");
				break;
		}
	}

	// called when a back button is clicked
	function makePrevView() {
		var view = sb.viewhandler.view();
		switch (view) {
			case 'edit':
				meshu.mesh().updateCircleBehavior();
				break;

			case 'make':
			case 'readymade':
				meshu.mesh().updateCircleBehavior();
				meshu.animateTransform(0, 1, 0, 0);
				break;
		}
	}

	$(".show-places").click(function(){
		$("#display-places").slideToggle();
		$(".show-places").toggle();
	});
});