const app = require('../../server/server');

module.exports = function (Model) {
  app.on('started', function() {
  });

  const remotes = app.remotes();


  // Model.remoteMethod('count_logs', {
  //   accepts: [
  //     {arg: 'customerId', type: 'number', required: true},
  //     {arg: 'options', type: 'object', http: 'optionsFromRequest'},
  //   ],
  //   http: {verb: 'get'},
  //   returns: [{type: 'object', root: true}],
  // });

}