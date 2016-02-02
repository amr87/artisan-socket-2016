var io = require('socket.io')(3000);
var adapter = require('socket.io-redis');
var redis = require('redis');
io.adapter(adapter({ host: 'localhost', port: 6379 }));

var client = redis.createClient();

client.subscribe('user-login');


io.sockets.on('connection', function (socket) {
      
client.on('message',function(channel,message){

	socket.emit('user-login',message);

	});
});