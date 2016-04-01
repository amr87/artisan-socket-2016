var server = require('http').Server();

var io = require('socket.io')(server);

var cookie = require('cookie');

var PHPUnserialize = require('php-unserialize');

var MCrypt = require('mcrypt').MCrypt;

var Redis = require('ioredis');

var redis = new Redis();

var re = require("redis");
const  redisClient = re.createClient();

redis.subscribe('user-login');
redis.subscribe('user-update');
redis.subscribe('user-ban');

io.on('connection', function (socket) {

    var cookies = cookie.parse(socket.handshake.headers.cookie);
    var laravelSession = cookies.laravel_session;
    var sessionId = 'laravel:' + getSessionIdFromLaravelCookie(laravelSession);
    var userId;
    var cookieKey = 'login_82e5d2c56bdd0811318f0cf078b78bfc';
    redisClient.select(0, function () {});

    var connectedUsers = [];
    redisClient.lrange("online", 0, -1, function (err, item) {

        connectedUsers.push(item);

    });


    redisClient.get(sessionId, function (err, session) {
        try {
            var data = PHPUnserialize.unserialize(PHPUnserialize.unserialize(session));

            var sas = JSON.stringify({"id": data.user_id, "info": data.user_data});

            redisClient.rpush(['online', [sas]], function (err, ss) {});

            // connectedUsers[ socket.laravelSession[ cookieKey ] ] = socket;
            io.emit('connectedUser', {'connecteUser': connectedUsers});
        } catch (err) {
            console.log('Error unserializing session!', err);
        }


    });






    socket.on('sendId', function (data) {

        io.to(socket.id).emit('user-login', {
            user_id: data.id,
            socket_id: socket.id

        });
    });

    redis.on('message', function (channel, message) {

        var data = JSON.parse(message);

        if (channel == 'user-login') {

            io.to(socket.id).emit('user-login', {
                user_id: data.id,
                socket_id: socket.id
            });

        } else if (channel == 'user-update') {

            io.to(data.socket_id).emit('user-update', message);

        } else if (channel == 'user-ban') {

            io.to(data.socket_id).emit('user-ban', message);

        }

    });

    socket.on('disconnect', function () {
        io.emit('leave', {socket_id: socket.id});

    })
});


server.listen(8000);

/**
 * Helper function to return ASCII code of character
 * @param  [string] string
 * @return [ascii code]
 */
function ord(string) {
    return string.charCodeAt(0);
}

/**
 * This function retrieves the laravel session stored in redis
 * from a cookie
 * @param  [cookie] cookie
 * @return session
 */
function getSessionIdFromLaravelCookie(cookie) {

    var cookie = JSON.parse(new Buffer(cookie, 'base64'));

    var iv = new Buffer(cookie.iv, 'base64');
    var value = new Buffer(cookie.value, 'base64');
    var key = 'zhaqGNNuHBmjhf5wmKWsb0q92v1eMUMM'; // laravel app key

    var rijCbc = new MCrypt('rijndael-128', 'cbc');
    rijCbc.open(key, iv); // it's very important to pass iv argument!

    var decrypted = rijCbc.decrypt(value).toString();

    var len = decrypted.length - 1;
    var pad = ord(decrypted.charAt(len));

    var sessionId = PHPUnserialize.unserialize(decrypted.substr(0, decrypted.length - pad));

    return sessionId;
}