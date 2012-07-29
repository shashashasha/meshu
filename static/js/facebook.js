var sb = sb || {};
sb.facebook = {};

sb.facebook.initialize = function(FB) {
    // if you want to just go back to manual mode
    $("#finish-button").click(function() {
        window.location = "/make/#skipintro";
    });

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

        delay += 300;

        setTimeout(function() {
            return function() {
                var frame = $("<div>").addClass("mini-meshu");
                var title = $("<div>").addClass("title").html(e.name);

                frame.append(title).fadeIn();

                $("#maps").append(frame);

                var meshu = sb.minimeshu(frame[0]);
                setTimeout(function() {
                    meshu.locations(e.locations);
                }, 100);

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

    /* 
        add all our places to the page 
    */
    var addMeshus = function() {
        var areaSort = function(a, b) {
            return b.locations.length - a.locations.length;
        };

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
    };

    var totalCheckinsSeen = 0;
    var processLocations = function(response) {
        var checkins = response.data;
        if (!checkins || !checkins.length) {
            addMeshus();
            return;
        }

        totalCheckinsSeen += response.data.length;

        // go through all checkins
        $.each(checkins, function(i, e) {
            if (!e.place || !e.place.location || !e.place.location.city) return;

            var city = e.place.location.city;
            var country = e.place.location.country;

            var location = {
                latitude: e.place.location.latitude,
                longitude: e.place.location.longitude,
                name: e.place.name,
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
            countVenue(countryArray, country, cityLocation, city);

            // count states for the usa
            var state = e.place.location.state;
            if (state && country == 'United States') {
                // again, fuck you
                if (stateAbbreviations[state.toUpperCase()]) {
                    state = stateAbbreviations[state.toUpperCase()];
                }
                checkArea(statesArray, state);
                countVenue(statesArray, state, cityLocation, cityLocation.name);
            }
        });

        $.ajax({
            url: response.paging.next,
            dataType: 'jsonp',
            success: function(response) {
                if (response.data.length) {
                    $(".page-header").html("Loaded " + totalCheckinsSeen + " places...");
                    processLocations(response);
                } else {
                    $(".page-header").html("Each meshu is a different set of places. Choose one to get started!");
                    addMeshus();
                }
            }, error: function(e){
                console.warn(e);
            }
        });
    }

    FB.login(function(response) {
        if (response.authResponse) {
            console.log('Welcome!  Fetching your information.... ');

            FB.api('/me/locations?limit=50', function(response) {
                console.log(response);
                processLocations(response);
            });
        } else {
            console.log('User cancelled login or did not fully authorize.');
        }
    },{
        scope: 'email, user_photos, friends_photos, user_status, friends_status, user_checkins, friends_checkins'
    });

};