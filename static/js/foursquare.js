/*
    this is the listener to the "connect with foursquare" button
*/
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

    // if you want to just go back to manual mode
    $("#finish-button").click(function() {
        window.location = "/make/#skipintro";
    });

    // no token
    if (!token || !token.length) {
        return;
    }

    /*
        fuck you foursquare
    */
    var stateList = "Alabama,AL,Alaska,AK,Arizona,AZ,Arkansas,AR,California,CA,Colorado,CO,Connecticut,CT,Delaware,DE,Florida,FL,Georgia,GA,Hawaii,HI,Idaho,ID,Illinois,IL,Indiana,IN,Iowa,IA,Kansas,KS,Kentucky,KY,Louisiana,LA,Maine,ME,Maryland,MD,Massachusetts,MA,Michigan,MI,Minnesota,MN,Mississippi,MS,Missouri,MO,Montana,MT,Nebraska,NE,Nevada,NV,New Hampshire,NH,New Jersey,NJ,New Mexico,NM,New York,NY,North Carolina,NC,North Dakota,ND,Ohio,OH,Oklahoma,OK,Oregon,OR,Pennsylvania,PA,Rhode Island,RI,South Carolina,SC,South Dakota,SD,Tennessee,TN,Texas,TX,Utah,UT,Vermont,VT,Virginia,VA,Washington,WA,West Virginia,WV,Wisconsin,WI,Wyoming,WY";
    var pairs = stateList.split(',');
    var stateAbbreviations = {};
    for (var i = 1; i < pairs.length; i+=2) {
        stateAbbreviations[pairs[i]] = pairs[i-1];
    }

    var selectMeshu = function(meshu, title) {
        return function() {
            $("#svg-file").val(meshu.outputSVG());
            $("#meshu-data").val(meshu.outputLocationData());
            $("#meshu-title").val(title);

            $("#meshu-select-form").submit();
        };
    };

    var locations = [];

    var places = {
        all: {
            name: 'All Cities',
            locations: []
        }
    };

    var placesArray = [];
    var statesArray = [];
    var countryArray = [];

    /* 
        add a "place", this could be a city, country, or state
    */
    var delay = 0;
    var addPlace = function(i, e) {
        // ignore if there aren't enough locations
        if (e.locations.length < 3) {
            return;
        }

        delay += 500;

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

    var checkArea = function(areaList, area) {
        if (!places[area]) {
            places[area] = {
                name: area,
                locations: [],
                seen: {}
            };   

            areaList.push(places[area]);
        }
    };

    var countVenue = function(areaList, area, location, uniqueCheck) {

        // add location if we haven't seen it before
        if (!places[area].seen[uniqueCheck]) {
            places[area].locations.push(location);
            places[area].seen[uniqueCheck] = location;    
        } else {
            places[area].seen[uniqueCheck].times++;
        }

    };

    var areaSort = function(a, b) {
        return b.locations.length - a.locations.length;
    };

    $.ajax({
        url: url,
        dataType: 'json',
        success: function(data) {
            var checkins = data.response.checkins.items;


            // go through all checkins
            $.each(checkins, function(i, e) {
                if (!e.venue.location.city) return;

                var city = e.venue.location.city;
                var country = e.venue.location.country;

                var location = {
                    latitude: e.venue.location.lat,
                    longitude: e.venue.location.lng,
                    name: e.venue.name,
                    times: 1
                };

                var cityLocation = {
                    name: city,
                    latitude: location.latitude,
                    longitude: location.longitude
                };

                // make new city object
                if (!places[city]) {
                    places['all'].locations.push(cityLocation);
                }

                checkArea(placesArray, city);
                checkArea(countryArray, country);

                countVenue(placesArray, city, location, location.name);
                countVenue(countryArray, country, location, city);

                // count states for the usa
                var state = e.venue.location.state;
                if (state && country == 'United States') {
                    // again, fuck you
                    if (stateAbbreviations[state.toUpperCase()]) {
                        state = stateAbbreviations[state.toUpperCase()];
                    }
                    checkArea(statesArray, state);
                    countVenue(statesArray, state, cityLocation, cityLocation.name);
                }
            });

            // sort by number of locations
            placesArray.sort(areaSort);
            statesArray.sort(areaSort);
            countryArray.sort(areaSort);

            // add countries first, and if we only've been to one country, 
            // don't show individual countries
            if (countryArray.length > 1) {
                countryArray.unshift(places.all);
                $.each(countryArray, addPlace);    
            } else {
                addPlace(0, places.all);
            }

            if (statesArray.length > 1) {
                $.each(statesArray, addPlace);
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