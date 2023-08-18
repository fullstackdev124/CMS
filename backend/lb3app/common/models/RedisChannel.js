'use strict';
var app = require('../../server/server');

module.exports = function(Model) {

    app.on('started', function(){

        var origGetRedisSubchannels = Model.prototype.__get__RedisSubchannels;
        Model.prototype.__get__RedisSubchannels = function(filter,cb, args) {
            arguments[0] = {include: ['RedisSubscriptions']};
            return origGetRedisSubchannels.apply(this,arguments);
        }
    });
}
