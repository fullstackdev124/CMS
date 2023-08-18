// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == 'dev') config = require('../../server/config.dev.json');

const fs = require('fs');
const path = require('path');
const async = require('async');

const app = require('../../server/server');
const LoopBackContext = require('loopback-context');

let http = require('http');
const request = require('request');

const UPLOAD_ACTION_APPEND = 'append';
const UPLOAD_ACTION_UPDATE = 'update';
const UPLOAD_ACTION_DELETE = 'delete';

const _ = require('lodash');

function get_worksheet(workbook, filename, file_extension) {
  return new Promise(resolve => {
    if (file_extension === 'xlsx') {
      workbook.xlsx.readFile(filename).then(function () {
        resolve({err: null, worksheets: workbook.worksheets[0]});
      }, function(error) {
        resolve({err: {code: 500, "message": 'File import error: ' + error}, worksheets: []});
      });
    } else if (file_extension === 'csv') {
      workbook.csv.readFile(filename).then(function (worksheet) {
        resolve({err: null, worksheet});
      }, function(error) {
        resolve({err: {code: 500, "message": 'File import error: ' + error}, worksheets: []});
      });
    } else {
      resolve({err: {code: 500, "message": 'Only xlsx and csv extensions are supported'}, worksheets: []});
    }
  });
}

/**
 * Bulk append action. This will mainly create all needed components if does not exists
 * @param {*} tracking_number
 * @param {*} tracking_source
 * @param {*} receiving_number
 * @param {*} customer_id
 * @param {*} routingAction
 * @returns
 */
 async function bulk_opnumber_handle_append(tracking_number, tracking_source, receiving_number, customer_id, routingAction) {
  try {
    const OpNumber = app.models.OpNumber;
    const TrSources = app.models.TrackingSources;
    const RecvNumber = app.models.ReceivingNumber;
    let trsource_id = -1, recv_number_id = -1, routing_action;

    // Looking for tracking number existence (not using customer id in where clause
    // because tracking number is supposed to be unique)
    let opnumber = await OpNumber.findOnePromise({where: {tracking_number: { like: tracking_number.replace(/^\+/g, "%") }}});

    if (opnumber) {
      // Tracking number already exists just return
      return { "code": 500, "message": "Already existing tracking number." };
    }

    // Search for the tracking source, if not defined default customer
    // "OTHERS" tracking source will be used.
    if (!tracking_source) { tracking_source = "OTHERS"; }
    const trsource = await TrSources.findOrCreatePromise({
      where: {
        and: [{name: tracking_source}, {customerId: customer_id}],
      }
    }, { name: tracking_source, customerId: customer_id });

    if (trsource) {
      trsource_id = trsource.id
    } else {
      // Tracking sources can't be created
      return { "code": 500, "message": "Unable to create tracking source." };
    }

    // Search for the receiving number if
    // does not exists just create it
    if (receiving_number) {
      // find receiving number
      let recv_number = await RecvNumber.findOrCreatePromise({
        where: {
          and: [{ number: { like: receiving_number.replace(/^\+/g, "%") }}, { customerId: customer_id }],
        }
      }, { number: receiving_number, customerId: customer_id });

      if (recv_number) {
        recv_number_id = recv_number.id
        routing_action = "REMAP_FORWARD_TO";
        if(routingAction.trim().length > 0) routing_action = routingAction;
      } else {
        return { "code": 500, "message": "Unable to create requested receiving number." };
      }
    } else {
      routing_action = 'NOT_MAPPED';
      recv_number_id = null;
    }

    const op_number = {};
    op_number.customerId = customer_id;
    op_number.tracking_number = tracking_number;

    if (recv_number_id != -1) op_number.receiving_numberId = recv_number_id;
    if (trsource_id != -1)    op_number.tracking_sourceId = trsource_id;
    if (routing_action)       op_number.routing_action = routing_action;

    const result = await OpNumber.createPromise(op_number);

    if(result)
      return { "code": 200, "message": "Tracking number successfully created." };
    else
      return { "code": 500, "message": "Unable to create tracking number." };

  } catch (e) {
    console.log('[ee] Bulk append error:', e);
    return { "code": 500, "message": "Append exception occurred." };
  }
}

