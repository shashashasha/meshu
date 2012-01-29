$(function() {
	// create a meshu object for every frame class div
	$(".frame").each(function(i, e) {
		var meshu = sb.meshu(e);
	});
	$("#next").click(function(){
	    $("#content").attr("class","materials")
	});
	$("#back").click(function(){
	    $("#content").attr("class","edit")
	});
	$(".option-list li").click(function(){
		$(this).parent().find("li").removeClass("selected");
		$(this).addClass("selected");
	});
	$("ul.material-list li").click(function(){
		$(".total-cost").text($(this).find(".price").text());
	})

	
});