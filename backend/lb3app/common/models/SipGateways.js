'use strict';

const fs = require('fs');
var http = require('http');
const async = require('async');

var app = require('../../server/server');

const UPLOAD_ACTION_APPEND = 'append';
const UPLOAD_ACTION_UPDATE = 'update';
const UPLOAD_ACTION_DELETE = 'delete';

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

async function bulk_opnumber_handle_append(
  sipGateway_name,
  sipGateway_address,
  sipGateway_port,
  customer_id,
) {
  const SipGateways = app.models.SipGateways;

  // find sip_gateway
  const sip_gateway = await SipGateways.findOnePromise({
    where: {name: sipGateway_name},
  });
  if (sip_gateway) {
    return false;
  }

  await SipGateways.createPromise({
    customerId: customer_id,
    name: sipGateway_name,
    address: sipGateway_address,
    port: sipGateway_port,
    isWhitelisted: 1,
    description: "No description",
  });

  return true
}

async function bulk_opnumber_handle_update(
  sipGateway_name,
  sipGateway_address,
  sipGateway_port,
  customer_id,
) {
  const SipGateways = app.models.SipGateways;

  // find sip_gateway
  const sip_gateway = await SipGateways.findOnePromise({
    where: {name: sipGateway_name},
  });

  if (!sip_gateway) {
    return await bulk_opnumber_handle_append(sipGateway_name, sipGateway_address, sipGateway_port, customer_id);
  }

  sip_gateway.customerId = customer_id;
  sip_gateway.address = sipGateway_address;
  sip_gateway.port = sipGateway_port;

  await SipGateways.upsertPromise(sip_gateway);

  return true
}

async function bulk_opnumber_handle_delete(sipGateway_name) {
  const SipGateways = app.models.SipGateways;

  // find sip_gateway
  const sip_gateway = await SipGateways.findOnePromise({
    where: {name: sipGateway_name},
  });
  if (!sip_gateway) {
    // Do nothing.
    return false;
  }
  console.log(
    `Removing SipGateway : ${sipGateway_name}, id = ${sip_gateway.id}`,
  );
  await SipGateways.destroyByIdPromise(sip_gateway.id);
  return true;
}

