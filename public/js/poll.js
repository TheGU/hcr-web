angular.module('hcr-poll-collector', ['google-maps'.ns()])
  .controller('PollController', function ($scope, $filter, $log, $timeout) {
      
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
                    $scope.$apply();
                },
                dragend: function () {
                    self = this;
                }
            }   
        };
      
      
    // Marker control --------------------------
    $scope.start_marker = {};
    $scope.$watchCollection("start_marker.coords", function (newVal, oldVal) {
      if (_.isEqual(newVal, oldVal))
        return;
      $scope.coordsUpdates++;
    });
    $scope.setStartMarker = function(){
        $scope.start_marker = {
          id: 0,
          coords: {
            latitude: $scope.map.center.latitude, 
            longitude: $scope.map.center.longitude
          },
          icon: "http://www.google.com/mapfiles/dd-start.png",
          options: { 
              draggable: true ,
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
      if (_.isEqual(newVal, oldVal))
        return;
      $scope.coordsUpdates++;
    });
    $scope.setStopMarker = function(){    
        $scope.stop_marker = {
          id: 1,
          coords: {
            latitude: $scope.map.center.latitude, 
            longitude: $scope.map.center.longitude
          },
          icon: "http://www.google.com/mapfiles/dd-end.png",
          options: { 
              draggable: true ,
              labelContent: "จุดสิ้นสุด",
              labelAnchor: "-15 30",
              labelClass: "poll-marker-labels"
          },
          events: {
            dragend: function (marker, eventName, args) {
              var lat = marker.getPosition().lat();
              var lon = marker.getPosition().lng();
              $log.log('หะนย marker dragend ' + lat + ',' + lon);
            }
          }
        };          
    };      
            
    // Submit and cancel form -------------------------
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
  
  });


