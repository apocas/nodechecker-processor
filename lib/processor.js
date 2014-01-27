var Dispatcher = require('./dispatcher'),
    MongoClient = require('mongodb').MongoClient,
    format = require('util').format,
    events = require('events'),
    sys = require('sys');


var Processor = function(mip, mport, bip, bport) {
  var self = this;

  MongoClient.connect(format("mongodb://%s:%s/nodechecker", mip, mport), function(err, db) {
    if(err) throw err;

    self.mdb = db;

    self.dispatcher = new Dispatcher(self.mdb, bip, bport);

    self.emit('ready');

    self.dispatcher.on('finished', function() {
      console.log('Finished this run.'.red);
      process.exit(0);
    });
  });
};


sys.inherits(Processor, events.EventEmitter);


Processor.prototype.run = function () {
  console.log('Starting a new run.'.green);

  var self = this,
    collection = this.mdb.collection('modules');

  collection.find({status: null}).toArray(function(err, docs) {
    for (var i = docs.length - 1; i >= 0; i--) {
      self.dispatcher.dispatch(docs[i]);
    }
  });
};


module.exports = Processor;