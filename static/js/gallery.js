$(function() {

	// var prices = {"earrings":"$75-$150",
	// 			  "pendant":"$70-$130",
	// 			  "necklace":"$80-$150"};
	// var displayNames = {"earrings":"Pair of Earrings",
	// 					"pendant":"Small Pendant Necklace",
	// 					"necklace":"Large Necklace",
	// 					"cufflinks": "Pair of Cufflinks"};

	// $(".description").each(function(){
	// 	var type = $(this).text();
	// 	$(this).text(displayNames[type] + ", " + prices[type]);
	// });

	// if it's a user page, logout redirects to the home page
	var view = $("#content").attr("class");
	if (view == 'user') {
		user.logoutRedirect = '/';
	}
});