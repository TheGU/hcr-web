// Magic. Do not change.
var DIST_SCALE = 0.009041543572655762;   
var DIST_RATIO = 2./0.140961;
var INFTY = 10000;
var MAX_DISTANCE = 10000;

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

var GenNetwork = function(path,canal_adv_factor,rail_adv_factor,max_walk_distance, callback){

    var dbound = max_walk_distance * DIST_SCALE;
    
    var network = {};
    var node_count = 0;
    
    // create network from layer
    for(var line in path){
        var layer = path[line];
        var last_id = '';
        for(var l in layer._latlngs){
            var node_id = 'p' + node_count;
            network[node_id] = {
                lat: layer._latlngs[l].lat,
                lng: layer._latlngs[l].lng,                           
                station: layer._latlngs[l].station,
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
                
                if(layer.station_type === 'canal'){
                    d = d / canal_adv_factor;
                }else if(layer.station_type === 'rail'){
                    d = d / rail_adv_factor;
                }else {
                    d = d / 3.0;
                    console.log('missing d');
                }
                
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
    
    if(callback) callback('genresult');
    return network;
};

var GenTripStat = function(trips,network,max_walk_distance, callback){
    var tripResult = [];

    var dist_bound = MAX_DISTANCE;        
    if(max_walk_distance)
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
    
    if(callback)callback('done');
    return tripResult;
};
