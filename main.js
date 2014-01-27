var Processor = require('./lib/processor');

var mongo_ip = process.env.MONGODB_HOST || '127.0.0.1';
var mongo_port = process.env.MONGODB_PORT || 27017;
var balancer_ip = process.env.BALANCER_HOST || '127.0.0.1';
var balancer_port = process.env.BALANCER_PORT || 5000;

var processor = new Processor(mongo_ip, mongo_port, balancer_ip, balancer_port);

processor.on('ready', function() {
  processor.run();
});

