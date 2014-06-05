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

    root.percentify = function (num, dec) {
        var mult = Math.pow(10, dec);
        return Math.round(num * 100 * mult) / mult;
    };

    var buildInfo = function () {
        var info = L.control();
        var station_tmpl = _.template($(".tmpl.station").html());
        var hover_help = "Hover over any station for details. Click on a station to zoom in."

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info map-control');
            this.update();
            return this._div;
        };

        info.update = function (station) {
            this._div.innerHTML = station ? station_tmpl(station) : hover_help;
        };

        return info;
        
    };

    var highlightMarker = function (marker, info) {
        marker._styles = marker.options;
        marker.setStyle({
            color: "#ee3322",
            weight: 2,
            opacity: 1
        });
        info.update(marker.station);
    };

    var resetMarker = function (marker, info) {
        marker.setStyle(marker._styles);
        info.update();
    };

    var zoomToMarker = function (marker, map) {
        map.setView(marker._latlng, map.getZoom() + 1);
    };

    var buildMarkers = function(stations, map, info) {
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

        var markers = _.map(stations, function (s) {
            // Create marker
            var marker = L.circleMarker(s.lat_lng, {
                radius: scaleRadius(s.trips_total, max_trips),
                weight: 1,
                opacity: 1,
                color: "#000",
                fillOpacity: 1,
                fillColor: scaleColor(s.fpct_total)
            });

            // Attach station data
            marker.station = s;

            // Attach events
            marker.on({
                mouseover: function (e) { highlightMarker(e.target, info); },
                mouseout: function (e) { resetMarker(e.target, info); },
                click: function (e) { zoomToMarker(e.target, map); }
            });

            return marker;
        });

        return markers;
    };

    var buildTopStations = function (markers, map, info) {
        var holder = L.control({ position: "bottomright" });
        var group_tmpl = _.template($(".tmpl.station-group").html());
        var item_tmpl = _.template($(".tmpl.station-item").html());

        var sorted = _.sortBy(markers, function (m) {
            return m.station.fpct_total;
        });

        var group_size = 5;

        var groups = [
            {
                name: "Least-Female",
                markers: sorted.slice(0, group_size)
            },
            {
                name: "Most-Female",
                markers: sorted.slice(-1 * group_size).reverse()
            }
        ];

        holder.onAdd = function (map) {
            var inner = L.DomUtil.create('div', 'map-control station-list');
            var $inner = $(inner);
            var $groups = _.map(groups, function (group) {
                var $group = $(group_tmpl({ group: group }));
                var $stations = _.map(group.markers, function (m) {
                    var $station = $(item_tmpl({ station: m.station }));
                    $station.on("mouseover", function (e) {
                        highlightMarker(m, info);
                    });
                    $station.on("mouseout", function (e) {
                        resetMarker(m, info);
                    });
                    $station.on("click", function (e) {
                        zoomToMarker(m, map);
                    });
                    return $station;
                });
                $group.find(".station-group-stations").append($stations);
                return $group;
            });
            $inner.append($groups);
            return inner;
        };

        return holder;
    };

    var buildMap = function (stations, tile_layers, div) {

        _.each(stations, function (s) {
            s.lat_lng = new L.LatLng(s.lat, s.lng);
        });

        var lat_lngs = _.pluck(stations, "lat_lng");
        var bounds = L.latLngBounds(lat_lngs);

        var map = new L.Map(div, {
            scrollWheelZoom: false,
            minZoom: 9,
            attributionControl: false
        });
        L.control.attribution({position: 'bottomleft'}).addTo(map);

        map.fitBounds(bounds);

        _.each(tile_layers, function (layer) {
            map.addLayer(layer);
        });

        var info = buildInfo();
        var markers = buildMarkers(stations, map, info);
        var top_stations = buildTopStations(markers, map, info);

        info.addTo(map);
        top_stations.addTo(map);
        L.layerGroup(markers).addTo(map);
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
