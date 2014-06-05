(function () {
    var root = this;

    root.commafy = function (int) {
      var r;
      int += "";
      r = /(\d+)(\d{3})/;
      while (r.test(int)) {
        int = int.replace(r, "$1,$2");
      }
      return int;
    };

    var buildInfo = function () {
        var info = L.control();
        var station_tmpl = _.template($(".tmpl.station").html());
        var hover_help = "Hover over any station for details. Click on a station to zoom in."

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        info.update = function (station) {
            this._div.innerHTML = station ? station_tmpl(station) : hover_help;
        };

        return info;
        
    };

    var buildMarkers = function(stations, info, map) {
        var trip_totals = _.pluck(stations, "trips_total");
        var max_trips = Math.max.apply(Math.max, trip_totals);
        
        //var scale = chroma.scale(['#0077EE', '#EE3322'])
        var scale = chroma.scale(['#00CCFF', "#FFF", '#FF0099'])
            .domain([0.0, 0.25, 0.50], 20)
            .mode('lab');
        var scaleColor = function (pct) {
            return scale(pct).hex();
        }; 

        var scaleRadius = function (total, max) {
            return 10 * Math.sqrt(Math.max(0.2, (total / max)));
        };

        var highlightFeature = function (e) {
            var marker = e.target;
            marker._styles = marker.options;
            marker.setStyle({
                color: "#ee3322",
                weight: 2,
                opacity: 1
            });
            info.update(marker.station);
        };

        var resetHighlight = function (e) {
            var marker = e.target;
            marker.setStyle(marker._styles);
            info.update();
        };

        var zoomHighlight = function (e) {
            map.setView(e.target._latlng, map.getZoom() + 1);
        };

        var markers = _.map(stations, function (s) {
            var marker = L.circleMarker(s.lat_lng, {
                radius: scaleRadius(s.trips_total, max_trips),
                weight: 1,
                opacity: 1,
                color: "#000",
                fillOpacity: 1,
                fillColor: scaleColor(s.fpct_total)
            });
            marker.station = s;
            marker.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomHighlight
            });
            //marker.bindPopup(station_tmpl(s));
            return marker;
        });

        return markers;
    };

    var buildMap = function (stations, tile_layers, div) {

        _.each(stations, function (s) {
            s.lat_lng = new L.LatLng(s.lat, s.lng);
        });

        var lat_lngs = _.pluck(stations, "lat_lng");
        var bounds = L.latLngBounds(lat_lngs);

        var map = new L.Map(div, {
            scrollWheelZoom: false,
            minZoom: 9
        });

        map.fitBounds(bounds);

        _.each(tile_layers, function (layer) {
            map.addLayer(layer);
        });

        var info = buildInfo(map);
        var markers = buildMarkers(stations, info, map);

        info.addTo(map);
        L.layerGroup(markers)
            .addTo(map);
    };

    var mapStations = function (stations_url, tile_layers, div) {
        $.getJSON(stations_url, function (stations) {
            buildMap(stations, tile_layers, div);
        });
    };

    root.BuzzFeedNews = root.BuzzFeedNews || {};
    root.BuzzFeedNews.local = {
        mapStations: mapStations
    };
        
}).call(this);
