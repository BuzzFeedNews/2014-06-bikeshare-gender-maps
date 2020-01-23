(function () {
    var VALID_CITIES = [
        "nyc",
        "boston",
        "chicago",
    ]

    // Use fastly HTTPS endpoint
    stamen.tile.providers["toner"].url = "https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png";

    var layer_types = {
        toner: function () {
            var layer = new L.StamenTileLayer("toner");
            layer.setOpacity(0.5);
            return layer;
        }
    };

    var layers = [ layer_types.toner ];

    var mapFromCity = function (city) {
        var city = city || "nyc";

        if (VALID_CITIES.indexOf(city) < 0) { return; }

        var url = "data/" + city  + ".csv";

        var initialized_layers = _.map(layers, function (layer) {
            return layer();
        });

        var $holder = $(".iframed-map-holder");
        var $map = $("<div class='map " + city + "'></div>");
        $holder.append($map);

        BuzzFeedNews.local.mapStations(url, initialized_layers, $map[0]);
    };

    var city = location.hash.slice(1);
    mapFromCity(city);

}).call(this);

