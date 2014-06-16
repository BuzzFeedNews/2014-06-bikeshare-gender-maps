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

    var color_scale = chroma.scale(['#00CCFF', "#FFF", '#FF0099'])
        .domain([0.0, 0.25, 0.50], 20)
        .mode('lab');

    var scaleColor = function (pct) {
        return color_scale(pct).hex();
    }; 

    var buildLegend = function () {
        var holder = L.control({ position: "bottomleft" });
        var legend = holder._div = L.DomUtil.create("div", "legend map-control");
        var CHUNKS = 10;
        var MAX = 0.5;
        var inner_html = _.map(_.range(10), function (i) {
            return "<div class='legend-bar' style='width: " + 100/CHUNKS + 
                "%; background: " + scaleColor(MAX * i / CHUNKS) + "'></div>";
        }).join("");
        var html = "<div class='legend-bars'>" + inner_html + "</div>";
        legend.innerHTML = html;
        holder.onAdd = function (map) { return this._div; };
        return holder;
    };

    var buildLegendHTML = function () {
        var CHUNKS = 10;
        var MAX = 0.5;
        var inner = _.map(_.range(CHUNKS + 1), function (i) {
            return "<div class='legend-bar' style='width: " + 100/(CHUNKS + 1) + 
                "%; background: " + scaleColor(MAX * i / CHUNKS) + "'></div>";
        }).join("");
        var html = "<div class='legend'>" + 
            "<div class='legend-bars'>" + inner + "</div>" +
            "<div class='legend-text'>" + 
                "<span class='legend-text-left'>0%</span>" + 
                "<span class='legend-text-center'>Female Ridership</span>" + 
                "<span class='legend-text-right'>50%+</span>" + 
            "</div>";
        return html;
    };

    var buildInfo = function () {
        var info = L.control();
        var station_tmpl = _.template($(".tmpl.station").html());
        var hover_help = "<div class='helptext'>" +
            "<span class='helptext-main'>Hover over any station for details. Double-click on a station to zoom in.</span>" +
            "<span class='helptext-mobile'>Tap on any station for details.</span>" +
        "</div>";
        var legend = buildLegendHTML();
        var default_html = hover_help + legend;

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info map-control');
            this.update();
            return this._div;
        };

        info.update = function (station) {
            this._div.innerHTML = station ? station_tmpl(station) : default_html;
        };

        return info;
        
    };

    var highlightMarker = function (marker, info) {
        marker._styles = marker.options;
        marker.setStyle({
            fillColor: "#ffee00",
            weight: 2,
            opacity: 1
        });
        marker.prevPos = marker.$container.index();
        marker.bringToFront();
        info.update(marker.station);
    };

    var resetMarker = function (marker, info) {
        marker.setStyle(marker._styles);
        var $c = marker.$container;
        $c.insertBefore($c.parent().children()[marker.prevPos])
        info.update();
    };

    var zoomToMarker = function (marker, map) {
        map.setView(marker._latlng, map.getZoom() + 1);
    };

    var panToMarker = function (marker, map) {
        map.panTo(marker._latlng);
    };

    var buildMarkers = function (stations, map, info) {
        var trip_totals = _.pluck(stations, "trips_total");
        var max_trips = Math.max.apply(Math.max, trip_totals);
        
        var scaleRadius = function (total, max) {
            var pct = total / max;
            var floored = Math.max(0.2, pct);
            return 8 * Math.sqrt(floored);
        };

        var markers = _.map(stations, function (s) {
            // Create marker
            var marker = L.circleMarker(s.lat_lng, {
                radius: scaleRadius(s.trips_total, max_trips),
                weight: 1,
                opacity: 1,
                color: "#000",
                fillOpacity: 1,
                fillColor: scaleColor(s.fpct_total),
            });

            // Attach station data
            marker.station = s;

            // Attach events
            marker.on({
                mouseover: function (e) { highlightMarker(e.target, info); },
                mouseout: function (e) { resetMarker(e.target, info); },
                dblclick: function (e) { zoomToMarker(e.target, map); },
                add: function (e) {
                    marker.$container = $(marker._container);
                }
            });

            return marker;
        });

        return markers;
    };

    var buildTopStations = function (markers, map, info) {
        var holder = L.control({ position: "bottomright" });
        var group_tmpl = _.template($(".tmpl.station-group").html());
        var item_tmpl = _.template($(".tmpl.station-item").html());

        var filtered = _.filter(markers, function (m) {
            return m.station.trips_total >= 1000;
        });

        var sorted = _.sortBy(filtered, function (m) {
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
            var inner = L.DomUtil.create('div', 'map-control station-list top-stations');
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
                    $station.on("dblclick", function (e) {
                        zoomToMarker(m, map);
                    });
                    $station.on("click", function (e) {
                        panToMarker(m, map);
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
            doubleClickZoom: false,
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
        $.get(stations_url, function (csv) {
            var stations = $.parse(csv).results.rows;
            buildMap(stations, tile_layers, div);
        });
    };

    root.BuzzFeedNews = root.BuzzFeedNews || {};
    root.BuzzFeedNews.local = {
        mapStations: mapStations
    };
        
}).call(this);
