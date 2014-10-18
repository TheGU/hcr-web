// Init =================
var express = require('express')
var app = express(); // handle url request
var bodyParser = require('body-parser'); 	// pull information from HTML POST (express4)
var mongoose = require('mongoose'); // mongoose for mongodb
//var morgan = require('morgan'); // log requests to the console (express4)

// Config =================
app.set('port', (process.env.PORT || 5000))
var dbUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/hcr';

mongoose.connect(dbUri); // connect to mongoDB database

// poll model =================
var PollSchema = new mongoose.Schema({
        poll_user : { type: String, default: '' },
        poll_date : { type: Date, default: Date.now },

        poll_1_1: { type: Boolean, default: false },
        poll_1_2: { type: Boolean, default: false },
        poll_1_3: { type: Boolean, default: false },
        poll_1_4: { type: Boolean, default: false },
        poll_1_5: { type: Boolean, default: false },
        poll_1_6: { type: Boolean, default: false },
        poll_1_7: { type: Boolean, default: false },
        poll_1_8: { type: Boolean, default: false },
        poll_1_9: { type: Boolean, default: false },
        poll_1_10: { type: Boolean, default: false },
        poll_1_11: { type: Boolean, default: false },
        poll_1_12: { type: Boolean, default: false },
        poll_1_12_text: { type: String, default: '' },
    
        poll_2: { type: String, default: '' },
        poll_2_1_1: { type: Boolean, default: false },
        poll_2_1_1_text: { type: String, default: '' },
        poll_2_1_2: { type: Boolean, default: false },
        poll_2_1_2_text: { type: String, default: '' },
        poll_2_1_3: { type: Boolean, default: false },
        poll_2_1_3_text: { type: String, default: '' },
        poll_2_1_4: { type: Boolean, default: false },
        poll_2_1_4_text: { type: String, default: '' },
        poll_2_1_5: { type: Boolean, default: false },
        poll_2_1_5_text: { type: String, default: '' },
        poll_2_2_1: { type: Boolean, default: false },
        poll_2_2_2: { type: Boolean, default: false },
        poll_2_2_3: { type: Boolean, default: false },
        poll_2_2_3_text: { type: String, default: '' },
    
        poll_3: { type: String, default: '' },
    
        poll_4_1: { type: Boolean, default: false },
        poll_4_2: { type: Boolean, default: false },
        poll_4_3: { type: Boolean, default: false },
        poll_4_4: { type: Boolean, default: false },
        poll_4_5: { type: Boolean, default: false },
    
        poll_5_1: { type: String, default: 0 },
        poll_5_2: { type: String, default: 0 },
        poll_5_3: { type: String, default: 0 },
        poll_5_4: { type: String, default: 0 },
        poll_5_5: { type: String, default: 0 },
        poll_5_6: { type: String, default: 0 },
        poll_5_7: { type: String, default: 0 },
        poll_5_8: { type: String, default: 0 },
        poll_5_9: { type: String, default: 0 },
        poll_5_10: { type: String, default: 0 },
        poll_5_10_text: { type: String, default: '' },
    
        poll_6_1_start: { type: String, default: '' },  //{type: [Number], index: '2d'},
        poll_6_1_stop: { type: String, default: '' }, //{type: [Number], index: '2d'},
        poll_6_2: { type: String, default: 0 },
        poll_6_3: { type: String, default: 0 },
    
        poll_7_1: { type: Boolean, default: false },
        poll_7_2: { type: Boolean, default: false },
        poll_7_3: { type: Boolean, default: false },
        poll_7_4: { type: Boolean, default: false },
        poll_7_5: { type: Boolean, default: false },
        poll_7_6: { type: Boolean, default: false },
        poll_7_6_text: { type: String, default: '' }
    });
var Poll = mongoose.model('Poll', PollSchema);

app.use(express.static(__dirname + '/public')) // set the static files location /public
app.use(bodyParser.urlencoded({'extended':'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
//app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
//app.use(morgan('dev')); // log every request to the console

// Routes =================
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
})

app.get('/poll', function(req, res) {
  res.sendFile(__dirname + '/public/poll.html');
})

// API =================
app.get('/api/poll', function(req, res) {
})

app.post('/api/poll', function(req, res) {
    Poll.create(req.body, function(err, poll) {
        if (err)
            res.send(err);
        res.json(poll);
    });
})

// Server =================
var server = app.listen(app.get('port'), function() {
  var host = server.address().address
  var port = server.address().port
  console.log('HCR app is running at http://%s:%s', host, port)
})

