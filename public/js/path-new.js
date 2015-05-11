var myApp = angular.module('hcr-map-path', ['ngSanitize', 'leaflet-directive', 'LocalStorageModule','colorpicker.module']);
myApp.config(function (localStorageServiceProvider) {
    localStorageServiceProvider
        .setPrefix('hcr-map-path')
        .setNotify(true, true);
});

myApp.directive('modalDialog', function() {
  return {
    restrict: 'E',
    scope: {
      show: '='
    },
    replace: true, // Replace with the template below
    transclude: true, // we want to insert custom content inside the directive
    link: function(scope, element, attrs) {
      scope.dialogStyle = {};
      if (attrs.width)
        scope.dialogStyle.width = attrs.width;
      if (attrs.height)
        scope.dialogStyle.height = attrs.height;
      scope.hideModal = function() {
        scope.show = false;
      };
    },
    template: "<div class='ng-modal' ng-show='show'>" +
              " <div class='ng-modal-overlay' ng-click='hideModal()'></div>" +
              " <div class='ng-modal-dialog' ng-style='dialogStyle'>" +
              "   <div class='ng-modal-close' ng-click='hideModal()'>X</div>" +
              "   <div class='ng-modal-dialog-content' ng-transclude></div>" +
              " </div>" +
              "</div>"
  };
});

