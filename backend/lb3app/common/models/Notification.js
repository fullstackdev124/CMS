'use strict';
var app = require('../../server/server');

module.exports = function(Model) {

    app.on('started', function(){

        var origGetAddresses = Model.prototype.__get__Addressees;
        Model.prototype.__get__Addressees = function(filter,cb, args) {
            arguments[0] = {include: ['DashUser']};
            return origGetAddresses.apply(this,arguments);
        }
    });
}
