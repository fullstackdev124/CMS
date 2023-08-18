'use strict';

var app = require('../server/server');
var LoopBackContext = require('loopback-context');

/**
 * update call log records for op number ids
 * @param strOpNumIds
 */
export function updateCallLogs(strOpNumIds) {

	if (strOpNumIds === "")	return

	// perform unnecessary update for call log table to update the call log support table
	let query = `UPDATE call_log t SET t.customerId = t.customerId WHERE t.opnumberId IN (${strOpNumIds})`
	app.models.CallLog.dataSource.connector.query(query, (err, results) => {
		if (err)
			console.log(">>> update call log error: ", err)
		else
			console.log(">>> update call log success: ", results)
	});
}
