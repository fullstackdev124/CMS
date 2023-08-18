'use strict';
var app = require('../../server/server');

module.exports = function (Model) {
  Model.on('dataSourceAttached', function (obj) {
    Model.origFind = Model.find;
    Model.find = findByUser;
  });

  function findByUser(filter, next, options) {
    if (!(next.accessToken && next.accessToken.userId)) return next('Token not found');

    if (!filter) filter = {where: {userId: next.accessToken.userId}, include: {RedisSubchannel: 'RedisChannel'}};

    arguments[0] = filter;

    return Model.origFind.apply(this, arguments);
  }
};
