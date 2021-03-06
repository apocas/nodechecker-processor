require('colors');

var sys = require('sys'),
  events = require('events'),
  DuplexEmitter = require('duplex-emitter'),
  reconnect = require('reconnect');

var Dispatcher = function(mdb, hostname, port) {
  var self = this;
  this.mdb = mdb;
  this.counter = 0;

  reconnect(function(socket) {
    console.log('Connected to dispatcher'.green);
    self.socket = socket;
    self.remote = DuplexEmitter(socket);

    self.remote.on('done', function(data) {
      self.saveStatus(data.job.module, data.result.result);
      self.done(data);
    });
  }).connect(port, hostname);
};

sys.inherits(Dispatcher, events.EventEmitter);

Dispatcher.prototype.dispatch = function(module) {
  var self = this,
    repo;

  console.log('Dispatching ' + module.name);

  if (module.repository && module.repository.type == 'git' && module.repository.url && module.repository.url.length > 0) {
    repo = module.repository.url;
  }

  this.counter++;

  self.remote.emit('test', {
    'type': 'module',
    'module': module.name,
    'repository': repo,
    'version': module.version
  });
};


Dispatcher.prototype.saveStatus = function(modulen, status) {
  var collection = this.mdb.collection('modules');
  collection.update({
    name: modulen
  }, {
    $set: {
      status: status
    }
  }, {
    safe: true
  }, function(err, docs) {
    if (err) {
      console.log(err);
      console.log(modulen);
    }
  });
};


Dispatcher.prototype.done = function(data) {
  var self = this;

  var collection = this.mdb.collection('runs');

  var dinsert = {
    module: data.job.module,
    time: new Date().getTime(),
    status: data.result.result,
    output: data.result.output,
    code: data.result.code,
    version: data.job.version
  };

  //console.log(dinsert);

  collection.insert(dinsert, {
    safe: true,
    w: 1
  }, function(err, docs) {
    if (err) console.log(err);

    console.log('DONE! ' + data.job.module + ' with code ' + data.result.result + '(' + data.result.code + ')');
    self.counter--;
    if (self.counter === 0) {
      self.emit('finished');
    }
  });
};

module.exports = Dispatcher;
