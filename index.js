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
var Seqs = mongoose.model('Seqs', sc.SeqsSchema);
var Path = mongoose.model('Path', sc.PathSchema);

app.use(express.static(__dirname + '/public')); // set the static files location /public
app.use(bodyParser.urlencoded({'extended': 'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
//app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
//app.use(morgan('dev')); // log every request to the console

// Routes =================
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/path.html');
});

app.get('/about', function (req, res) {
    res.sendFile(__dirname + '/public/about.html');
});

app.get('/path', function (req, res) {
    res.sendFile(__dirname + '/public/path.html');
});

app.get('/path/:pathId', function (req, res) {
    res.sendFile(__dirname + '/public/path.html');
});

app.get('/poll', function (req, res) {
    res.sendFile(__dirname + '/public/poll.html');
});

app.get('/poll-submit', function (req, res) {
    res.sendFile(__dirname + '/public/poll-submit.html');
});

app.get('/Bangkok.json', function (req, res) {
    res.sendFile(__dirname + '/public/Bangkok.json');
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

var shortener = function(seq) {
    //https://github.com/juanmaia
    var chars = "abcdefghijklmnopqrstuvxzwyABCDEFGHIJKLMNOPQRSTUVXZWY1234567890";
    while (seq > 0) {
        var k = seq % chars.length;
        if (k == 0) {
            k = 62;
            seq--;
        }
        seq = Math.floor(seq / chars.length);
        str = chars[k - 1];
    }
    return str;
};
app.get('/api/path/:pathId', function (req, res) {
    Path.findOne({
        "pathId": req.params.pathId
    }, function (err, data) {
        if (err)
            res.send(err);
        res.json(data);
    });
});
app.post('/api/path/:pathId', function (req, res) {   
    Path.findOneAndUpdate(
        {"pathId": req.params.pathId},
        {"data": req.body},
        function (err, data) {
            if (err)
                res.send(err);
            res.json(data);
        });
});
app.post('/api/path', function (req, res) {
    Seqs.increment('pathId', function (err, data) {
        if(err){
            console.log('err', err);
            return;
        }
        
        pathId = shortener(data.seq);

        var data = {
            "pathId": pathId,
            "data": req.body
        };
        Path.create(data, function (err, path) {
            if (err)
                res.send(err);
            res.json(path);
        });
    });
});

// Server =================
var server = app.listen(app.get('port'), function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('HCR app is running at http://%s:%s', host, port)
})

