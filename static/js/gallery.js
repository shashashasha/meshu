$(function() {

	// if it's a user page, logout redirects to the home page
	var view = $("#content").attr("class");
	if (view == 'user') {
		user.logoutRedirect = '/';
	}
});