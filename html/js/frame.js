(function () {
    var city_to_url = function (c) {
        return "data/" + c + ".csv";
    };

    var layer_types = {
        toner: function () {
            var layer = new L.StamenTileLayer("toner");
            layer.setOpacity(0.5);
            return layer;
        }
    };

    var layers = [ layer_types.toner ];

    var mapFromCity = function (city) {
        var url = city_to_url(city);

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

