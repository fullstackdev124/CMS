'use strict';

// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == "dev") config = require("../../server/config.dev.json");

var LoopBackContext = require('loopback-context');
var app = require('../../server/server');
const request = require('request');
const async = require('async');
var http = require('http');
const fs = require('fs');

const UPLOAD_ACTION_APPEND = 'append'
const UPLOAD_ACTION_UPDATE = 'update'
const UPLOAD_ACTION_DELETE = 'delete'

function get_worksheet(workbook, filename, file_extension) {
	return new Promise(resolve => {
    if (file_extension === 'xlsx') {
      workbook.xlsx.readFile(filename).then(function () {
        resolve({err: null, worksheets: workbook.worksheets[0]});
      }, function(error) {
        resolve({err: {code: 500, message: 'File import error: ' + error}, worksheets: []});
      });
    } else if (file_extension === 'csv') {
      workbook.csv.readFile(filename).then(function (worksheet) {
        resolve({err: null, worksheet});
      }, function(error) {
        resolve({err: {code: 500, message: 'File import error: ' + error}, worksheets: []});
      });
    } else {
      resolve({err: {code: 500, message: 'Only xlsx and csv extensions are supported'}, worksheets: []});
    }
  });
}

async function bulk_opnumber_handle_append(tracking_source, customer_id) {
	const TrackingSource = app.models.TrackingSources;

	// find receiving number
	const track_source = await TrackingSource.findOnePromise({ where: { 'name': tracking_source.name } });
	if (track_source) {
		return false;
	} else {
		tracking_source.customerId = customer_id;
		await TrackingSource.createPromise(tracking_source);
		return true
	}

}

async function bulk_opnumber_handle_update(tracking_source, customer_id) {
	const TrackingSource = app.models.TrackingSources;

	// find receiving number
	const track_source = await TrackingSource.findOnePromise({ where: { 'name': tracking_source.name } });

	if (!track_source) {
		return await bulk_opnumber_handle_append(tracking_source, customer_id) //false;
	}

	track_source.customerId = customer_id;
	await TrackingSource.upsertPromise(track_source);

	return true;
}

async function bulk_opnumber_handle_delete(tracking_source) {
	const TrackingSource = app.models.TrackingSources;

	// find receiving number
	const track_source = await TrackingSource.findOnePromise({ where: { 'name': tracking_source.name } });
	if (!track_source) {
		// Do nothing.
		return false;
	}

	await TrackingSource.destroyByIdPromise(track_source.id);
	return true
}