myApp.controller('MapController', function ($scope, $sce, $filter, $log, $timeout, $http, $window, $timeout, leafletData, leafletBoundsHelpers, localStorageService) {
    angular.extend($scope, {
        info: {
            simulator_name: '',
            start_city:'',
            start_city_data: null,
            gen_trips_number: 1000,
            brt_adv_factor: 3,
            rail_adv_factor: 3,
            canal_adv_factor: 3,
            max_walk_distance: 0            
        },
        map: {
            center: {},
            bounds: {"northEast":{"lat":13.838079936422476,"lng":100.74840545654295},"southWest":{"lat":13.63797952487553,"lng":100.34671783447266}},
            controls: {
                draw: {
                    marker: false,
                    polyline: {
                        shapeOptions: {
                            color: '#333',
                            weight: 5,
                            opacity: 0.8,
                        }
                    },
                    polygon: {
                        shapeOptions: {
                            color: '#aaa',
                            weight: 2,
                            opacity: 0.2,
                        }
                    },
                    circle: false,
                    rectangle: false
                },
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
                },
                overlays: {
                    trips_layer: {
                        "name": "Trip outside of network",
                        "type": "group",
                        "visible": true
                    },
                    switch_layer: {
                        "name": "Hybrid trip",
                        "type": "group",
                        "visible": false
                    }                  
                }                
            },
            markers: {},
            area: {},
            defaults: {
                scrollWheelZoom: true
            }
        }
    });
    //$scope.editableFeatureGroup = new L.FeatureGroup();
    //$scope.map.controls.draw.edit = {featureGroup: $scope.editableFeatureGroup};
    
    var stationIcon = {
            type: 'div',
            iconSize: [20, 20],
            html: '<i class="fa fa-train fa-fw"></i>',
            popupAnchor:  [10, 0]
        };
    var boatIcon = {
            type: 'div',
            iconSize: [20, 20],
            html: '<i class="fa fa-ship fa-fw"></i>',
            popupAnchor:  [10, 0]
        };
    var brtIcon = {
            type: 'div',
            iconSize: [20, 20],
            html: '<i class="fa fa-bus fa-fw"></i>',
            popupAnchor:  [10, 0]
        };    

    // init ===============================================    
    // Check url if it need to load data
    var drawnItems = null;
    leafletData.getMap().then(function (map) {
        drawnItems = $scope.map.controls.edit.featureGroup;
    });

    
    // internal value
    $scope.state = "setbasic";
    $scope.network_modify = false;
    $scope.save_edit_status = '';
    $scope.path = {};
    $scope.area = {};
    $scope.stationMarker = [];

    
    $scope.currentLayer = null;
    $scope.editPath = false;
    $scope.editArea = false;    
    $scope.currentPath = null;
    $scope.currentArea = null;

    // map init with small size
    var mapChangeSize = function(size){
        var mainContainer = angular.element(document.getElementsByClassName("map-container"));
        mainContainer.css('height', size);
        mainContainer.css('min-height', size);
        angular.element(document.getElementsByClassName("leaflet-google-layer")).css('height', size);    
        leafletData.getMap().then(function(map) {
            map.invalidateSize();
        });         
    };
    mapChangeSize('230px');
    
    var mapBestFit = function(northeast,southwest){
        leafletData.getMap().then(function(map) {
            map.invalidateSize();
            map.fitBounds([
                northeast,
                southwest,
            ]);
        });        
    };
    
    $scope.mapGeocodeFocus = function(){
        //https://maps.googleapis.com/maps/api/geocode/json?address=bangkok,+thailand
        var city = $scope.info.start_city;
        if(city){
            $http.get('http://maps.googleapis.com/maps/api/geocode/json?address=' + city + '&sensor=true').success(function (data) {
                //$log.log(data);
                if(data.results[0]){
                    $scope.info.start_city_data = data.results[0];
                    mapBestFit(data.results[0].geometry.viewport.northeast,data.results[0].geometry.viewport.southwest);
                }
            })
            .error(function (data) {
                $log.log('Error: ' + data);
            });          
        }
    };

    var url = $window.location.pathname;
    if(url.length > 5){
        // load with path id
        $http.get('/api' + url).success(function (data) {
            $scope.network_modify = true;
            
            $scope.state = 'drawmap';
            mapChangeSize('600px');
            $scope.map.bounds = data.data.map.bounds;
            $scope.map.center = data.data.map.center;
            $scope.info = data.data.info;
            angular.forEach(data.data.path, function(value, key) {
                var polyline = L.polyline(value._latlngs, value.options);
                drawnItems.addLayer(polyline);
                var id = 'p' + polyline._leaflet_id;
                $scope.path[id] = {
                    id: polyline._leaflet_id,
                    type: value.type,
                    name: value.name,
                    station_type: value.station_type,
                    options: polyline.options,
                    _latlngs: polyline._latlngs
                };          
                for(var i in $scope.path[id]._latlngs){
                    $scope.path[id]._latlngs[i].station = value._latlngs[i].station;
                    $scope.path[id]._latlngs[i].name = value._latlngs[i].name;
                }                
                polyline.on('click', function (e) {
                    var layer = e.target;
                    $scope.state = 'drawmap';
                    if($scope.currentLayer)
                        $scope.currentLayer.editing.disable();

                    $scope.map.markers = {};

                    $scope.currentLayer = layer;
                    layer.editing.enable();     

                    $scope.editPath = true;
                    $scope.editArea = false;
                    $scope.currentPath = $scope.path['p'+layer._leaflet_id];
                    $scope.currentArea = null;
                });   
            });
            updateMarker();       
        })
        .error(function (data) {
            $log.log('Error: ' + data);
        });                  
    }    
    
    leafletData.getMap().then(function (map) {
        //drawnItems = $scope.map.controls.edit.featureGroup;
        map.on('draw:created', function (e) {
            var type = e.layerType,
                layer = e.layer;
            drawnItems.addLayer(layer);
            
            
            if (type === 'polyline') {
                var id = 'p' + layer._leaflet_id;
                $scope.path[id] = {
                    id: layer._leaflet_id,
                    type: type,
                    name: '',
                    station_type: 'canal',
                    options: layer.options,
                    _latlngs: layer._latlngs
                };
                for(var i in $scope.path[id]._latlngs){
                    $scope.path[id]._latlngs[i].station = true;
                }
            } else {
                $scope.area['a' + layer._leaflet_id] = {
                    id: layer._leaflet_id,
                    type: type,
                    name: '',
                    options: layer.options
                };
            }
                      
            layer.on('click', function (e) {
                var layer = e.target;
                $scope.state = 'drawmap';
                if($scope.currentLayer)
                    $scope.currentLayer.editing.disable();

                $scope.map.markers = {};

                $scope.currentLayer = layer;
                layer.editing.enable();     

                if (type === 'polyline') {
                    $scope.editPath = true;
                    $scope.editArea = false;
                    $scope.currentPath = $scope.path['p'+layer._leaflet_id];
                    $scope.currentArea = null;
                } else {
                    $scope.editPath = false;
                    $scope.editArea = true;      
                    $scope.currentPath = null;
                    $scope.currentArea = $scope.area['a'+layer._leaflet_id];
                }                
            });    
                        
            //createStationMarker(layer);
            updateMarker();
            //console.log(JSON.stringify(layer.toGeoJSON()));
        });
        map.on('draw:edited', function (e) {
            var layers = e.layers;

            updateMarker();
        });
        map.on('draw:editstart', function (e) {
            $scope.map.markers = {};
        });  
        
        map.on('draw:deleted', function (e) {     
            angular.forEach(e.layers._layers, function(value, key){
                 delete $scope.path['p'+key];   
            });
            $scope.currentLayer.editing.disable();
            $scope.editPath = false;
            $scope.editArea = false;
            $scope.currentPath = null;
            $scope.currentArea = null;
            updateMarker();               
        });        
    });
    
    $scope.$watch('currentPath.options', function(newValue, oldValue) {
        if (newValue === oldValue || !oldValue || !$scope.currentLayer || !$scope.currentPath) return;
        $scope.currentLayer.setStyle($scope.currentPath.options);
    }, true);   
    $scope.$watch('currentPath.name', function(newValue, oldValue) {
        if (newValue === oldValue || !oldValue || !$scope.currentLayer || !$scope.currentPath) return;
        $scope.currentLayer.unbindLabel().bindLabel($scope.currentPath.name);
    }, true);     
    
    $scope.$watch('currentArea.options', function(newValue, oldValue) {
        if (newValue === oldValue || !oldValue || !$scope.currentLayer || !$scope.currentArea) return;
        $scope.currentLayer.setStyle($scope.currentArea.options);
    }, true);      
    $scope.$watch('currentArea.name', function(newValue, oldValue) {
        if (newValue === oldValue || !oldValue || !$scope.currentLayer || !$scope.currentArea) return;
        $scope.currentLayer.unbindLabel().bindLabel($scope.currentArea.name);
    }, true);        


    var updateMarker = function(){
        
        var markers = {};
        $scope.stationMarker = [];
        
        $scope.map.controls.edit.featureGroup.eachLayer(function(layer){
            for(l in layer._latlngs){
                var path_id = 'p' + layer._leaflet_id;
                $scope.stationMarker.push({
                    layer_id: path_id,
                    lat: layer._latlngs[l].lat,
                    lng: layer._latlngs[l].lng,
                    station: layer._latlngs[l].station,
                    station_type: $scope.path[path_id].station_type,
                    name: (layer._latlngs[l].name)?layer._latlngs[l].name:'',
                });
            }                
        });  

        for(m in $scope.stationMarker){
            var marker_point = $scope.stationMarker[m];
            if (marker_point.station){
                markers[marker_point.layer_id + '_' + m] = {
                    lat: marker_point.lat,
                    lng: marker_point.lng,
                    focus: false,
                    title: "Marker",
                    draggable: false,
                    icon: (marker_point.station_type==="rail")?stationIcon:(marker_point.station_type==="brt")?brtIcon:boatIcon                   
                }
                if(marker_point.name){
                    markers[marker_point.layer_id + '_' + m].label = {message: marker_point.name,options: {noHide: true}};   
                }
            }
        }
        $scope.map.markers = markers;            
    };
    
    $scope.doneEdit = function () {
        $scope.currentLayer.editing.disable();
        $scope.editPath = false;
        $scope.editArea = false;
        $scope.currentPath = null;
        $scope.currentArea = null;
        updateMarker();
    };
    
    
    
    // Generate Part =====================================
    $scope.gen_status = "";
    $scope.trips = [];
    $scope.network = {};
    $scope.tripResult = [];
    $scope.tripStats = {};  
    
    $scope.editBasicInfo = function () {
        $scope.state = 'setbasic';
        mapChangeSize('230px');  
    };
    
    $scope.startCreatePath = function(){
        $scope.state = 'drawmap';
        mapChangeSize('600px');
        if($scope.info.start_city_data)
            mapBestFit($scope.info.start_city_data.geometry.viewport.northeast, $scope.info.start_city_data.geometry.viewport.southwest);
    };
    
    $scope.startSimulate = function(){
        $scope.state = 'loading';
        if($scope.currentLayer)
            $scope.currentLayer.editing.disable();
        $scope.editPath = false;
        $scope.editArea = false;
        $scope.currentPath = null;
        $scope.currentArea = null;     
        $scope.network = {};
        
        leafletData.getMap().then(function(map) {
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();   
        });         
        
        $scope.gen_status = "Checking data ...";   
        
        $timeout(genNetwork, 1000);
    };
    
    
    var genNetwork = function(){
        $scope.gen_status = "Create networks data ...";
        
        var network = new GenNetwork(
            $scope.path,
            $scope.info.canal_adv_factor,
            $scope.info.rail_adv_factor,
            $scope.info.brt_adv_factor,            
            $scope.info.max_walk_distance
        );    
        $scope.network = network;
        
        $scope.map.controls.edit.featureGroup.bringToFront();
        updateMarker();
        
        $timeout(genTrips, 1000);
    };    
        
    var genTrips = function(){
        var topleft = [$scope.map.bounds.northEast.lat,$scope.map.bounds.southWest.lng];
        var bottomright = [$scope.map.bounds.southWest.lat,$scope.map.bounds.northEast.lng];
        var trips_number = $scope.info.gen_trips_number;
        var max_walk_distance = $scope.info.max_walk_distance;  
        
        var dist_bound = MAX_DISTANCE;        
        if(max_walk_distance>0)
            dist_bound = max_walk_distance * DIST_SCALE;
        
        var network = $scope.network;
        var total_trips = trips_number;
        var total_org_distance = 0;
        var total_org_switch_distance = 0;
        var total_new_switch_distance = 0;
        var switched_trips = 0;

        var switch_trips = [];
        var remain_trips = [];
        
        $scope.gen_status = "Create trips data & Calculate best travel option for each trip ...";
        
        //$scope.trips = new GenTrips(topleft, bottomright).gen_uniform(trips_number);
        
        leafletData.getLayers().then(function (layers) {
            layers.overlays.trips_layer.clearLayers();

            for(var t = 0; t<trips_number; t++){
                //var polyline = L.polyline(trips[t], {weight: 1, color: 'red', clickable: false}).addTo(map);   
                
                var trip = new GenTrips(topleft, bottomright).gen_single_uniform();
                //var trip = [[13.72334441560363,100.50557294712797],[13.66679171399049,100.60976122866941]];
                var polyline = L.polyline(trip, {weight: 1, opacity: 0.6, color: 'blue', clickable: false}).addTo(layers.overlays.trips_layer);                   
                
                var sx = trip[0][0],
                    sy = trip[0][1],
                    tx = trip[1][0],
                    ty = trip[1][1];
                
                var direct_distance = distance(sx,sy,tx,ty);
                var net_distance = NetworkDistance(sx,sy,tx,ty,dist_bound,network);
                var is_using = false;

                if(net_distance['best_distance'] < INFTY){
                    var polyline_best_enter = L.polyline([[sx,sy],net_distance['best_enter']], {weight: 3, opacity: 1, color: 'yellow', clickable: false}).addTo(layers.overlays.trips_layer);    
                    var polyline_best_exit = L.polyline([[tx,ty],net_distance['best_exit']], {weight: 3, opacity: 1, color: 'yellow', clickable: false}).addTo(layers.overlays.trips_layer);    
                }
                
                total_org_distance += direct_distance;
                if( net_distance['best_distance']*1.2 < direct_distance){
                    is_using = true;
                    switched_trips += 1;
                    total_org_switch_distance += direct_distance;
                    total_new_switch_distance += net_distance['best_distance'];

                    switch_trips.push(polyline.setStyle({color: 'green'}));

                }else{
                    is_using = false;
                    remain_trips.push(polyline.setStyle({color: 'red'}));
                }
                
                layers.overlays.trips_layer.removeLayer(polyline);
                if(net_distance['best_distance'] < INFTY){
                    layers.overlays.trips_layer.removeLayer(polyline_best_enter);
                    layers.overlays.trips_layer.removeLayer(polyline_best_exit);
                }
                
            }      
            
            
            $scope.tripStats = {
                switched_trips: switched_trips,
                total_trips: total_trips,
                org_avg_dist: (total_org_distance * DIST_RATIO)/total_trips,
                switch: (switched_trips*100)/total_trips,
                switch_stat_before: (switched_trips > 0)?(total_org_switch_distance*DIST_RATIO)/switched_trips:0,
                switch_stat_after: (switched_trips > 0)?(total_new_switch_distance*DIST_RATIO)/switched_trips:0,
                switch_stat_after_pc: (switched_trips > 0)?100 - total_new_switch_distance*100/total_org_switch_distance:0
            };     

            var drawMap = function(trips_data){
                leafletData.getLayers().then(function (layers) {
                    layers.overlays.trips_layer.clearLayers();
                    for(var i in trips_data){
                        switch_trips[i].addTo(layers.overlays.switch_layer);
                    }

                    for(var i in remain_trips){
                        remain_trips[i].addTo(layers.overlays.trips_layer);
                    } 
                });  
            };
            drawMap(switch_trips);        
            $scope.state = 'done';
            $scope.gen_status = "Done";            
        });
    };
    
    
    $scope.saveNetwork = function(){       
        $scope.save_edit_status = $sce.trustAsHtml('Saving <i class="fa fa-cog fa-spin"></i>');
        $http.post('/api' + url, {
            'map':{
                'center': $scope.map.center,
                'bounds': $scope.map.bounds,
            },
            'path':$scope.path,
            'info':$scope.info
        })
        .success(function (data) {
            $log.log(data);
            $scope.save_edit_status = "Save Done";
            $timeout(function(){$scope.save_edit_status = ""}, 1000);
        })
        .error(function (data) {
            $log.log('Error: ' + data);
        });        
    };
    
    $scope.saveNewNetwork = function(){       
        $http.post('/api/path/', {
            'map':{
                'center': $scope.map.center,
                'bounds': $scope.map.bounds,
            },
            'path':$scope.path,
            'info':$scope.info
        })
        .success(function (data) {
            //$log.log(data);
            //$location.path(data.pathId);
            $window.location.href = '/path/' + data.pathId;
        })
        .error(function (data) {
            $log.log('Error: ' + data);
        });        
    };
    
    
    // tutorial modal
      $scope.modalShown = false;
      $scope.toggleModal = function() {
            $scope.modalShown = !$scope.modalShown;
      };    
});
