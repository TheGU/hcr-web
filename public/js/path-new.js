var myApp = angular.module('hcr-map-path', ['ngSanitize', 'leaflet-directive', 'LocalStorageModule','colorpicker.module']);
myApp.config(function (localStorageServiceProvider) {
    localStorageServiceProvider
        .setPrefix('hcr-map-path')
        .setNotify(true, true);
});
myApp.controller('MapController', function ($scope, $sce, $filter, $log, $timeout, $http, $window, $timeout, leafletData, leafletBoundsHelpers, localStorageService) {
    angular.extend($scope, {
        info: {
            simulator_name: '',
            start_city:'',
            start_city_data: {},
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
                    /*
                    polygon: {
                        allowIntersection: false, // Restricts shapes to simple polygons
                        drawError: {
                            color: '#e1e100', // Color the shape will turn when intersects
                            message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
                        },
                        shapeOptions: {
                            color: '#333',
                            weight: 3,
                            opacity: 0.8,
                        }
                    },
                    circle: {
                        shapeOptions: {
                            color: '#333',
                            weight: 3,
                            opacity: 0.8,
                        }
                    },
                    rectangle: {
                        shapeOptions: {
                            color: '#333',
                            weight: 3,
                            opacity: 0.8,
                        }
                    },
                    */
                    polygon: false,
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
    
    /*
    var stationIcon = {
        iconUrl: '/images/stationIcon18.png',
        iconRetinaUrl: '/images/stationIcon18.png',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [9, 0],
        labelAnchor: [9, 0],
        shadowUrl: '',
        shadowRetinaUrl: ''
    };    
    var boatIcon = {
        iconUrl: '/images/boatIcon18.png',
        iconRetinaUrl: '/images/boatIcon18.png',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [9, 0],
        labelAnchor: [9, 0],
        shadowUrl: '',
        shadowRetinaUrl: ''
    };        
    */
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
                $scope.info.start_city_data = data.results[0];
                mapBestFit(data.results[0].geometry.viewport.northeast,data.results[0].geometry.viewport.southwest);
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
        
        leafletData.getMap().then(function(map) {
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();   
        });         
        
        $scope.gen_status = "Checking data ...";   
        
        $timeout(genTrips, 1000);
    };
    
    var genTrips = function(){
        var topleft = [$scope.map.bounds.northEast.lat,$scope.map.bounds.southWest.lng];
        var bottomright = [$scope.map.bounds.southWest.lat,$scope.map.bounds.northEast.lng];
        var trips_number = $scope.info.gen_trips_number;

        $scope.gen_status = "Create trips data ...";
        
        $scope.trips = new GenTrips(topleft, bottomright).gen_uniform(trips_number);
        
        leafletData.getLayers().then(function (layers) {
            layers.overlays.trips_layer.clearLayers();
            for(var t = 0; t< $scope.trips.length; t++){
                var polyline = L.polyline($scope.trips[t], {weight: 1, color: 'red', clickable: false}).addTo(layers.overlays.trips_layer);   
            }
            layers.overlays.trips_layer.eachLayer(function(layer){layer.bringToBack();});
        });
        
        $timeout(genNetwork, 3000);
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
        
        $timeout(genTripResult, 1000);
    };    
        

    var genTripResult = function(){  
        var trips = $scope.trips;
        var network = $scope.network;
        var max_walk_distance = $scope.info.max_walk_distance;
        var tripResult = [];    
        
        $scope.gen_status = "Calculate best travel option for each trip ...";

        var dist_bound = MAX_DISTANCE;        
        if(max_walk_distance>0)
            dist_bound = max_walk_distance * DIST_SCALE;

        var network_distance = function(sx,sy,tx,ty,dbound){
            var dstart = {};
            var dterm = {};
            for(var i in network){
                if(network[i].station){
                    dstart[i] = distance(sx,sy,network[i].lat,network[i].lng);
                    dterm[i] = distance(network[i].lat,network[i].lng,tx,ty);
                    if(dstart[i] > dbound)
                        dstart[i] = INFTY + 1;
                    if(dterm[i] > dbound)
                        dterm[i] = INFTY + 1;
                }else{
                    dstart[i] = INFTY + 1;
                    dterm[i] = INFTY + 1;
                }
            }

            var mind = INFTY;
            for(var i in network){
                if(!network[i].station)continue;

                var d1 = dstart[i];
                if(d1 > mind) continue;

                for(var j in network){
                    if((j===i)||(!network[j].station))continue;

                    var dd = (d1 + ((j in network[i].connected)?network[i].connected[j]:INFTY+1));
                    if(dd > mind) continue;

                    dd = dd + dterm[j];
                    if(dd < mind){
                        mind = dd;   
                    }
                }
            }
            return mind;
        };

        for(var t = 0; t<trips.length; t++){
            //var polyline = L.polyline(trips[t], {weight: 1, color: 'red', clickable: false}).addTo(map);   
            var sx = trips[t][0][0],
                sy = trips[t][0][1],
                tx = trips[t][1][0],
                ty = trips[t][1][1];
            var direct_distance = distance(sx,sy,tx,ty);
            var net_distance = network_distance(sx,sy,tx,ty,dist_bound);
            tripResult.push([direct_distance,net_distance]);
        }            
        
        // Gen Result And Draw map
        var total_trips = trips.length;
        var total_org_distance = 0;
        var total_org_switch_distance = 0;
        var total_new_switch_distance = 0;
        var switched_trips = 0;

        var switch_trips = [];
        var remain_trips = [];
        for(var t = 0; t<trips.length; t++){
            var direct_distance = tripResult[t][0];
            var rail_distance = tripResult[t][1];
            var is_using = false;
            var travel_distance;

            total_org_distance += direct_distance;
            if( rail_distance*1.2 < direct_distance){
                is_using = true;
                switched_trips += 1;
                travel_distance = rail_distance;
                total_org_switch_distance += direct_distance;
                total_new_switch_distance += rail_distance;
                
                switch_trips.push(L.polyline(trips[t], {weight: 1, color: 'blue', clickable: false}));
                
            }else{
                is_using = false;
                color = 'red';
                travel_distance = direct_distance;
                
                remain_trips.push(L.polyline(trips[t], {weight: 1, color: 'red', clickable: false}));
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
});