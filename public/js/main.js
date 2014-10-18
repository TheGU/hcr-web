(function () {
    var module = angular.module("hcr-map-path", ["google-maps"]);
}());


function MapController($scope, $timeout, $log, $http, Logger) {
    Logger.doLog = true
    // Enable the new Google Maps visuals until it gets enabled by default.
    // See http://googlegeodevelopers.blogspot.ca/2013/05/a-fresh-new-look-for-maps-api-for-all.html
    google.maps.visualRefresh = true;

    $scope.controlMsg = "";
    
    $scope.drawLine = false;
    $scope.editLine = false;
    $scope.drawLineToggleButton = "Draw Line";
    $scope.editLineToggleButton = "Edit Line";

    var count = 1;
    $scope.dataMarkers = [];
    var markers = [];
    var polylinesPath = [
        {
            id: 'b1',
            name: 'mochit bts',
            station: true,
            latitude: 13.802359,
            longitude: 100.553859
        },
        {
            id: 'b2',
            name: 'saphankwai bts',
            station: true,
            latitude: 13.793586,
            longitude: 100.549696
        },
        {
            id: 'b3',
            name: 'aree bts',
            station: true,
            latitude: 13.779686,
            longitude: 100.544696
        },
    ];


    var lineDash = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 4
    };

    var symbolThree = {
        path: 'M -2,-2 2,2 M 2,-2 -2,2',
        strokeColor: '#292',
        strokeWeight: 4
    };

    angular.extend($scope, {
        map: {
            control: {},
            version: "uknown",
            showTraffic: true,
            showBicycling: false,
            showWeather: false,
            showHeat: false,
            center: {
                latitude: 13.761061514752807,
                longitude: 100.54258346557617
            },
            options: {
                streetViewControl: true,
                panControl: true,
                maxZoom: 20,
                minZoom: 3
            },
            zoom: 12,
            dragging: false,
            bounds: {},

            events: {
                tilesloaded: function (map, eventName, originalEventArgs) {

                },
                click: function (mapModel, eventName, originalEventArgs) {
                    // 'this' is the directive's scope
                    $log.log("user defined event: " + eventName, mapModel, originalEventArgs);

                    var e = originalEventArgs[0];
                    var lat = e.latLng.lat(),
                        lon = e.latLng.lng();
                    $scope.clickInfo = {
                        id: 0,
                        title: 'Clicked here ' + 'lat: ' + lat + ' lon: ' + lon,
                        latitude: lat,
                        longitude: lon
                    };

                    if ($scope.drawLine) {
                        polylinesPath.push({
                            id: 'm' + count,
                            name: '',
                            station: false,
                            latitude: lat,
                            longitude: lon
                        });
                        markers.push(createMarker('m' + count, lat, lon));
                        count = count + 1;
                        $scope.dataMarkers = markers;

                    }
                    //$log.log("Marker: " + markers);
                    //scope apply required because this event handler is outside of the angular domain
                    $scope.$apply();
                },
                dragend: function () {
                    self = this;
                }
            },

            polylines: [
                {
                    id: 1,
                    path: polylinesPath,
                    stroke: {
                        color: '#F00',
                        weight: 3
                    },
                    editable: false,
                    draggable: false,
                    geodesic: true,
                    visible: true
                }
            ]

        },
        toggleColor: function (color) {
            return color == 'red' ? '#6060FB' : 'red';
        }

    });


    $scope.removeMarkers = function () {
        $log.info("Clearing markers. They should disappear from the map now");
        $scope.map.polylines = [];
        $scope.map.infoWindow.show = false;
    };

    $scope.refreshMap = function () {
        //optional param if you want to refresh you can pass null undefined or false or empty arg
        $scope.map.control.refresh({latitude: 13.761061514752807, longitude: 100.54258346557617});
        $scope.map.control.getGMap().setZoom(12);
        return;
    };

    $scope.drawLineToggle = function () {
        $scope.drawLine = !$scope.drawLine;
        if ($scope.drawLine) {
            $log.info("Enable drawline");
            $scope.controlMsg = "Click anywhere to draw a line from last point. Click [Done] to submit";
            $scope.drawLineToggleButton = "Done";
            genMarkerFromPath(polylinesPath);
            $scope.dataMarkers = markers;
        } else {
            $log.info("Disable drawline");
            $scope.controlMsg = "";
            $scope.drawLineToggleButton = "Draw Line";
        }
        return;
    }

    $scope.editLineToggle = function () {
        $scope.editLine = !$scope.editLine;
        $scope.map.polylines[0].editable = $scope.editLine;
        if ($scope.editLine) {
            $log.info("Enable editline");
            $scope.controlMsg = "Click and drag on white dot to reposition. Click and drag fade dot to create dot between current dots.";
            $scope.editLineToggleButton = "Done";
            $scope.dataMarkers = [];
        } else {
            $log.info("Disable editline");
            $scope.controlMsg = "";
            $scope.editLineToggleButton = "Edit Line";
            genMarkerFromPath(polylinesPath);
            $scope.dataMarkers = markers;
        }
        return;
    }

    $scope.deleteInPath = function (idx) {
        $scope.map.polylines[0].path.splice(idx, 1);
        genMarkerFromPath(polylinesPath);
        return;
    };

    $scope.markersEvents = {
        click: function (gMarker, eventName, model) {
            if (model.$id) {
                model = model.coords;//use scope portion then
            }
        }
    };

    var createMarker = function (i, latitude, longitude, idKey) {
        if (idKey == null) {
            idKey = "id";
        }

        // Note, the label* properties are only used if isLabel='true' in the directive.
        var ret = {
            options: {
                draggable: false,
                labelAnchor: '-6 8',
                labelContent: i,
                labelClass: 'labelMarker',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 5,
                    strokeWeight: 1,
                    fillColor: '#FFF',
                    fillOpacity: 1,
                }
            },
            latitude: latitude,
            longitude: longitude,
            title: 'm-' + i
        };
        ret[idKey] = i;
        return ret;
    };

    var genMarkerFromPath = function (path) {
        markers = [];
        for (var i = 0; i < path.length; i++) {
            markers.push(createMarker(path[i].id, path[i].latitude, path[i].longitude));
        }
        $scope.dataMarkers = markers;
        $scope.$apply();
        return;
    };
    genMarkerFromPath(polylinesPath);

}
