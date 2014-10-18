(function () {
    var module = angular.module("hcr-poll-collector", ["google-maps"]);
}());

function PollController($scope, $timeout, $log, $http, Logger) {
    Logger.doLog = true
    // Enable the new Google Maps visuals until it gets enabled by default.
    // See http://googlegeodevelopers.blogspot.ca/2013/05/a-fresh-new-look-for-maps-api-for-all.html
    google.maps.visualRefresh = true;

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
            bounds: {}
        }
    });
}