module.exports = function (Model) {

	app.on('started', function () {
	});

	Model.updateCustomer = async function (updateInfo) {
		try {
			let update = JSON.parse(updateInfo)

			let newCustomerId = update.newCustomerId
			let curCustomerId = update.curCustomerId ? update.curCustomerId : null

			let query = `UPDATE call_log t, op_number t1, tracking_sources t2 SET t.customerId = ${newCustomerId} WHERE t.opnumberId = t1.id AND t1.tracking_sourceId = t2.id AND t2.customerId = ${curCustomerId}`;
			Model.dataSource.connector.query(query, (err, res) => {

				if(!err) {
					query = `UPDATE op_number t, tracking_sources t1 SET t.customerId = ${newCustomerId} WHERE t.tracking_sourceId = t1.id AND t1.customerId = ${curCustomerId}`;
					Model.dataSource.connector.query(query, (err, res) => {
						if(!err) {
							query = `UPDATE tracking_sources SET customerId = ${newCustomerId} WHERE customerId = ${curCustomerId}`;
							Model.dataSource.connector.query(query, (err, res) => {
								return true;
							});
						} else {
							return false;
						}
					});
				} else {
					return false;
				}
			});
		} catch (e) {
			return e;
		}
	}

	Model.remoteMethod('updateCustomer', {
		accepts: [
			{ arg: 'updateInfo', type: 'string', required: true },
		],
		http: { verb: 'post' },
		returns: [
			{ type: 'object', root: true }
		]
	});

	/**
	 * get tracking sources
	 * @param filter
	 * @param cb
	 */
	Model.getTrackingSources = async function (filter, options, cb) {
		const user = JSON.parse(JSON.stringify(options.accessToken));
		if (!user) return cb(new Error('Unauthorized!'));
		let customer_id = user.DashUser.customerId;

		try {
			console.log('[Tracking Source] get list function: ', filter);

			const filterJson = JSON.parse(filter);
			if (user.DashUser.id!=1) {
				if (!filterJson.where) {
					filterJson.where = { customerId: customer_id }
				} else if (filterJson.where.and) {
					filterJson.where.and.push({customerId: customer_id})
				}
			}

			const res = await Model.find(filterJson);
			let whereJson = filterJson.where ? { where: filterJson.where } : {}
			let total_tracking_numbers = await new Promise(resolve => {
				Model.find(whereJson, function (err, res) {
					if (err || res.length === 0) {
						return resolve(0)
					}


					let trackingSourceIds = ""
					for (let source of res) {
						trackingSourceIds += trackingSourceIds === '' ? '' : ','
						trackingSourceIds += source.id
					}

					if (trackingSourceIds === "") {
						return resolve(0)
					}

					let query = `SELECT count(id) AS total_tracking_numbers FROM op_number WHERE tracking_sourceId IN (${trackingSourceIds})`

					Model.dataSource.connector.query(query, (err, results) => {

						if (err || !results) {
							console.log("[Tracking Source List] Error on getting total calls data: ", err)
							return resolve(0)
						}

						if (results.length > 0) {
							resolve(results[0].total_tracking_numbers)
						} else {
							resolve(0)
						}
					})

				})
			})

			for (const source of res) {
				// get total calls
				let query = `SELECT count(id) AS tracking_numcount FROM op_number WHERE tracking_sourceId = ${source.id}`
				await new Promise(resolve => {
					Model.dataSource.connector.query(query, (err, results) => {

						if (err) {
							console.log("[Tracking Source List] Error on getting total calls data: ", err)
							return
						}

						if (results.length > 0) {
							source.__data.tracking_numcount = results[0].tracking_numcount
						}
						resolve()
					})
				})
			}

			return {
				total_tracking_numbers: total_tracking_numbers,
				data: res
			};
		} catch (e) {
			return e;
		}
	};

	Model.remoteMethod('getTrackingSources', {
		description: 'Get Tracking Source List with Total Tracking Numbers, Individual Tracking Numbers',
		http: {
			path: '/tracking_sources',
			verb: 'get',
		},
		accepts: [
			{ arg: 'filter', type: 'string', required: false, description: 'filter param to query' },
			{arg: 'options', type: 'object', http: 'optionsFromRequest'},
		],
		returns: [
			{ type: 'object', root: true }
		],
	});


	Model.getTrackingSourcesCount = async function (where, options, cb) {
		const user = JSON.parse(JSON.stringify(options.accessToken));
		if (!user) return cb(new Error('Unauthorized!'));
		let customer_id = user.DashUser.customerId;

		console.log('[Tracking Sources] get list function: ', where);

		const filterJson = JSON.parse(where);

		if (user.DashUser.id!=1) {
			if (filterJson.and) {
				filterJson.and.push({customerId: customer_id})
			} else {
				filterJson.customerId = customer_id
			}
		}

		try {
			return await Model.count(filterJson);
		} catch (err) {
			return err;
		}
	};

	Model.remoteMethod('getTrackingSourcesCount', {
		description: 'Get count of Tracking Sources',
		http: {
			path: '/tracking_sources/count',
			verb: 'get',
		},
		accepts: [
			{arg: 'where', type: 'string', required: false, description: 'filter param to query'},
			{arg: 'options', type: 'object', http: 'optionsFromRequest'},
		],
		returns: [{type: 'object', root: true}],
	});

	Model.bulk_upload = async function (encoded_file, file_extension, customer_id, action) {

		const filename = '/tmp/upload_tsource_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.' + file_extension;
		try {
			await fs.promises.writeFile(filename, encoded_file, 'base64');
			const Excel = require('exceljs');
			const workbook = new Excel.Workbook();

			/**
			 * Actions are:
			 * 		append
			 * 		update
			 * 		delete
			 *
			 * if not supplied (backward compatibility), update is choosen
			 */
			if (!action) {
				action = UPLOAD_ACTION_UPDATE;
			}

			console.log('Chosen action:', action);

			// retrieving worksheet based on filetype
			const { err, worksheet } = await get_worksheet(workbook, filename, file_extension);
			if (worksheet != null) {
				const rows = [];

				// Worksheet eachRow is fully asyncronous, I need that row will be sequentially evaluated
				// to correctly load data without duplicates.
				worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
					if (rowNumber === 1) return;

					let tracking_source = worksheet.getCell('A' + rowNumber).value;
					tracking_source = ((tracking_source != null) ? tracking_source.toString() : '');
					tracking_source = tracking_source.replace(/-/g, '');

					const temp_item = {
						'name': tracking_source,
						'type': 'onsite',
						'description': 'Bulk import'
					};

					console.log('[File Parse] Row number: ', rowNumber, ')', temp_item);
					rows.push(temp_item);
				});

				let total = rows.length
				let completed = 0, failed = 0, crashed = 0

				// Sequentially load data
				for (const row of rows) {
					try {
						let isSuccess = false;

						if (action === UPLOAD_ACTION_APPEND) {
							isSuccess = await bulk_opnumber_handle_append(row, customer_id);
						} else if (action === UPLOAD_ACTION_UPDATE) {
							isSuccess = await bulk_opnumber_handle_update(row, customer_id);
						} else if (action === UPLOAD_ACTION_DELETE) {
							isSuccess = await bulk_opnumber_handle_delete(row);
						}

						if (isSuccess)
							completed ++
						else
							failed ++;

					} catch (ex) {
						crashed ++;
						console.log(`Error occurred while processing, tracking_source=${row}, error=${ex}`);
					}
				}

				return { 'code': 200, total, completed, failed, crashed };
			} else {
				return err;
			}
		} catch (e) {
			return e;
		}
	};

	Model.remoteMethod('bulk_upload', {
		description: 'Bulk loads Tracking Sources from file',
		accepts: [
			{
				arg: 'encoded_file',
				type: 'string',
				required: true,
				description: 'Base64 encoded file',
				http: { source: 'form' }
			},
			{
				arg: 'file_extension',
				type: 'string',
				required: true,
				description: 'File type extension',
				http: { source: 'form' }
			},
			{
				arg: 'customer_id',
				type: 'number',
				required: false,
				description: 'Customer Id',
				http: { source: 'form' }
			},
			{
				arg: 'action',
				type: 'string',
				required: false,
				description: 'Action choosen between append/update/delete',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'file_object',
			type: 'object',
			root: true
		},
		http: { verb: 'post' }
	});

	Model.bulk_download = async function (res, where) {
		let whereJson = JSON.parse(where)
		let whereClause = { 'where': whereJson };

		try {
			let tsources = await Model.find(whereClause);
			tsources = JSON.parse(JSON.stringify(tsources));
			let string_data = 'Tracking Source, Company ID\n';
			tsources.forEach(function (tSource) {
				string_data +=
					tSource.name + ','
					+ (tSource.hasOwnProperty('Customer') ? tSource.Customer['companyId'] : '') + '\n'
					;
			});

			var datetime = new Date();
			res.set('Expires', 'Thu, 01 Jan 1970 00:00:01 GMT');
			res.set('Cache-Control', 'max-age=0, no-cache, must-revalidate, proxy-revalidate');
			res.set('Last-Modified', datetime + 'GMT');
			res.set('Content-Type', 'application/force-download');
			res.set('Content-Type', 'application/octet-stream');
			res.set('Content-Type', 'application/download');
			res.set('Content-Disposition', 'attachment;filename=Data.csv');
			res.set('Content-Transfer-Encoding', 'binary');
			res.send({ status: 'OK', csv_data: string_data });
		} catch (e) {
			res.send({ status: 'KO', error: e });
		}
	};

	Model.remoteMethod('bulk_download', {
		description: 'Bulk export tracking sources to csv file',
		accepts: [
			{ arg: 'res', type: 'object', 'http': { source: 'res' } },
			{ arg: 'where', type: 'string', required: true },
		],
		returns: [
			{ 'type': 'string', 'root': true },
			{ 'arg': 'Content-Type', 'type': 'string', 'http': { 'target': 'header' } }
		],
		http: { verb: 'get' }
	});
}
