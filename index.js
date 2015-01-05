// Init =================
var express = require('express');
var app = express(); // handle url request
var bodyParser = require('body-parser'); 	// pull information from HTML POST (express4)
var mongoose = require('mongoose'); // mongoose for mongodb
//var morgan = require('morgan'); // log requests to the console (express4)

var sc = require('./schema');

// Config =================
app.set('port', (process.env.PORT || 5000));
var dbUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/hcr';

mongoose.connect(dbUri); // connect to mongoDB database

// Model =================
var Poll = mongoose.model('Poll', sc.PollSchema);

app.use(express.static(__dirname + '/public')); // set the static files location /public
app.use(bodyParser.urlencoded({'extended': 'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
//app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
//app.use(morgan('dev')); // log every request to the console

// Routes =================
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/path', function (req, res) {
    res.sendFile(__dirname + '/public/path.html');
});

app.get('/poll', function (req, res) {
    res.sendFile(__dirname + '/public/poll.html');
});

app.get('/poll-submit', function (req, res) {
    res.sendFile(__dirname + '/public/poll-submit.html');
});

// API =================
app.get('/api/poll', function (req, res) {
});

app.post('/api/poll', function (req, res) {
    Poll.create(req.body, function (err, poll) {
        if (err)
            res.send(err);
        res.json(poll);
    });
});

// Server =================
var server = app.listen(app.get('port'), function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('HCR app is running at http://%s:%s', host, port)
})

