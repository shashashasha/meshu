$(function() {
	/*
		How we flip between images of readymades
	*/
	var timer;
	$("#img-thumbs img").click(function(){
		clearTimeout(timer);

		// <3
		var id = $(this).attr("id");
		if (!id) {
			$(".other-view").removeClass("active");
			timer = setTimeout(function(){ 
				$(".other-view").removeClass("z-1"); 
			}, 1000);
		}
		else {
			$("#l-"+id).addClass("active z-1");
		}
	});
});