var distance = function(x1, y1, x2, y2){
    return(Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1)));
};

var GenTrips = function(topleft,bottomright){
    var MAP_FRAME = {'topleft':topleft,'bottomright':bottomright};
    
    this.gen_uniform = function(n){
        var maxh = MAP_FRAME['topleft'][0] - MAP_FRAME['bottomright'][0];
        var maxw = MAP_FRAME['bottomright'][1] - MAP_FRAME['topleft'][1];
        var trips = [];
        for(var i=0; i<n; i++){
            trips.push([
                     [MAP_FRAME['bottomright'][0] + Math.random()*maxh, MAP_FRAME['topleft'][1] + Math.random()*maxw],
                     [MAP_FRAME['bottomright'][0] + Math.random()*maxh, MAP_FRAME['topleft'][1] + Math.random()*maxw]
                     ]);
        }
        return trips
    }
    
    return this;
}

var CalStat = function(network, trips, max_walk_distance){
    var INFTY = 10000;
    var MAX_DISTANCE = 10000;
    var DIST_SCALE = 0.009041543572655762;
    
    var d = [];
    var dist_bound = MAX_DISTANCE;
    
    if(max_walk_distance){
        dist_bound = max_walk_distance * DIST_SCALE;
    }
    
    // read graph : read_graph(argv[1], dist_bound);
        // read all node and is_station
        // set distance of connected node and store in d
        // set distance of each node to all station
    
    // asap();
    
    
    // process(argv[2], dist_bound);
    
    
};

var MapGraph = function(){
    var RAIL_ADVANTAGE_FACTOR = 3.0;
    var INFINITY = 10000;
    
    function append_from_layer(network_layer){
           
    }
    
};

var GenTripStat = function(network_layer){
    var map_graph = new MapGraph();
    var results = null;
    var max_walk_distance = -1;
    
    for(l in network_layer){
        map_graph.append_from_layer(network_layer[l]);   
    }
    
    map_graph.compute_apsp();
};