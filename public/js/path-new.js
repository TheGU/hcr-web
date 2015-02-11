var myApp = angular.module('hcr-map-path', ['leaflet-directive', 'LocalStorageModule','colorpicker.module']);
myApp.config(function (localStorageServiceProvider) {
    localStorageServiceProvider
        .setPrefix('hcr-map-path')
        .setNotify(true, true);
});
myApp.controller('MapController', function ($scope, $filter, $log, $timeout, $http, leafletData, leafletBoundsHelpers, localStorageService) {
    angular.extend($scope, {
        map: {
            center: {
                //lat: 13.751390740782975,
                //lng: 100.62652587890625,
                //zoom: 11
            },
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
                }
            },
            markers: {},
            area: {},
            defaults: {
                scrollWheelZoom: true
            }
        }
    });

    var stationIcon = {
        iconUrl: 'images/stationIcon18.png',
        iconRetinaUrl: 'images/stationIcon18.png',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [9, 0],
        labelAnchor: [9, 0],
        shadowUrl: '',
        shadowRetinaUrl: ''
    };    
    var boatIcon = {
        iconUrl: 'images/boatIcon18.png',
        iconRetinaUrl: 'images/boatIcon18.png',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [9, 0],
        labelAnchor: [9, 0],
        shadowUrl: '',
        shadowRetinaUrl: ''
    };        


    // init ===============================================    
    $scope.path = {};
    $scope.area = {};
    $scope.stationMarker = [];
    
    $scope.currentLayer = null;
    $scope.editPath = false;
    $scope.editArea = false;    
    $scope.currentPath = null;
    $scope.currentArea = null;


    var drawnItems = null;
    leafletData.getMap().then(function (map) {
        drawnItems = $scope.map.controls.edit.featureGroup;
        map.on('draw:created', function (e) {
            var type = e.layerType,
                layer = e.layer;
            drawnItems.addLayer(layer);
            
            if (type === 'polyline') {
                $scope.path['p' + layer._leaflet_id] = {
                    id: layer._leaflet_id,
                    type: type,
                    name: '',
                    station_type: 'canal',
                    options: layer.options,
                    _latlngs: layer._latlngs
                };
             
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
        
        leafletData.getMap().then(function (map) {
            map.eachLayer(function(layer){
                for(l in layer._latlngs){
                    var path_id = 'p' + layer._leaflet_id;
                    $scope.stationMarker.push({
                        layer_id: path_id,
                        lat: layer._latlngs[l].lat,
                        lng: layer._latlngs[l].lng,
                        station: (layer._latlngs[l].station)?layer._latlngs[l].station:false,
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
                        icon: (marker_point.station_type==="rail")?stationIcon:boatIcon,
                        label: {
                            message: marker_point.name,
                            options: {
                                noHide: true
                            }
                        }                       
                    }
                }
            }
            $scope.map.markers = markers;            
        });
    };
    
    $scope.doneEdit = function () {
        $scope.currentLayer.editing.disable();
        $scope.editPath = false;
        $scope.editArea = false;
        $scope.currentPath = null;
        $scope.currentArea = null;
        updateMarker();
    };
    
    
    
    // Generate Part
    $scope.trips = [];
    $scope.genTrips = function(){
        var topleft = [$scope.map.bounds.northEast.lat,$scope.map.bounds.southWest.lng];
        var bottomright = [$scope.map.bounds.southWest.lat,$scope.map.bounds.northEast.lng];

        $scope.trips = new GenTrips(topleft, bottomright).gen_uniform(3000);
        /*
        leafletData.getMap().then(function (map) {
            for(var t = 0; t<trips.length; t++){
                var polyline = L.polyline(trips[t], {weight: 1, color: 'red', clickable: false}).addTo(map);   
            }
        });
        */
    };
    
    $scope.network = {};
    var INFTY = 10000;
    var DIST_SCALE = 0.009041543572655762;
    
    $scope.genNetwork = function(){  
        //var mg = new MapGraph();
        var max_walk_distance = 0.5;
    
        var node_count = 0;
        var network = {};
        
        var dbound = max_walk_distance * DIST_SCALE;
        
        
        // create network
        for(var line in $scope.path){
            var layer = $scope.path[line];
            var last_id = '';
            for(var l in layer._latlngs){
                var node_id = 'p' + node_count;
                network[node_id] = {
                    lat: layer._latlngs[l].lat,
                    lng: layer._latlngs[l].lng,                           
                    station: (layer._latlngs[l].station)?layer._latlngs[l].station:false,
                    station_type: layer.station_type, 
                    name: (layer._latlngs[l].name)?layer._latlngs[l].name:'',                        
                    connected: {},
                }

                if(last_id){
                    var d = distance(
                        network[node_id].lat,
                        network[node_id].lng,
                        network[last_id].lat,
                        network[last_id].lng);
                    network[node_id].connected[last_id] = d;
                    network[last_id].connected[node_id] = d;
                }

                last_id = node_id;
                node_count++;
            }     
        };  
        
        // connect walkable station
        for(var i in network){
            if(!network[i].station)continue;
            for(var j in network){
                if(i===j || !network[j].station)continue;
                
                var dist = distance(
                    network[i].lat,
                    network[i].lng,
                    network[j].lat,
                    network[j].lng); 
                if(dist < dbound){
                    network[i].connected[j] = dist;
                    network[j].connected[i] = dist;               
                }
            }
        }

        // asap
        // !!!! it not array, not sure this will create bug or not !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        for(var k in network){
            for(var i in network){
                if(!(k in network[i].connected))continue;
                
                for(var j in network){
                    if(!(j in network[k].connected))continue;
                    
                    if(i===j)continue;
                        
                    var old_d = INFTY;
                    if(j in network[i].connected)
                        old_d = network[i].connected[j];
                    if(network[i].connected[k] + network[k].connected[j] < old_d) {
                      network[i].connected[j] = network[i].connected[k] + network[k].connected[j];
                    }                    
                }
            }  
        }
        $scope.network = network;
    };
    
    $scope.tripResult = [];
    $scope.getTripResult = function(){
        var tripResult = [];
        
        var network_distance = function(sx,sy,tx,ty,dbound){
            var network = $scope.network; 
            var dstart = {};
            var dterm = {};
            for(var i in network){
                if(network[i].station){
                    var dstart[i] = distance(sx,sy,network[i].lat,network[i].lng);
                    var dterm[i] = distance(network[i].lat,network[i].lng,tx,ty);
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
                    
                    var dd = (d1 + ((j in network[i].connected)?network[i].connected[j]:INFTY));
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
            var sx = trips[t][0].lat,
                sy = trips[t][0].lng,
                tx = trips[t][1].lat,
                ty = trips[t][1].lng;
            var direct_distance = distance(sx,sy,tx,ty);
            var net_distance = network_distance(sx,sy,tx,ty,dbound);
            tripResult.push([direct_distance,net_distance]);
        }        
        
        var total_trips = len(trips);
        var total_org_distance = 0;
        var total_org_switch_distance = 0;
        var total_new_switch_distance = 0;
        var switched_trips = 0;
        
        
        
        
        
        
        $scope.tripResult = tripResult;
    }
});