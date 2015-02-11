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
                    options: layer.options,
                    layer: layer._latlngs
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
                        station_type: ($scope.path[path_id].station_type)?$scope.path[path_id].station_type:'canal',
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
    $scope.genTrips = function(){
        var topleft = [$scope.map.bounds.northEast.lat,$scope.map.bounds.southWest.lng];
        var bottomright = [$scope.map.bounds.southWest.lat,$scope.map.bounds.northEast.lng];
        
        var gt = new GenTrips(topleft, bottomright);
        
        var trips = gt.gen_uniform(3000);
        leafletData.getMap().then(function (map) {
            for(var t = 0; t<trips.length; t++){
                var polyline = L.polyline(trips[t], {weight: 1, color: 'red'}).addTo(map);   
            }
        });
    }
    
});