/**
 * Bulk update action. This will mainly update relationship between already existing components
 * @param {*} tracking_number
 * @param {*} tracking_source
 * @param {*} receiving_number
 * @param {*} customer_id
 * @param {*} routingAction
 * @returns
 */
async function bulk_opnumber_handle_update(tracking_number, tracking_source, receiving_number, customer_id, routingAction) {
  try {

    const OpNumber = app.models.OpNumber;
    const TrSources = app.models.TrackingSources;
    const RecvNumber = app.models.ReceivingNumber;
    let trsource_id  = -1, recv_number_id = -1, routing_action;

    // Find or create, if not found, the tracking number
    let opnumber = await OpNumber.findOrCreatePromise({
      where: {
        and: [{ tracking_number: { like: tracking_number.replace(/^\+/g, "%") }}, { customerId: customer_id }],
      }
    }, { tracking_number: tracking_number, customerId: customer_id });

    if (!opnumber) {
      // Unable to create tracking number
      return { "code": 500, "message": "Unable to create tracking number." };
    }

    // Search for the tracking source, if not defined default customer
    // "OTHERS" tracking source will be used.
    if (!tracking_source) { tracking_source = "OTHERS"; }
    const trsource = await TrSources.findOrCreatePromise({
      where: {
        and: [{name: tracking_source}, {customerId: customer_id}],
      }
    }, { name: tracking_source, customerId: customer_id });

    if (trsource) {
      trsource_id = trsource.id
    } else {
      // Tracking sources can't be created
      return { "code": 500, "message": "Unable to create tracking source." };
    }

    // Search for the receiving number if
    // does not exists just create it
    if (receiving_number) {
      // find receiving number
      let recv_number = await RecvNumber.findOrCreatePromise({
        where: {
          and: [{ number: { like: receiving_number.replace(/^\+/g, "%") }}, { customerId: customer_id }],
        }
      }, { number: receiving_number, customerId: customer_id });

      if (recv_number) {
        recv_number_id = recv_number.id
        routing_action = "REMAP_FORWARD_TO";
        if(routingAction.trim().length > 0) routing_action = routingAction;
      } else {
        return { "code": 500, "message": "Unable to create requested receiving number." };
      }
    } else {
      routing_action = 'NOT_MAPPED';
      recv_number_id = null;
    }

    if (routing_action)      opnumber.routing_action = routing_action;
    if (trsource_id =-1)     opnumber.tracking_sourceId = trsource_id;
    if (recv_number_id !=-1) opnumber.receiving_numberId = recv_number_id;

    const result = await OpNumber.upsertPromise(opnumber);

    if(result)
      return { "code": 200, "message": "Tracking number successfully updated." };
    else
      return { "code": 500, "message": "Unable to update tracking number." };

  } catch (e) {
    console.log('[ee] Bulk update error:', e);
    return { "code": 500, "message": "Update exception occurred." };
  }
}

async function bulk_opnumber_handle_delete(tracking_number, tracking_source, receiving_number, customer_id) {
  try {

    let code = 200;
    let message = "";
    const OpNumber = app.models.OpNumber;

    if (tracking_number) {
      const opnumber = await OpNumber.findOnePromise({
        where: {
          and: [{ tracking_number: { like: tracking_number.replace(/^\+/g, "%") }}, { customerId: customer_id }],
        }
      });

      if (opnumber) {
        const result = await OpNumber.destroyByIdPromise(opnumber.id);
        if(result) {
          message += "Tracking number successfully deleted. ";
        } else {
          code = 500;
          message += "Unable to delete tracking number. ";
        }
      } else {
        code = 500;
        message += "Tracking number not found. ";
      }
    }

    if (receiving_number) {
      const RecvNumber = app.models.ReceivingNumber;
      let recv_number = await RecvNumber.findOnePromise({
        where: {
          and: [{ number: { like: receiving_number.replace(/^\+/g, "%") }}, { customerId: customer_id }],
        }
      });

      if (recv_number) {
        const result = await RecvNumber.destroyByIdPromise(recv_number.id);
        if(result) {
          message += "Receiving number " + recv_number.number + " successfully removed. ";
        } else {
          message += "Unable to remove receiving number " + recv_number.number + ". ";
        }
      } else {
        code = 500;
        message += "Receiving number not found. ";
      }
    }

    if (tracking_source) {
      const TrSources = app.models.TrackingSources;
      const trsource = await TrSources.findOnePromise({
        where: {
          and: [{name: tracking_source}, {customerId: customer_id}],
        }
      });

      if (trsource) {
        // Check if tracking source have some
        let query = "SELECT `opn`.`tracking_number` FROM `op_number` as `opn` WHERE `opn`.`tracking_sourceId` = '" + trsource.id + "'";
        OpNumber.dataSource.connector.query(query, async (err, results) => {
          if ((err) || (results && results.length > 0)) {
            code = 500;
            message += "Tracking source is still bound to other tracking numbers.";
          } else {
            const result = await TrSources.destroyByIdPromise(trsource.id);
            if(result) {
              message += "Tracking source " + trsource.name + " successfully removed.";
            } else {
              message += "Unable to remove tracking source " + trsource.name + ".";
            }
          }
        });
      } else {
        code = 500;
        message += "Tracking source not found.";
      }
    }

    return { "code": code, "message": message };

  } catch (e) {
    console.log('[ee] Bulk update error:', e);
    return { "code": 500, "message": "Delete exception occurred." };
  }
}

