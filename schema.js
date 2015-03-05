var mongoose = require('mongoose');



//Document Models
var PathSchema = new mongoose.Schema({
  pathId: { type: String, index: true },
  data: mongoose.Schema.Types.Mixed,
  created_at: { type: Date},
  updated_at: { type: Date}
});
PathSchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});
module.exports.PathSchema = PathSchema;

var SeqsSchema = new mongoose.Schema({
  _id       :  { type: String}
  , seq       :  { type: Number}
});
SeqsSchema.statics.increment = function (counter, callback) {
  return this.findOneAndUpdate({ _id: counter }, { $inc: { seq: 1 } }, {upsert: true,new: true}, callback);
};
module.exports.SeqsSchema = SeqsSchema;

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
    
        poll_6_1_start: { 'type': { type: String, default: "Point" }, coordinates: {type: [Number], index: '2dsphere'}},
        poll_6_1_stop: { 'type': { type: String, default: "Point" }, coordinates: {type: [Number], index: '2dsphere'}}, 
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
module.exports.PollSchema = PollSchema;