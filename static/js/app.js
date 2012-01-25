$(function() {

	var place = window.location.hash;
	if(place.charAt(0) == '#')
    	place = place.substr(1);
	$("#content").addClass(place);
	console.log(place);

	// create a meshu object for every frame class div
	$(".frame").each(function(i, e) {
		var meshu = sb.meshu(e);
	});
	$("#next").click(function(){
	    $("#content").addClass("materials")
	});
	$("#back").click(function(){
	    $("#content").removeClass("materials")
	});
	$(".option-list li").click(function(){
		$(this).parent().find("li").removeClass("selected");
		$(this).addClass("selected");
	});
	$("ul.material-list li").click(function(){
		$(".total-cost").text($(this).find(".price").text());
	})

	
});