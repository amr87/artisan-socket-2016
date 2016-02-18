var server = require('http').Server();

var io = require('socket.io')(server);

var Redis = require('ioredis');

var redis = new Redis();

redis.subscribe('user-login');
redis.subscribe('user-update');

io.on('connection', function (socket) {

    socket.on('sendId', function (data) {
        
        io.to(socket.id).emit('user-login', {
            user_id: data.id,
            client_id: socket.id

        });
    });

    redis.on('message', function (channel, message) {

        var data = JSON.parse(message);

        if (channel == 'user-login') {

            console.log(' Login Operation ---> ' + socket.id);

            io.to(socket.id).emit('user-login', {
                user_id: data.id,
                client_id: socket.id
            });

        } else if (channel == 'user-update') {

            console.log('Update Operation ---> ' + data.client_id);

            io.to(data.client_id).emit('user-update', message);

        }

    });


});




server.listen(3000);