module.exports = function (Model) {
  app.on('started', function () {
    Model.nestRemoting('Customer');
    Model.nestRemoting('TrackingSources');
    Model.nestRemoting('ReceivingNumber');
    Model.nestRemoting('SipGateways');
  });

  Model.get_receiving_number = async function (tracking_number) {
    try {
      const res = await Model.findOne({where: {tracking_number: tracking_number}});
      if (!res) return null;

      const json_res = res.toJSON();
      if (json_res.ReceivingNumber && json_res.ReceivingNumber.number) return json_res.ReceivingNumber.number;
      else return null;
    } catch (e) {
      return e;
    }
  };

  Model.remoteMethod('get_receiving_number', {
    accepts: [{arg: 'tracking_number', type: 'string', required: true}],
    http: {verb: 'get'},
    returns: [{type: 'boolean', root: true}],
  });

  Model.updateCustomer = async function (updateInfo, cb) {
    const update = JSON.parse(updateInfo);

    let query = '';
    const newCustomerId = update.newCustomerId;
    const curCustomerId = update.curCustomerId ? update.curCustomerId : null;
    const trackingSourceId = update.trackingSourceId ? update.trackingSourceId : null;

    if (curCustomerId) query = `UPDATE call_log t, op_number t1 SET t.customerId = ${newCustomerId} WHERE t.opnumberId = t1.id AND t1.customerId = ${curCustomerId}`;
    else if (trackingSourceId)
      query = `UPDATE call_log t, op_number t1 SET t.customerId = ${newCustomerId} WHERE t.opnumberId = t1.id AND t1.tracking_sourceId = ${trackingSourceId}`;

    // console.log(">>>> update customer on op number / update call log customer query: ", query)

    if (query === '') {
      cb(null);
    } else {
      try {
        await Model.dataSource.connector.query(query);
        if (curCustomerId) query = `UPDATE op_number SET customerId = ${newCustomerId} WHERE customerId = ${curCustomerId}`;
        else if (trackingSourceId) query = `UPDATE op_number SET customerId = ${newCustomerId} WHERE tracking_sourceId = ${trackingSourceId}`;

        // console.log(">>>> update customer on op number / update op number customer query: ", query)
        await Model.dataSource.connector.query(query);
        return null;
      } catch (e) {
        return e;
      }
    }
  };

  Model.remoteMethod('updateCustomer', {
    accepts: [{arg: 'updateInfo', type: 'string', required: true}],
    http: {verb: 'post'},
    returns: [{type: 'object', root: true}],
  });

  Model.bulk_upload = function (encoded_file, file_extension, customer_id, action, routingAction, countryCode, countryCode1, res, cb) {
    const filename = '/tmp/upload_tnumber_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.' + file_extension;
    fs.writeFile(filename, encoded_file, 'base64', async function (err) {
      if (err !== null) {
        cb(err);
      } else {
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

        // retrieving worksheet based on filetype
        try {
          const {err, worksheet} = await get_worksheet(workbook, filename, file_extension);
          if (worksheet != null) {
            const rows = [];

            // Worksheet eachRow is fully asyncronous, I need that row will be sequentially evaluated
            // to correctly load data without duplicates.
            worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
              if (rowNumber === 1) return;

              // assuming column 1 is Tracking Number, column 2 is  Tracking Source ReceivingNumber
              // column 3 is Routing and column 4 is Receiving Number
              let tracking_number = worksheet.getCell('A' + rowNumber).value;
              tracking_number = tracking_number != null ? tracking_number.toString() : '';
              tracking_number = tracking_number.replace(/-/g, '');
              tracking_number = tracking_number.replace(/'/g, '');

              // Prepend country code if sent
              if(countryCode && countryCode.trim().length > 0) tracking_number = countryCode + tracking_number;

              let tracking_source = worksheet.getCell('B' + rowNumber).value;
              tracking_source = tracking_source != null ? tracking_source.toString() : '';

              let receiving_number = worksheet.getCell('C' + rowNumber).value;
              receiving_number = receiving_number != null ? receiving_number.toString() : '';
              receiving_number = receiving_number.replace(/-/g, '');
              receiving_number = receiving_number.replace(/'/g, '');

              // Prepend country code if sent
              if(countryCode1 && countryCode1.trim().length > 0) receiving_number = countryCode1 + receiving_number;

              const temp_item = {
                row_number: rowNumber,
                tracking_source: tracking_source,
                receiving_number: receiving_number,
                tracking_number: tracking_number,
              };

              // console.log('[File Parse] Row number: ', rowNumber, ')', temp_item);
              rows.push(temp_item);
            });

            // Sequentially load data
            let reports = "Row,Number,Status,Description\n"

            // Sequentially load data
            for (const row of rows) {
              const ise164 = /^\+\d{1,3}\d{3,14}$/;
              let {row_number, tracking_number, tracking_source, receiving_number} = row;

              if(ise164.test(tracking_number)) {

                // Just nullify receiving number if not valid but do not interrupt execution
                if(!ise164.test(receiving_number)) { receiving_number = null; }

                try {
                  let result = { "code": 500, "message": "Unknown Action" };

                  if (action === UPLOAD_ACTION_APPEND) {
                    result = await bulk_opnumber_handle_append(tracking_number, tracking_source, receiving_number, customer_id, routingAction);
                  } else if (action === UPLOAD_ACTION_UPDATE) {
                    result = await bulk_opnumber_handle_update(tracking_number, tracking_source, receiving_number, customer_id, routingAction);
                  } else if (action === UPLOAD_ACTION_DELETE) {
                    result = await bulk_opnumber_handle_delete(tracking_number, tracking_source, receiving_number, customer_id);
                  } else {
                    result = "Unknown Action"
                  }

                  if (result.code == 200)
                    reports += row_number + "," + tracking_number + ",Success," + result.message + "\n";
                  else
                    reports += row_number + "," + tracking_number + ",Failed,"  + result.message + "\n";

                } catch (ex) {
                  console.log(`[ee] Error occurred while processing, tracking_source=${row}, error=${ex}`);
                  reports += row_number + "," + tracking_number + ",Failed," + ex + "\n"
                }
              } else {
                reports += row_number + "," + tracking_number + ",Failed,Tracking number is not in a e164 valid format\n";
              }
            }

            var datetime = new Date();
            res.set('Expires', 'Thu, 01 Jan 1970 00:00:01 GMT');
            res.set('Cache-Control', 'max-age=0, no-cache, must-revalidate, proxy-revalidate');
            res.set('Last-Modified', datetime + 'GMT');
            res.set('Content-Type', 'application/force-download');
            res.set('Content-Type', 'application/octet-stream');
            res.set('Content-Type', 'application/download');
            res.set('Content-Disposition', 'attachment;filename=BulkUploadReport.csv');
            res.set('Content-Transfer-Encoding', 'binary');
            res.send({ status: 'OK', csv_data: reports });

          } else {
            return cb(err, {code: 500, "message": 'Error occourred parsing file'});
          }
        } catch(e) {
          console.log(`[ee] Error occurred while processing file, error=${e.stack}`);
          return cb(err, {code: 500, "message": 'File seems to be corrupted'});
        }
      }
    });
  };

  Model.remoteMethod('bulk_upload', {
    description: 'Bulk loads tracking numbers, tracking sources and receiving numbers from a file',
    accepts: [
      {
        arg: 'encoded_file',
        type: 'string',
        required: true,
        description: 'Base64 encoded file',
        http: {source: 'form'},
      },
      {
        arg: 'file_extension',
        type: 'string',
        required: true,
        description: 'File type extension',
        http: {source: 'form'},
      },
      {
        arg: 'customer_id',
        type: 'number',
        required: false,
        description: 'Customer Id',
        http: {source: 'form'},
      },
      {
        arg: 'action',
        type: 'string',
        required: false,
        description: 'Action choosen between append/update/delete',
        http: {source: 'form'},
      },
      {
        arg: 'routingAction',
        type: 'string',
        required: false,
        description: 'Action choosen between forward_to/remap_forward_to/dial_agent/hang_up',
        http: {source: 'form'},
      },
      {
        arg: 'countryCode',
        type: 'string',
        required: false,
        description: 'The country code to be prepended to tracking numbers',
        http: {source: 'form'},
      },
      {
        arg: 'countryCode1',
        type: 'string',
        required: false,
        description: 'The country code to be prepended to receiving number',
        http: {source: 'form'},
      },
      { arg: 'res', type: 'object', 'http': { source: 'res' } },
    ],
    returns: [
      { 'type': 'string', 'root': true },
      { 'arg': 'Content-Type', 'type': 'string', 'http': { 'target': 'header' } }
    ],
    http: {verb: 'post'},
  });

  Model.bulk_download = async function (res, where, sorting) {
    const whereJson = JSON.parse(where);
    const whereClause = {where: whereJson};
    if (sorting)
      whereClause.order = [ sorting ]

    const OpNumber = app.models.OpNumber;
    try {
      let tnumbers = await OpNumber.find(whereClause);
      tnumbers = JSON.parse(JSON.stringify(tnumbers));
      // for (let num of tnumbers) {
      // 	// get total calls
      // 	let query = `SELECT count(id) AS total_calls FROM call_log WHERE opnumberId = ${num.id}`
      // 	await new Promise(resolve => {
      // 		Model.dataSource.connector.query(query, (err, results) => {
      //
      // 			if (err) {
      // 				return
      // 			}
      //
      // 			if (results.length > 0) {
      // 				num.total_calls = results[0].total_calls
      // 			}
      // 			resolve()
      // 		})
      // 	})
      // }

      let string_data = 'Tracking Number, Tracking Source, Company ID, Routing, Receiving Number\n';
      tnumbers.forEach(function (tnumber) {
        string_data +=
          tnumber.tracking_number +
          ',' +
          (tnumber.hasOwnProperty('TrackingSources') ? tnumber.TrackingSources['name'] : '') +
          ',' +
          (tnumber.hasOwnProperty('Customer') ? tnumber.Customer['companyId'] : '') +
          ',' +
          (tnumber.hasOwnProperty('SipGateways') ? tnumber.SipGateways.name : '') +
          ',' +
          (tnumber.hasOwnProperty('ReceivingNumber') ? tnumber.ReceivingNumber.number : '') +
          '\n';
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
    description: 'Bulk export receiving numbers to csv file',
    accepts: [
			{ arg: 'res', type: 'object', 'http': { source: 'res' } },
			{ arg: 'where', type: 'string', required: true },
      { arg: 'sorting', type: 'string', required: false },
		],
		returns: [
			{ 'type': 'string', 'root': true },
			{ 'arg': 'Content-Type', 'type': 'string', 'http': { 'target': 'header' } }
		],
		http: { verb: 'get' }
  });

  /**
   * get tracking numbers
   * @param filter
   * @param cb
   */
  Model.getTrackingNumbers = async function (filter, options, cb) {
    const user = JSON.parse(JSON.stringify(options.accessToken));
    if (!user) return cb(new Error('Unauthorized!'));
    let customer_id = user.DashUser.customerId;

    console.log('[Tracking Number] get list function: ', filter);

    const filterJson = JSON.parse(filter);


    if (user.DashUser.id!=1) {
      if (!filterJson.where) {
        filterJson.where = { customerId: customer_id }
      } else if (filterJson.where.and) {
        filterJson.where.and.push({customerId: customer_id})
      }
    }

    try {
      return await Model.find(filterJson);
    } catch (err) {
      return err;
    }
  };

  Model.remoteMethod('getTrackingNumbers', {
    description: 'Get Tracking Number List',
    http: {
      path: '/tracking_numbers',
      verb: 'get',
    },
    accepts: [
      {arg: 'filter', type: 'string', required: false, description: 'filter param to query'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: [{type: 'object', root: true}],
  });

  Model.getTrackingNumbersCount = async function (where, options, cb) {
    const user = JSON.parse(JSON.stringify(options.accessToken));
    if (!user) return cb(new Error('Unauthorized!'));
    let customer_id = user.DashUser.customerId;

    console.log('[Tracking Number] get list function: ', where);

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

  Model.remoteMethod('getTrackingNumbersCount', {
    description: 'Get count of Tracking Numbers',
    http: {
      path: '/tracking_numbers/count',
      verb: 'get',
    },
    accepts: [
      {arg: 'where', type: 'string', required: false, description: 'filter param to query'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: [{type: 'object', root: true}],
  });

  Model.getTrackingNumbersWithCallCount = async function (filter) {
    console.log('[Tracking Number] get list function: ', filter);

    const filterJson = JSON.parse(filter);
    try {
      const res = await Model.find(filterJson);
      const result = await Promise.all(
        res.map(num => {
          return new Promise((resolve, reject) => {
            // get total calls
            const query = `SELECT count(id) AS total_calls FROM call_log WHERE opnumberId = ${num.id}`;
            Model.dataSource.connector.query(query, (err, results) => {
              if (err) reject(err);
              resolve(results[0].total_calls);
            });
          });
        }),
      );
      try {
        await res.map((num, index) => {
          num.__data.total_calls = result[index];
        });
      } catch (e) {
        console.log(e);
      }
      return res;
      // for (const num of res) {
      // 	// get total calls
      // 	const query = `SELECT count(id) AS total_calls FROM call_log WHERE opnumberId = ${num.id}`;
      // 	await new Promise(resolve => {
      // 		Model.dataSource.connector.query(query, (err, results) => {
      // 			if (err || !results) {
      // 				return resolve();
      // 			}
      //
      // 			if (results.length > 0) {
      // 				num.__data.total_calls = results[0].total_calls;
      // 			}
      // 			resolve();
      // 		});
      // 	});
      // }
    } catch (err) {
      return err;
    }
  };

  Model.remoteMethod('getTrackingNumbersWithCallCount', {
    description: 'Get Tracking Number List with Total Calls',
    http: {
      path: '/tracking_numbers_count',
      verb: 'get',
    },
    accepts: [{arg: 'filter', type: 'string', required: false, description: 'filter param to query'}],
    returns: [{type: 'object', root: true}],
  });

  /**
   * update cp number that id is param id
   * @param id
   * @param num
   * @param cb
   */
  Model.update = async function (id, num) {
    console.log('[Op Number] update function ');
    try {
      const res = await Model.replaceById(id, num);
      console.log(`[Op Number] updated ${id}`);

      // call the api to update the hadoop db
      // first, get the data to send
      const query =
        'SELECT a.id AS opNumber_id, ' +
        'a.tracking_number AS opNumber_trackingNumber, ' +
        'a.routing_action AS opNumber_routingAction, ' +
        'a.notifications AS opNumber_notifications, ' +
        'a.text_support AS opNumber_textSupport, ' +
        'a.number_tags AS opNumber_numberTags, ' +
        'a.failsafe_number AS opNumber_failsafeNumber, ' +
        'a.renewal_date AS opNumber_renewalDate, ' +
        'a.active AS opNumber_active, ' +
        'a.description AS opNumber_description, ' +
        'b.id AS trackingSource_id, ' +
        'b.name AS trackingSource_name, ' +
        'b.type AS trackingSource_type, ' +
        'b.position AS trackingSource_position, ' +
        'b.last_touch AS trackingSource_lastTouch, ' +
        'b.global_unique AS trackingSource_globalUnique, ' +
        'b.updated_at AS trackingSource_updatedAt, ' +
        'b.description AS trackingSource_description, ' +
        'c.id AS receivingNumber_id, ' +
        'c.number AS receivingNumber_number, ' +
        'c.description AS receivingNumber_description, ' +
        'd.id AS sipGateway_id, ' +
        'd.name AS sipGateway_name, ' +
        'd.address AS sipGateway_address, ' +
        'd.port AS sipGateway_port, ' +
        'd.digits_strip AS sipGateway_digitsStrip, ' +
        'd.description AS sipGateway_description, ' +
        'a.customerId ' +
        ' FROM ecms.op_number a ' +
        ' LEFT JOIN ecms.tracking_sources b ON a.tracking_sourceId = b.id ' +
        ' LEFT JOIN ecms.receiving_number c ON a.receiving_numberId = c.id ' +
        ' LEFT JOIN ecms.sip_gateways d ON a.sip_gatewayId = d.id ' +
        ' WHERE a.id = ' +
        id;

      console.log(`>>> ${new Date()} [Op Number Updating] query: `, query);
      const results = Model.dataSource.connector.query(query);
      if (results.length === 0) return null;
      console.log(`>>> ${new Date()} [Op Number Updating] Op Number data to send to the hadoop:`, results);

      return res;
    } catch (e) {
      return e;
    }
  };

  Model.remoteMethod('update', {
    description: 'Update OpNumber',
    http: {
      path: '/:id/update',
      verb: 'put',
    },
    accepts: [
      {arg: 'id', type: 'number', required: true, description: 'op number id'},
      {arg: 'num', type: 'object', required: true, http: {source: 'body'}},
    ],
    returns: [{type: 'object', root: true}],
  });

  /**
   * update cp number that id is param id
   * @param id
   * @param cb
   */
  Model.deleteOpNumber = async function (id) {
    console.log('[Op Number] delete function ');
    try {
      const res = await Model.deleteById(id);
      console.log(`[Op Number] deleted ${id}`);

      return res;
    } catch (e) {
      return e;
    }
  };

  Model.remoteMethod('deleteOpNumber', {
    description: 'Delete OpNumber',
    http: {
      path: '/:id/delete',
      verb: 'delete',
    },
    accepts: [{arg: 'id', type: 'number', required: true, description: 'op number id'}],
    returns: [{type: 'object', root: true}],
  });

  // Add updating tracking number with the new tracking source
  Model.updateTrackingSource = async (id, req) => {
    const {tracking_sourceId, update_call_logs, recording_enable} = req;
    if (!tracking_sourceId) {
      throw new Error('Bad Request, New Tracking Source Required');
    }
    const TrSources = app.models.TrackingSources;
    const trSource = await TrSources.findById(tracking_sourceId);
    if (!trSource) {
      throw new Error(`[Op Number Tracking Source Updating] No tracking source with id=[${tracking_sourceId}]`);
    }

    const num = await Model.findById(id);
    if (!num) {
      throw new Error(`[Op Number Tracking Source Updating] No number with id=${id}`);
    }

    // assign values from request
    Object.assign(num, _.omit(req, ['ReceivingNumber', 'Customer', 'TrackingSources', 'SipGateways', 'NumberProvider']));

    // update number
    num.tracking_sourceId = tracking_sourceId;

    // update customer Id to the tracking source of customer Id
    num.customerId = trSource.customerId;

    // enable/disable recording by this number
    num.recording_enable = recording_enable;

    // Update Routing Action
    num.routing_action = req.routing_action;

    // Update Agent values
    num.agent_id = req.agent_id;
    num.agent_timeout = req.agent_timeout;
    num.failover_agent_id = req.failover_agent_id;

    let tracking_num = num.tracking_number
    if (tracking_num!="") {
      if (tracking_num.length==12 && tracking_num.substring(0,2)=="+1")
        tracking_num = tracking_num.substring(2)
      else
        tracking_num = ""
    }

    try {
      const result = await num.save();

      if (update_call_logs!=null && update_call_logs===true && tracking_num!="" && tracking_num.length==10) {
        let sql = `update call_log set opnumberId=${id} where tracking_number='${tracking_num}'`
        console.log("update past calls", update_call_logs, sql)
        Model.dataSource.connector.query(sql, function(err, ts){
          if (err)
            console.log("Updating past calls", err)
        })
      }

      return result;
    } catch (err) {
      console.log(`${new Date()} Updating tracking number with new tracking source failed, ${err}`);
    }
  };

  Model.remoteMethod('updateTrackingSource', {
    description: 'Update Tracking Source',
    http: {
      path: '/:id/UpdateTrackingSource',
      verb: 'post',
    },
    accepts: [
      {arg: 'id', type: 'number', required: true, description: 'op number id'},
      {arg: 'req', type: 'object', required: true, http: {source: 'body'}},
    ],
    returns: [{type: 'object', root: true}],
  });
};
