'use strict';
var app = require('../../server/server');
var LoopBackContext = require('loopback-context');

module.exports = function (Model) {

	app.on('started', function () {
	});

	Model.by_activity = function (interval, filter_by, callback) {
		// Default Range is 1 Month
		var RANGE = 30 * 24 * 60 * 60 * 1000;

		switch (interval) {
			case 'hour':
				RANGE = 60 * 60 * 1000;
				break;
			case 'day':
				RANGE = 24 * 60 * 60 * 1000;
				break;
			case 'week':
				RANGE = 7 * 24 * 60 * 60 * 1000;
				break;
		}

		// Build default where Filter
		var where_filter = { where: { created: { gt: new Date(Date.now() - RANGE) } } };

		if (filter_by) {
			where_filter = { where: { created: { gt: new Date(Date.now() - RANGE) } } };
		}

		console.log("Applied filter:", where_filter, date_range);

		const call_log = app.models.CallLog;
		call_log.find(where_filter, (err, res) => {

			return callback(err, res);
		});
	};

	Model.remoteMethod('by_activity', {
		accepts: [
			{ arg: 'interval', type: 'string', required: true },
			{ arg: 'filter_by', type: 'string', required: false }
		],
		http: { verb: 'post' },
		returns: [
			{ type: 'Object', root: true }
		]
	});
}
