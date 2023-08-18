'use strict';
var app = require('../../server/server');

module.exports = function (Model) {
	app.on('started', function () {
	});

	Model.latest = function (tid, cb) {
		var filter = {
			limit: 1,
			order: ['version DESC', 'id DESC'],
			where: { ticketId: tid }
		};

		var options = { notify: true };

		Model.find(filter, options, function (err, results) {
			if (err) {
				cb(err);
			} else if (results && results.length > 0) {
				cb(null, results[0]);
			} else {
				cb(null, {});
			}
		});
	};

	Model.remoteMethod('latest', {
		accepts: [
			{ arg: 'tid', type: 'number', required: true }
		],
		http: { verb: 'get' },
		returns: [
			{ type: 'string', root: true }
		]
	});
}
