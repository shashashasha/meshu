$(function() {

	d3.selectAll("#master-svg").attr("class","meshu-svg");
	d3.selectAll("#delaunay").attr("transform","scale(.39)");

	var prices = {"earrings":"$50-$120",
						"smallNecklace":"$45-$100",
						"largeNecklace":"$50-$120"};

	$(".price-range").each(function(){
		var type = $(this).text();
		$(this).text(", " + prices[type]);
	});

	// if it's a user page, logout redirects to the home page
	var view = $("#content").attr("class");
	if (view == 'user') {
		user.logoutRedirect = '/';
	}
});