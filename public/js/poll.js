angular.module('hcr-poll-collector', ['google-maps'.ns()])
    .controller('PollController', function ($scope, $filter, $log, $timeout, $http) {

        $scope.status_msg = "";
        $scope.poll = {
            poll_date: $filter('date')(new Date, 'yyyy-MM-dd')
        };

        $scope.map = {
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
                scrollwheel: true,
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

                },
                dragend: function () {
                    self = this;
                }
            }
        };


        // Marker control --------------------------
        $scope.start_marker = {};
        $scope.$watchCollection("start_marker.coords", function (newVal, oldVal) {
            if (_.isEqual(newVal, oldVal) || _.isEmpty(newVal))
                return;
            $scope.poll.poll_6_1_start.coordinates = [ newVal.longitude, newVal.latitude ];
            $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + newVal.latitude + ',' + newVal.longitude + '&sensor=true').success(function (data) {
                $log.log(data);
                $scope.start_marker.description = data.results[0].formatted_address;
            })
                .error(function (data) {
                    $log.log('Error: ' + data);
                });
        });
        $scope.setStartMarker = function () {
            $scope.poll.poll_6_1_start = {type: 'Point', coordinates: []};
            $scope.start_marker = {
                id: 0,
                description: '',
                coords: {
                    latitude: $scope.map.center.latitude,
                    longitude: $scope.map.center.longitude
                },
                icon: "http://www.google.com/mapfiles/dd-start.png",
                options: {
                    draggable: true,
                    labelContent: "จุดเริ่มต้น",
                    labelAnchor: "-15 30",
                    labelClass: "poll-marker-labels"
                },
                events: {
                    dragend: function (marker, eventName, args) {
                        var lat = marker.getPosition().lat();
                        var lon = marker.getPosition().lng();
                        $log.log('start marker dragend ' + lat + ',' + lon);
                    }
                }
            };
        };

        $scope.stop_marker = {};
        $scope.$watchCollection("stop_marker.coords", function (newVal, oldVal) {
            if (_.isEqual(newVal, oldVal) || _.isEmpty(newVal))
                return;
            $scope.poll.poll_6_1_stop.coordinates = [ newVal.longitude, newVal.latitude ];
            $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + newVal.latitude + ',' + newVal.longitude + '&sensor=true').success(function (data) {
                $log.log(data);
                $scope.stop_marker.description = data.results[0].formatted_address;
            })
                .error(function (data) {
                    $log.log('Error: ' + data);
                });
        });
        $scope.setStopMarker = function () {
            $scope.poll.poll_6_1_stop = {type: 'Point', coordinates: []};
            $scope.stop_marker = {
                id: 1,
                description: '',
                coords: {
                    latitude: $scope.map.center.latitude,
                    longitude: $scope.map.center.longitude
                },
                icon: "http://www.google.com/mapfiles/dd-end.png",
                options: {
                    draggable: true,
                    labelContent: "จุดสิ้นสุด",
                    labelAnchor: "-15 30",
                    labelClass: "poll-marker-labels"
                },
                events: {
                    dragend: function (marker, eventName, args) {
                        var lat = marker.getPosition().lat();
                        var lon = marker.getPosition().lng();
                        $log.log('stop marker dragend ' + lat + ',' + lon);
                    }
                }
            };
        };

        // Submit and cancel form -------------------------
        $scope.submitPoll = function () {
            $scope.status_msg = "Saving ... ";
            $log.log($scope.poll);
            $http.post('/api/poll', $scope.poll)
                .success(function (data) {
                    $scope.resetPoll();
                    $scope.status = data;
                    $log.log(data);
                    $scope.status_msg = "Done";
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


