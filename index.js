// Init =================
var express = require('express')
var app = express(); // handle url request
//var mongoose = require('mongoose'); // mongoose for mongodb
//var morgan = require('morgan'); // log requests to the console (express4)

// Config =================
//mongoose.connect('mongodb://node:node@mongo.onmodulus.net:27017/uwO3mypu'); // connect to mongoDB database

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public')) // set the static files location /public
//app.use(morgan('dev')); // log every request to the console

// Core =================
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/public/index.html');
})

app.get('/poll', function(request, response) {
  response.sendFile(__dirname + '/public/poll.html');
})


// Server =================
app.listen(app.get('port'), function() {
  console.log("HCR app is running on port " + app.get('port'))
})
