$(function() {

	d3.selectAll("#master-svg").attr("class","meshu-svg");
	d3.selectAll("#delaunay").attr("transform","scale(.37)");

	var prices = {"earrings":"$75-$150",
						"pendant":"$70-$130",
						"necklace":"$80-$150"};

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