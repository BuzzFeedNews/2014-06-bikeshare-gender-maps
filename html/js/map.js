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

    var createMap = function (stations) {
        _.each(stations, function (s) {
            s.lat_lng = new L.LatLng(s.lat, s.lng);
        });
        var lat_lngs = _.pluck(stations, "lat_lng");
        var bounds = L.latLngBounds(lat_lngs);

        var map = new L.Map("toner", {
            scrollWheelZoom: false,
            minZoom: 9
        });
        map.fitBounds(bounds);
        var tile_layer = new L.StamenTileLayer("toner");
        //tile_layer.setOpacity(0.5)
        map.addLayer(tile_layer);

        var trip_totals = _.pluck(stations, "trips_total");
        var max_trips = Math.max.apply(Math.max, trip_totals);
        
        var scale = colorbrewer.RdBu[10].reverse();
        var scaleColor = function (pct) {
            return scale[Math.round(pct * 10 * 2)];
        }; 

        var scaleRadius = function (total, max) {
            return 10 * Math.sqrt(Math.max(0.1, total / max));
        };

        var station_tmpl = _.template($(".tmpl.station").html());

        var info = L.control();

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        var hover_help = "Hover over any station for details. Click on a station to zoom in."
        info.update = function (station) {
            this._div.innerHTML = station ? station_tmpl(station) : hover_help;
        };

        info.addTo(map);

        var highlightFeature = function (e) {
            var marker = e.target;
            marker._styles = marker.options;
            marker.setStyle({
                color: "#ee3322",
                weight: 4,
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
                weight: 2,
                opacity: 0.75,
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

        L.layerGroup(markers)
            .addTo(map);

    }

    $.getJSON("data/" + location.hash.slice(1) + ".json", createMap);
        
}).call(this);
