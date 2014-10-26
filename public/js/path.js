(function () {
    var module = angular.module("hcr-map-path", ['google-maps'.ns(),'ngStorage']);
}());

function MapController($scope, $localStorage, $filter, $log, $timeout, $http) {

    // Enable the new Google Maps visuals until it gets enabled by default.
    // See http://googlegeodevelopers.blogspot.ca/2013/05/a-fresh-new-look-for-maps-api-for-all.html
    google.maps.visualRefresh = true;

    $scope.$storage = $localStorage.$default({
        runningId: 0,
        pathCounter: 0,
        mapConfig: {
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
            draggable: true,
            pan: true,
            bounds: {},
            polylines: []
        }
    });
    
    angular.extend($scope, {
        map: {
            control: {},
            events: {
                tilesloaded: function (map, eventName, originalEventArgs) {},
                click: function (mapModel, eventName, originalEventArgs) {
                    var e = originalEventArgs[0];
                    var lat = e.latLng.lat(),
                        lon = e.latLng.lng();

                    if ($scope.drawLine) {
                        var tid = 'm' + (++$scope.$storage.runningId);
                        var path_len;
                        path_len = $scope.$storage.mapConfig.polylines[$scope.currentPathIndex].path.push({
                            id: tid,
                            name: '',
                            station: false,
                            latitude: lat,
                            longitude: lon
                        });

                        // clear dummy dot
                        if(path_len === 2 && $scope.$storage.mapConfig.polylines[$scope.currentPathIndex].path[0].dummy){
                            $scope.$storage.mapConfig.polylines[$scope.currentPathIndex].path.shift();
                        }
                        $scope.dataMarkers.push(createMarker(tid, lat, lon));
                    }
                    $scope.$apply();
                },
                dragend: function () {
                    self = this;
                }
            }
        }
    });    
    
    // init ===============================================
    $scope.working = false;
    $scope.pathIndex = 0;
    $scope.currentPathIndex = 0;
    $scope.drawLine = false;
    $scope.editLine = false;
    $scope.editLineToggleButton = "Edit Line";
    $scope.drawLineToggleButton = "Draw Line";
    $scope.dataMarkers = []; // to display path 
    
    
    // Button Function ==========================================
    $scope.createNewPath = function () {
        $scope.$storage.pathCounter++; 
        var newPath = {
                    id: $scope.$storage.pathCounter,
                    name: "",
                    path: [
                        // fix engine bug that not render polyline if path is empty or not valid
                        // set valid information some where then delete it later after get a real first point 
                        {
                            dummy:true,
                            latitude: 0,
                            longitude: 0
                        }                        
                    ],
                    stroke: {
                        color: '#000',
                        weight: 3
                    },
                    editable: false,
                    draggable: false,
                    geodesic: true,
                    visible: true
                };
        var newIndex = $scope.$storage.mapConfig.polylines.push(newPath);
        $scope.currentPathIndex = newIndex-1;
        setWorkingMode(true);
        return;
    };
    
    $scope.deletePath = function () {
        $scope.$storage.pathCounter = 0;
        $scope.$storage.mapConfig.polylines = [];
        setWorkingMode(false);
        $scope.pathIndex = 0;
        $scope.$storage.runningId = 0;
        return;
    };    
    
    
    // Line Function ===============================================
    $scope.editPath = function (pathIndex) {
        $scope.currentPathIndex = pathIndex;
        genMarkerFromPath($scope.$storage.mapConfig.polylines[$scope.currentPathIndex].path);
        setWorkingMode(true);
        return;
    };   
    
    $scope.doneEditPath = function () {
        setWorkingMode(false);
        return;
    };   
    
    $scope.drawLineToggle = function () {
        $scope.drawLine = !$scope.drawLine;
        if ($scope.drawLine) {
            $scope.controlMsg = "Click anywhere to draw a line from last point. Click [Done] when finish";
            $scope.drawLineToggleButton = "Done";
            genMarkerFromPath($scope.$storage.mapConfig.polylines[$scope.currentPathIndex].path);
        } else {
            $scope.controlMsg = "";
            $scope.drawLineToggleButton = "Draw Line";
        }
        return;
    };

    $scope.editLineToggle = function () {
        $scope.editLine = !$scope.editLine;
        $scope.$storage.mapConfig.polylines[$scope.currentPathIndex].editable = $scope.editLine;
        if ($scope.editLine) {
            $scope.controlMsg = "Click and drag on white dot to reposition. Click and drag fade dot to create dot between current dots.";
            $scope.editLineToggleButton = "Done";
            $scope.dataMarkers = [];
        } else {
            $scope.controlMsg = "";
            $scope.editLineToggleButton = "Edit Line";
            genMarkerFromPath($scope.$storage.mapConfig.polylines[$scope.currentPathIndex].path);
        }
        return;
    };   
    
    $scope.deleteInPath = function (idx) {
        $scope.$storage.mapConfig.polylines[$scope.currentPathIndex].path.splice(idx, 1);
        genMarkerFromPath($scope.$storage.mapConfig.polylines[$scope.currentPathIndex].path);
        return;
    };    
    
    $scope.markersEvents = {
        click: function (gMarker, eventName, model) {
            if (model.$id) {
                model = model.coords;//use scope portion then
            }
        }
    };    
    
    // cosmetic and helper function =================================
    var setWorkingMode = function (working) {
        $scope.working = working;
        if(working){
            $scope.pathSelectClass = "col-sm-2";
            $scope.pathListClass = "";
            $scope.pathEditClass = "col-sm-10";
        }else{
            $scope.pathSelectClass = "";
            $scope.pathListClass = "col-sm-4";
            $scope.pathEditClass = "";          
            $scope.controlMsg = "";
            $scope.currentPathIndex = 0;
            $scope.drawLine = false;
            $scope.editLine = false;
            $scope.editLineToggleButton = "Edit Line";
            $scope.drawLineToggleButton = "Draw Line";
            $scope.dataMarkers = []; // to display path 
        }
        return;
    };
    setWorkingMode($scope.working);
    
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
            title: i
        };
        ret[idKey] = i;
        return ret;
    };

    var genMarkerFromPath = function (path) {
        var markers = [];
        for (var i = 0; i < path.length; i++) {
            markers.push(createMarker(path[i].id, path[i].latitude, path[i].longitude));
        }
        $scope.dataMarkers = markers;
        return;
    };    
}
