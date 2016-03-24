var server = require('http').Server();

var io = require('socket.io')(server);

var Redis = require('ioredis');

var _ = require('./underscore');


var redis = new Redis();

var clients = [];

redis.subscribe('user-login');
redis.subscribe('user-update');
redis.subscribe('user-ban');

io.on('connection', function (socket) {

    socket.on('sendId', function (data) {

        var client = {};

        client[data.id] = socket.id;
        client["name"] = data.name;
        client["avatar"] = data.avatar;

        io.to(socket.id).emit('user-login', {
            user_id: data.id,
            client_id: socket.id

        });


        var index = _.indexOf(getKeys(clients), data.id);

        if (index == -1) {

            clients.push(client);

        } else {

            if (typeof (clients[index]) != "undefined")
                clients[index][data.id] = socket.id;

        }

        if (clients.length)
            io.emit('connectedUser', {users: clients});
    });



    socket.on('message', function (data) {


        var client = getClient(data.user_id, clients);
        if (client != "")
            io.to(client).emit('message', data);
    });

    socket.on('seen', function (data) {
        console.log(data);
        if (typeof (data) != "undefined") {
            var client = getClient(data.target_id, clients);
            if (client != "") {
                io.to(client).emit('seen', data);
            } else {
                if (typeof (data.client) != "undefined")
                    io.to(data.client).emit('seen', data);
            }
        }
    });

    socket.on('typing', function (data) {
        if (typeof (data) != "undefined") {
            var client = getClient(data.target_id, clients);
            if (client != "") {
                io.to(client).emit('typing', data);
            } else {
                if (typeof (data.client) != "undefined")
                    io.to(data.client).emit('typing', data);
            }
        }
    });


    socket.on('untyping', function (data) {
        if (typeof (data) != "undefined") {
            var client = getClient(data.target_id, clients);
            if (client != "") {
                io.to(client).emit('untyping', data);
            } else {
                if (typeof (data.client) != "undefined")
                    io.to(data.client).emit('untyping', data);
            }
        }
    });

    socket.on('disconnect', function () {

        for (var i = 0; i < clients.length; i++) {

            var sid = _.values(clients[i])[0];

            if (sid == socket.id)
                clients.splice(i, 1);
        }

        io.emit('connectedUser', {users: clients});

    })

});

redis.on('message', function (channel, message) {

    console.log(message);

    var data = JSON.parse(message);

    if (channel == 'user-login') {

        io.to(socket.id).emit('user-login', {
            user_id: data.id,
            client_id: socket.id
        });


    } else if (channel == 'user-update') {

        io.to(data.client_id).emit('user-update', message);

    } else if (channel == 'user-ban') {

        io.to(data.client_id).emit('user-ban', message);

    }

});


server.listen(8000);

function getKeys(arrofObj) {
    var ret = [];
    for (var i = 0; i < arrofObj.length; i++) {
        ret.push(_.keys(arrofObj[i]));
    }
    return _.flatten(ret);
}

function getValues(arrofObj) {
    var ret = [];
    for (var i = 0; i < arrofObj.length; i++) {
        ret.push(_.values(arrofObj[i]));
    }
    return _.flatten(ret);
}


function getClient(id, arrofObj) {
    var ret = "";
    for (var i = 0; i < arrofObj.length; i++) {

        if (typeof (arrofObj[i][id]) != "undefined")
            ret = arrofObj[i][id];
    }
    return ret;
}

