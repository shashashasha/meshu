$(function() {
	var views = ["edit","make","checkout"];
	var content = $("#content");
	// create a meshu object for every frame class div
	$(".frame").each(function(i, e) {
		var meshu = sb.meshu(e);
	});
	$(".next").click(function(){
		var index = views.indexOf(content.attr("class"));
		content.attr("class",views[index+1]);
	});
	$(".back").click(function(){
	    var index = views.indexOf(content.attr("class"));
		content.attr("class",views[index-1]);
	});
	$(".option-list li").click(function(){
		$(this).parent().find("li").removeClass("selected");
		$(this).addClass("selected");
	});
	$("ul.material-list li").click(function(){
		$(".total-cost").text($(this).find(".price").text());
	})

	
});