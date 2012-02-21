$(function() {

	d3.selectAll("#master-svg").attr("class","meshu-svg");
	d3.selectAll("#delaunay").attr("transform","scale(.36)");

	var prices = {"earrings":"$40-$90",
						"smallNecklace":"$40-$90",
						"largeNecklace":"$40-$90"};

	$(".price-range").each(function(){
		var type = $(this).text();
		$(this).text(", " + prices[type]);
	});
	
});