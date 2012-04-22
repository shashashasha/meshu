$(function() {

	d3.selectAll("#master-svg").attr("class","meshu-svg")
	d3.selectAll("#delaunay").each(function(){ ///Until there are no more id'd meshus in the gallery
		var node = d3.select(this);
		var t = node.attr("transform") || "";
		node.attr("transform","scale(.37) " + t).style("display","block");
	});
	d3.selectAll(".delaunay").each(function(){
		var node = d3.select(this);
		var t = node.attr("transform") || "";
		node.attr("transform","scale(.37) " + t).style("display","block");
	});

	var prices = {"earrings":"$75-$150",
				  "pendant":"$70-$130",
				  "necklace":"$80-$150"};
	var displayNames = {"earrings":"Pair of Earrings",
						"pendant":"Small Pendant Necklace",
						"necklace":"Large Necklace",
						"cufflinks": "Pair of Cufflinks"};

	$(".description").each(function(){
		var type = $(this).text();
		$(this).text(displayNames[type] + ", " + prices[type]);
	});

	// if it's a user page, logout redirects to the home page
	var view = $("#content").attr("class");
	if (view == 'user') {
		user.logoutRedirect = '/';
	}
});