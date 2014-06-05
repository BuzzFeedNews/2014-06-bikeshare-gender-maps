(function () {
    var cities = [
        "chicago",
        "nyc",
        "boston"
    ];

    var city_to_url = function (c) {
        return "data/" + c + ".json";
    };

    var layers = {
        toner: function () {
            var layer = new L.StamenTileLayer("toner");
            layer.setOpacity(0.5);
            return layer;
        },
        watercolor: function () { return new L.StamenTileLayer("watercolor") },
        terrain_bg: function () {
            return L.tileLayer('http://{s}.tile.stamen.com/terrain-background/{z}/{x}/{y}.png', {
                attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
                subdomains: 'abcd',
                minZoom: 4,
                maxZoom: 18
            })
        },
        acetate_roads: function () {
            return L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-roads/{z}/{x}/{y}.png', {
                attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
                subdomains: '0123',
                minZoom: 2,
                maxZoom: 18
            });
        },
        shaded: function () {
            return L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
                maxZoom: 13
            });
        }
    };

    var layer_groups = [
//        [ layers.shaded, layers.acetate_roads ],
        [ layers.toner ],
//        [ layers.watercolor ],
//        [ layers.watercolor, layers.acetate_roads ]
    ];

    var $maps = $(".maps");
    _.each(layer_groups, function (lg) {
        var $mapgroup = $("<div class='map-group'></div>");
        $maps.append($mapgroup);
        _.each(cities, function (city) {
            var $holder = $("<div class='map-holder'></div>");
            var $div = $("<div class='map " + city + "'></div>");
            $holder.append($div);
            $mapgroup.append($holder);
            var layers = _.map(lg, function (layer) {
                return layer();
            });
            BuzzFeedNews.local.mapStations(city_to_url(city), layers, $div[0]);
        });
    });

}).call(this);

