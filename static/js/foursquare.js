$(".foursquare-auth").click(function() {
    var client = 'AJXTWLOH1K5RIWG33XSGQZHRISL5CCJ0XG1VUL3NAKDYYPMM';
    var redirect = 'http://meshu.io/make/foursquare/';
    var foursquareAuth = 'https://foursquare.com/oauth2/authenticate?client_id={client}&response_type=token&redirect_uri={redirect}';
    
    var url = foursquareAuth.replace('{client}', client).replace('{redirect}', redirect);
    window.location = url;
});

/*
	combining the foursquare auth call to action code 
	with the code to process foursquare data, sorry...
*/

var sb = sb || {};
sb.foursquare = {};

sb.foursquare.initialize = function() {
    var hash = window.location.hash,
        token = hash.split('=').pop(),
        api = "https://api.foursquare.com/v2/users/self/checkins?oauth_token={token}&v={v}&limit=250",
        url = api.replace('{token}', token).replace('{v}', '20120102');

    // no token
    if (!token || !token.length) {
        return;
    }

    var selectMeshu = function(meshu, title) {
        return function() {
            $("#svg-file").val(meshu.outputSVG());
            $("#meshu-data").val(meshu.outputLocationData());
            $("#meshu-title").val(title);

            $("#meshu-select-form").submit();
        };
    };
    
    $("#finish-button").click(function() {
        window.location = "/make/#skipintro";
    });

    var locations = [];

    var places = {
        all: {
            name: 'All Cities',
            locations: []
        }
    };

    var placesArray = [];
    var countryArray = [];

    $.ajax({
        url: url,
        dataType: 'json',
        success: function(data) {
            var checkins = data.response.checkins.items;


            // go through all checkins
            $.each(checkins, function(i, e) {
                if (!e.venue.location.city) return;

                var location = {
                    latitude: e.venue.location.lat,
                    longitude: e.venue.location.lng,
                    name: e.venue.name,
                    times: 1
                };

                var city = e.venue.location.city;
                var country = e.venue.location.country;

                // make new city object
                if (!places[city]) {
                    places[city] = {
                        name: city,
                        locations: [],
                        seen: {}
                    };    

                    places['all'].locations.push({
                        name: city,
                        latitude: location.latitude,
                        longitude: location.longitude
                    });

                    placesArray.push(places[city]);
                }

                // add location if we haven't seen it before
                if (!places[city].seen[location.name]) {
                    places[city].locations.push(location);
                    places[city].seen[location.name] = location;    
                } else {
                    places[city].seen[location.name].times++;
                }

                if (!places[country]) {
                    places[country] = {
                        name: country,
                        locations: [],
                        seen: {}
                    };

                    countryArray.push(places[country]);
                }

                // add location if we haven't seen it before
                if (!places[country].seen[city]) {
                    places[country].locations.push(location);
                    places[country].seen[city] = true;    
                }
            });

            // sort by number of locations
            placesArray.sort(function(a, b) {
                return b.locations.length - a.locations.length;
            });

            countryArray.sort(function(a, b) {
                return b.locations.length - a.locations.length;
            });


            var delay = 0;

            var addPlace = function(i, e) {
                if (e.locations.length < 3) {
                    // console.log("ignoring", e.name, "too few checkins!");
                    return;
                }

                delay += 500; // e.locations.length > 10 ? 500 : 3000;

                setTimeout(function() {
                    return function() {
                        var frame = $("<div>").addClass("mini-meshu");
                        var title = $("<div>").addClass("title").html(e.name);

                        frame.append(title);

                        $("#maps").append(frame);

                        var meshu = sb.minimeshu(frame[0]);
                        meshu.locations(e.locations);     

                        frame.click(selectMeshu(meshu, e.name));
                    };
                }(), delay);
            };

            // add countries first, and if we only've been to one country, 
            // don't show individual countries
            if (countryArray.length > 1) {
                countryArray.unshift(places.all);
                $.each(countryArray, addPlace);    
            } else {
                addPlace(0, places.all);
            }
            
            if (placesArray.length) {
            	$.each(placesArray, addPlace);
            } else {
            	// error handling
            	$(".page-header").html("Oh no! Not enough checkins to make any meshus.");
            	$("#finish-button").html("Make one manually");
            }
            
        }
    });
};