/**
 * Created by TheGU on 2015-01-31.
 */

var app = angular.module("demoapp", ['leaflet-directive']);

app.controller("DemoController", [ "$scope", function($scope) {
    // Nothing here!
}]);


angular.module('hcr-poll-collector', ['leaflet-directive'])
    .controller('PollController', function ($scope, $filter, $log, $timeout, $http, leafletData) {

        $scope.status_msg = "";
        $scope.savingForm = false;
        $scope.poll = {
            poll_date: $filter('date')(new Date, 'yyyy-MM-dd'),
            poll_6_1_start: {type: 'Point', coordinates: [], description: ''},
            poll_6_1_stop: {type: 'Point', coordinates: [], description: ''}
        }; 
    
        var local_icons = {
            defaultIcon: {},
            startIcon: {
                iconUrl: 'http://www.google.com/mapfiles/dd-start.png',
                shadowUrl: 'http://www.google.com/mapfiles/shadow50.png',
                iconSize:     [20, 34], // size of the icon
                shadowSize:   [50, 64], // size of the shadow
                iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
                shadowAnchor: [4, 62],  // the same for the shadow
                popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
            },
            endLeafIcon: {
                iconUrl: 'http://www.google.com/mapfiles/dd-end.png',
                shadowUrl: 'http://www.google.com/mapfiles/shadow50.png',
                iconSize:     [38, 95],
                shadowSize:   [50, 64],
                iconAnchor:   [22, 94],
                shadowAnchor: [4, 62],
                popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
            }
        }    
    
        angular.extend($scope, {
            map : {
                center: {
                    lat: 13.751390740782975,
                    lng: 100.62652587890625,
                    zoom: 11
                },
                layers: {
                    baselayers: {
                        googleRoadmap: {
                            name: 'Google Streets',
                            layerType: 'ROADMAP',
                            type: 'google'
                        },
                        googleTerrain: {
                            name: 'Google Terrain',
                            layerType: 'TERRAIN',
                            type: 'google'
                        },
                        googleHybrid: {
                            name: 'Google Hybrid',
                            layerType: 'HYBRID',
                            type: 'google'
                        }
                    }
                },
                markers : {},
                defaults: {
                    scrollWheelZoom: true
                }
            }
        });

       var bestFitZoom = function(){
            var bounds = L.latLngBounds(
                [$scope.map.markers.stop_marker.lat, $scope.map.markers.stop_marker.lng], 
                [$scope.map.markers.start_marker.lat, $scope.map.markers.start_marker.lng]
            );
            leafletData.getMap().then(function(map) {
                map.invalidateSize();
                map.fitBounds(bounds);
            });
        };
    
        $scope.$on("leafletDirectiveMap.geojsonClick", function(ev, featureSelected, leafletEvent) {
            geoClick(featureSelected, leafletEvent);
        });

        $scope.setMarkerStatus = 0;
        $scope.setStartMarkerStatus = false;
        $scope.setStopMarkerStatus = false;
        $scope.$on("leafletDirectiveMap.click", function(event, args){
            var leafEvent = args.leafletEvent;
            if ($scope.setStartMarkerStatus){
                $scope.map.markers.start_marker = {
                    lat: leafEvent.latlng.lat,
                    lng: leafEvent.latlng.lng,
                    message: "Start",
                    focus: true,
                    draggable: true
                };
                $scope.poll.poll_6_1_start.coordinates = [ leafEvent.latlng.lng, leafEvent.latlng.lat ];
                $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + leafEvent.latlng.lat + ',' + leafEvent.latlng.lng + '&sensor=true').success(function (data) {
                    $log.log(data);
                    $scope.poll.poll_6_1_start.description = data.results[0].formatted_address;
                })
                .error(function (data) {
                    $log.log('Error: ' + data);
                });                
            }
            
            if ($scope.setStopMarkerStatus){
                $scope.map.markers.stop_marker = {
                    lat: leafEvent.latlng.lat,
                    lng: leafEvent.latlng.lng,
                    message: "Stop",
                    focus: true,
                    draggable: true
                };
                $scope.poll.poll_6_1_stop.coordinates = [ leafEvent.latlng.lng, leafEvent.latlng.lat ];
                $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + leafEvent.latlng.lat + ',' + leafEvent.latlng.lng + '&sensor=true').success(function (data) {
                    $log.log(data);
                    $scope.poll.poll_6_1_stop.description = data.results[0].formatted_address;
                })
                .error(function (data) {
                    $log.log('Error: ' + data);
                });                
            }            
        });

        $scope.submitStartMarker = function () {
            $scope.setMarkerStatus = 1
            $scope.setStartMarkerStatus = false;
            $scope.map.center = {
                    lat: 13.751390740782975,
                    lng: 100.62652587890625,
                    zoom: 11
                }
            drawMap();
        };
        $scope.submitStopMarker = function () {
            $scope.setMarkerStatus = 2
            $scope.setStopMarkerStatus = false;
            $scope.map.center = {
                    lat: 13.751390740782975,
                    lng: 100.62652587890625,
                    zoom: 11
                }
            var mainContainer = angular.element(document.getElementsByClassName("map-container"));
            mainContainer.css('height', '200px');
            mainContainer.css('min-height', '200px');
            angular.element(document.getElementsByClassName("leaflet-google-layer")).css('height', '200px');
            bestFitZoom();
        };    
    
        function styleDefault(feature) {
            return {
                fillColor: "green",
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.3
            };
        }

        var last_layer = null;
        function geoClick(feature, leafletEvent) {
            var layer = leafletEvent.target;
            if (last_layer)
                last_layer.setStyle(styleDefault());
            last_layer = layer;

            layer.setStyle({
                weight: 5,
                color: '#666',
                fillColor: 'white',
                fillOpacity: 0
            });
            layer.bringToFront();
            leafletData.getMap().then(function(map) {
                map.fitBounds(layer.getBounds());
            });

            if($scope.setMarkerStatus === 0)
                $scope.setStartMarkerStatus = true;
            else if($scope.setMarkerStatus === 1)
                $scope.setStopMarkerStatus = true;
            
            delete $scope.geojson;
        }

        // Get the countries geojson data from a JSON
        var drawMap = function(){
            $http.get("Bangkok.json").success(function(data, status) {
                angular.extend($scope, {
                    geojson: {
                        data: data,
                        style: styleDefault,
                        resetStyleOnMouseout: false
                    }
                });
            });
        };
        drawMap();

        // Submit and cancel form -------------------------
        $scope.submitPoll = function () {
            $scope.status_msg = "กำลังบันทึกข้อมูล ... ";

            $scope.savingForm = true;

            $log.log($scope.poll);
            $http.post('/api/poll', $scope.poll)
                .success(function (data) {
                    $scope.resetPoll();
                    $scope.status = data;

                    $log.log(data);
                    $scope.status_msg = "บันทึกเสร็จเรียบร้อย";
                })
                .error(function (data) {
                    $log.log('Error: ' + data);
                    $scope.status_msg = 'Error: ' + data;
                });
        };

        $scope.resetPoll = function () {
            $scope.poll = {
                poll_date: $filter('date')(new Date, 'yyyy-MM-dd')
            };
            $scope.stop_marker = {};
            $scope.start_marker = {};
        };

    });


