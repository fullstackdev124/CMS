'use strict';
var app = require('../../server/server');

module.exports = function(Model) {

	app.on('started', function(){
		// Nest Version in Ticket Object
		// Model.nestRemoting('Versions');

		// Export custom methods
		Model['by-observer'] = function(uid, cb) {

			let query = "SELECT `t`.`id`, `t`.`customerId`, `t`.`serviceId`, `t`.`slaTimeout`, `t`.`title`, `t`.`creator`, `t`.`createdAt` FROM `ticket` as `t`, `version` as `v`, `observer` as `o` " +
				"WHERE `t`.`id`=`v`.`ticketId` AND `v`.`id`=`o`.`id` AND `o`.`id`='" +uid+ "' GROUP BY `ticketId` ORDER BY `createdAt` DESC";

			Model.dataSource.connector.query(query, (err, results) => {
				if(err) {
					cb(err)
				} else if (results && results.length > 0) {
					cb(null, results);
				} else {
					cb(null, {});
				}
			});
		};

		Model['by-state'] = function(uid, sid, cb) {

			let query = "SELECT * FROM (SELECT `id`,MAX(`version`),`priority`,`scheduledSince`,`scheduledTo`,`createdAt`,`note`,`state`,`ticketId`,`owner` FROM `version` GROUP BY `ticketId`) as `sub` " + 
				"WHERE `sub`.`owner`='" +uid+ "' AND `sub`.`state`='" +sid+ "'";

			Model.dataSource.connector.query(query, (err, results) => {
				if(err) {
					cb(err);
				} else if (results && results.length > 0) {
					cb(null, results);
				} else {
					cb(null, {});
				}
			});
		};

		Model['count-by-owner'] = function(uid, cb) {
			var filter = {
				where: { owner: uid }
			};

			var options = { notify: true };

			Model.find(filter, options, function(err, results) {
				if(err) {
					cb(err);
				} else if (results && results.length > 0) {
					// Build Return string
					let jsonstring = '{ "count": ' + Object.keys(results).length + ' }';
					jsonstring = JSON.parse(jsonstring);
					cb(null, jsonstring);
				} else {
					cb(null, {});
				}
			});
		};

		Model['count-by-observer'] = function(uid, cb) {

			let query = "SELECT `v`.`id`,`v`.`version`,`v`.`priority`,`v`.`scheduledSince`,`v`.`scheduledTo`,`v`.`createdAt`,`v`.`note`,`v`.`state`,`v`.`ticketId`,`v`.`owner` FROM `version` as `v`, `observer` as `o`" +
				"WHERE `v`.`id`=`o`.`id` and `o`.`id`='" +uid+ "' GROUP BY `ticketId` ORDER BY `createdAt` DESC";

			Model.dataSource.connector.query(query, (err, results) => {
				if(err) {
					cb(err);
				} else if (results && results.length > 0) {
					let tno = {};
					//  Count Tickets Returned
					results.forEach(function(version) {
						if(tno.hasOwnProperty(version.ticketId)) {
							tno[version.ticketId] += 1;
						} else {
							tno[version.ticketId] = 1;
						}
					});
					// Build Return string
					let jsonstring = '{ "count": ' + Object.keys(tno).length + ' }';
					jsonstring = JSON.parse(jsonstring);
					cb(null, jsonstring);
				} else {
					cb(null, {});
				}
			});
		};

		Model['count-by-state'] = function(uid, sid, cb) {

			let query = "SELECT * FROM (SELECT `id`,MAX(`version`),`priority`,`scheduledSince`,`scheduledTo`,`createdAt`,`note`,`state`,`ticketId`,`owner` FROM `version` GROUP BY `ticketId`) as `sub` " + 
				"WHERE `sub`.`owner`='" +uid+ "' AND `sub`.`state`='" +sid+ "'";

			Model.dataSource.connector.query(query, (err, results) => {
				if(err) {
					cb(err);
				} else if (results && results.length > 0) {
					let jsonstring = '{ "count": ' + Object.keys(results).length + ' }';
					jsonstring = JSON.parse(jsonstring);
					cb(null, jsonstring);
				} else {
					cb(null, {});
				}
			});
		};

		Model.remoteMethod('by-observer', {
			accepts: [
				{ arg: 'uid', type: 'number', required: true }
			],
			http: { verb: 'get' },
			returns: [
				{ type: 'string', root: true }
			]
		});

		Model.remoteMethod('by-state', {
			accepts: [
				{ arg: 'uid', type: 'number', required: true },
				{ arg: 'sid', type: 'number', required: true }
			],
			http: { verb: 'get' },
			returns: [
				{ type: 'string', root: true }
			]
		});

		Model.remoteMethod('count-by-owner', {
			accepts: [
				{ arg: 'uid', type: 'number', required: true }
			],
			http: { verb: 'get' },
			returns: [
				{ type: 'string', root: true }
			]
		});

		Model.remoteMethod('count-by-observer', {
			accepts: [
				{ arg: 'uid', type: 'number', required: true }
			],
			http: { verb: 'get' },
			returns: [
				{ type: 'string', root: true }
			]
		});

		Model.remoteMethod('count-by-state', {
			accepts: [
				{ arg: 'uid', type: 'number', required: true },
				{ arg: 'sid', type: 'number', required: true }
			],
			http: { verb: 'get' },
			returns: [
				{ type: 'string', root: true }
			]
		});
	});
}
