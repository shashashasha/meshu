$(".foursquare-auth").click(function() {
    var client = 'AJXTWLOH1K5RIWG33XSGQZHRISL5CCJ0XG1VUL3NAKDYYPMM';
    var redirect = 'http://meshu.io/make/foursquare/';
    var foursquareAuth = 'https://foursquare.com/oauth2/authenticate?client_id={client}&response_type=token&redirect_uri={redirect}';
    
    var url = foursquareAuth.replace('{client}', client).replace('{redirect}', redirect);
    window.location = url;
});