module.exports = function (Model) {
  app.on('started', function () {});

  /**
   * Update Module Reload table after save
   */
  Model.observe('after save', (ctx, next) => {
    app.models.ModulesReload.findOne(
      {
        where: {
          and: [{component: 'droute'}, {action: 'reload'}],
        },
      },
      (err, modreload) => {
        if (modreload) {
          modreload.result = 1;
          modreload.update = new Date();
          modreload.save();
        }
      },
    );

    next();
  });

  /**
   * Update Module Reload table after delete
   */
  Model.observe('after delete', (ctx, next) => {
    console.log('Before delete: ', ctx);
    app.models.ModulesReload.findOne(
      {
        where: {
          and: [{component: 'droute'}, {action: 'reload'}],
        },
      },
      (err, modreload) => {
        if (modreload) {
          modreload.result = 1;
          modreload.update = new Date();
          modreload.save();
        }
      },
    );

    next();
  });

  Model.order = (gw_list, cb) => {
    try {
      let gws = JSON.parse(JSON.stringify(gw_list));
      gws.forEach(gw => {
        let gw_id = parseInt(gw.id);
        let gw_order = parseInt(gw.order);

        // Some weird parsing happened
        if(isNaN(gw_id) || isNaN(gw_order))
          cb(null, new Error("Wrong gateway list"));

        Model.findOne({where: {id: gw_id }}, (err, gateway) => {
          console.log("Gateway: ", gateway);
          if(!err && gateway) {
            gateway.order = gw_order;
            gateway.save();
          } else {
            return cb(null, new Error("Wrong gateway list"));
          }
        });
      })
    } catch (error) {
      return cb(null, error);
    } finally {
      return cb();
    }
  }

  Model.remoteMethod('order', {
    description: 'Order gateways list',
    http: {
      path: '/order',
      verb: 'post',
    },
    accepts: [{arg: 'gw_list', type: 'array', required: true}],
    returns: [{type: 'object', root: true}],
  });

  Model.bulk_upload = function (
    encoded_file,
    file_extension,
    customer_id,
    action,
    cb,
  ) {
    const filename =
      '/tmp/upload_sipGateway_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      '.' +
      file_extension;
    fs.writeFile(filename, encoded_file, 'base64', async function (err) {
      if (err !== null) {
        cb(err);
      } else {
        var Excel = require('exceljs');
        var workbook = new Excel.Workbook();

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
        const {err, worksheet} = await get_worksheet(
          workbook,
          filename,
          file_extension,
        );
        if (worksheet != null) {
          const rows = [];

          // Worksheet eachRow is fully asyncronous, I need that row will be sequentially evaluated
          // to correctly load data without duplicates.
          worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
            if (rowNumber === 1) return;

            let sipGateway_name = worksheet.getCell('A' + rowNumber).value;
            sipGateway_name =
              sipGateway_name != null ? sipGateway_name.toString() : '';
            sipGateway_name = sipGateway_name.replace(/-/g, '');

            let sipGateway_address = worksheet.getCell('B' + rowNumber).value;
            sipGateway_address =
              sipGateway_address != null ? sipGateway_address.toString() : '';
            sipGateway_address = sipGateway_address.replace(/-/g, '');

            let sipGateway_port = worksheet.getCell('C' + rowNumber).value;
            sipGateway_port =
              sipGateway_port != null ? sipGateway_port.toString() : '';
            sipGateway_port = sipGateway_port.replace(/-/g, '');

            const temp_item = {
              sipGateway_name: sipGateway_name,
              sipGateway_address: sipGateway_address,
              sipGateway_port: sipGateway_port,
            };
            console.log('[File Parse] Row number: ', rowNumber, ')', temp_item);
            rows.push(temp_item);
          });

          // Sequentially load data
          let total = rows.length
          let completed = 0, failed = 0, crashed = 0

          for (const row of rows) {
            try {
              let isSuccess = false;
              const {sipGateway_name, sipGateway_address, sipGateway_port} = row;

              if (action === UPLOAD_ACTION_APPEND) {
                isSuccess = await bulk_opnumber_handle_append(
                  sipGateway_name,
                  sipGateway_address,
                  sipGateway_port,
                  customer_id,
                );
              } else if (action === UPLOAD_ACTION_UPDATE) {
                isSuccess = await bulk_opnumber_handle_update(
                  sipGateway_name,
                  sipGateway_address,
                  sipGateway_port,
                  customer_id,
                );
              } else if (action === UPLOAD_ACTION_DELETE) {
                isSuccess = await bulk_opnumber_handle_delete(sipGateway_name);
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

          return cb(null, { 'code': 200, total, completed, failed, crashed });
        } else {
          cb(err, {code: 500, message: 'Error occourred parsing file'});
        }
      }
    });
  };

  Model.remoteMethod('bulk_upload', {
    description: 'Bulk loads receiving numbers from file',
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
    ],
    returns: {
      arg: 'file_object',
      type: 'object',
      root: true,
    },
    http: {verb: 'post'},
  });

  Model.bulk_download = async function (res, where) {
    const whereJson = JSON.parse(where);
    const whereClause = {where: whereJson};

    try {
      let sipGateways = await Model.find(whereClause);
      sipGateways = JSON.parse(JSON.stringify(sipGateways));
      let string_data = 'Name, Company ID, Address, Port\n';
      sipGateways.forEach(function (sipGateway) {
        string_data +=
          sipGateway.name +
          ',' +
          (sipGateway.hasOwnProperty('Customer')
            ? sipGateway.Customer['companyId']
            : '') +
          ',' +
          sipGateway.address +
          ',' +
          sipGateway.port +
          '\n';
      });

      var datetime = new Date();
      res.set('Expires', 'Thu, 01 Jan 1970 00:00:01 GMT');
      res.set(
        'Cache-Control',
        'max-age=0, no-cache, must-revalidate, proxy-revalidate',
      );
      res.set('Last-Modified', datetime + 'GMT');
      res.set('Content-Type', 'application/force-download');
      res.set('Content-Type', 'application/octet-stream');
      res.set('Content-Type', 'application/download');
      res.set('Content-Disposition', 'attachment;filename=Data.csv');
      res.set('Content-Transfer-Encoding', 'binary');
      res.send({status: 'OK', csv_data: string_data});
    } catch (e) {
      res.send({status: 'KO', error: e});
    }
  };

  Model.remoteMethod('bulk_download', {
    description: 'Bulk export receiving numbers to csv file',
    accepts: [
      {arg: 'res', type: 'object', http: {source: 'res'}},
      {arg: 'where', type: 'string', required: true},
    ],
    returns: [
      {type: 'string', root: true},
      {arg: 'Content-Type', type: 'string', http: {target: 'header'}},
    ],
    http: {verb: 'get'},
  });

  /**
   * Set an outbound gateway as default
   * @param {*} gateway_id number
   * @returns true or false
   */
   Model.set_default = async (gateway_id) => {
    return new Promise(async (resolve, reject) => {
      if (!gateway_id) reject(new Error('Gateway Id is needed.'));

      Model.findOne({where: {and: [{id: gateway_id}, {type: 1}]}}, (err, gateway) => {
        if(err || !gateway) reject(false);

        const query1 = `UPDATE sip_gateways SET type=11 WHERE id   = ${gateway_id}`;
        const query2 = `UPDATE sip_gateways SET type=1  WHERE type = 11 AND id != ${gateway_id}`;

        try {
          Model.dataSource.connector.query(query1, (err, results) => {
            if (err) reject(false);
            if (results && results.affectedRows > 0)
              Model.dataSource.connector.query(query2, (err, results) => {
                if (err) reject(false);
                if (results && results.affectedRows > 0) {
                  resolve(true);
                }
              });
          });
        } catch (e) {
          reject(false);
        }
      });
    });
  };

  /**
   * Expose remote method above
   */
  Model.remoteMethod('set_default', {
    description: 'Set the an outbound gateway as default',
    http: {
      path: '/set_default',
      verb: 'post',
    },
    accepts: [
      {arg: 'gateway_id', type: 'number', required: true}
    ],
    returns: [{type: 'boolean', root: true}],
  });
};
