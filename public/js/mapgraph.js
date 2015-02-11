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

