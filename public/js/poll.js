(function () {
    var module = angular.module("hcr-poll-collector", ["google-maps"]);
}());

function PollController($scope, $filter, $timeout, $log, $http, Logger) {
    Logger.doLog = true
    // Enable the new Google Maps visuals until it gets enabled by default.
    // See http://googlegeodevelopers.blogspot.ca/2013/05/a-fresh-new-look-for-maps-api-for-all.html
    google.maps.visualRefresh = true;

    $scope.status_msg = "";
    $scope.poll = {
        poll_date: $filter('date')(new Date, 'yyyy-MM-dd')
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
            bounds: {}
        }
    });
    
    
    $scope.submitPoll = function(){
        $scope.status_msg = "Saving ... ";
        console.log('Submit: ' + $scope.poll);
        
		$http.post('/api/poll', $scope.poll)
			.success(function(data) {
                $scope.poll = {
                    poll_date: $filter('date')(new Date, 'yyyy-MM-dd')
                }; // clear the form so our user is ready to enter another
				$scope.status = data;
				console.log(data);
                $scope.status_msg = "Done";
			})
			.error(function(data) {
				console.log('Error: ' + data);
                $scope.status_msg = 'Error: ' + data;
			});        
    };
    
    $scope.resetPoll = function(){
        $scope.poll = {
            poll_date: $filter('date')(new Date, 'yyyy-MM-dd')
        };     
    };    
}
