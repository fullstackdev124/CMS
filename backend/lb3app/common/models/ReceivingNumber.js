'use strict';

// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == "dev") config = require("../../server/config.dev.json");

var app = require('../../server/server');
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

async function bulk_opnumber_handle_append(receiving_number, customer_id) {
    const RecvNumber = app.models.ReceivingNumber;

    // find receiving number
    let rnumber = await RecvNumber.findOnePromise({ where: { number: receiving_number } });
    if (rnumber) {
        return { code: 500, message: "Already existing receiving number."};
    }

    try {
        const result = await RecvNumber.createPromise({
            customerId: customer_id,
            number: receiving_number,
        });

        if(result)
            return { "code": 200, "message": "Receiving number successfully created." };

        return { "code": 500, "message": "Unable to create receiving number." };
    } catch (e) {
        console.log('[ee] Bulk append error:', e);
        return { "code": 500, "message": "Append exception occurred." };
    }
}

async function bulk_opnumber_handle_update(receiving_number, customer_id) {
    const RecvNumber = app.models.ReceivingNumber;

    try {
        let recv_number = await RecvNumber.findOrCreatePromise({
            where: { and: [{ 'number': receiving_number }, {customerId: customer_id}] }
        }, { number: receiving_number, customerId: customer_id });

        if (recv_number) {
        } else {
            return { "code": 500, "message": "Unable to create requested receiving number." };
        }

        recv_number.customerId = customer_id;
        const result = await RecvNumber.upsertPromise(recv_number);
        if(result)
            return { "code": 200, "message": "Receiving number successfully updated." };
        return { "code": 500, "message": "Unable to update receiving number." };
    } catch (e) {
        console.log('[ee] Bulk update error:', e);
        return { "code": 500, "message": "Update exception occurred." };
    }
}

async function bulk_opnumber_handle_delete(receiving_number, customer_id) {
    const RecvNumber = app.models.ReceivingNumber;
    try {
        const rnumber = await RecvNumber.findOnePromise({ where: { and: [{ 'number': receiving_number }, {customerId: customer_id}] } });
        if (rnumber) {
        } else {
            return {code: 500, message: "Customer have not receiving number."}
        }

        const result = await RecvNumber.destroyByIdPromise(rnumber.id);
        if (result)
            return { "code": 200, "message": "Receiving number successfully removed." };
        return { "code": 500, "message": "Unable to remove receiving number." };
    } catch (e) {
        console.log('[ee] Bulk update error:', e);
        return { "code": 500, "message": "Delete exception occurred." };
    }
}

module.exports = function (Model) {

    app.on('started', function () {
        Model.nestRemoting('OpNumber');
    });

    Model.bulk_upload = function (encoded_file, file_extension, customer_id, action, countryCode, res, cb) {

        let filename = 'c:/tmp/upload_rnumber_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.' + file_extension;
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
                const { err, worksheet } = await get_worksheet(workbook, filename, file_extension);
                if (worksheet != null) {
                    const rows = [];

                    // Worksheet eachRow is fully asyncronous, I need that row will be sequentially evaluated
                    // to correctly load data without duplicates.
                    worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
                        if (rowNumber === 1) return;

                        let receiving_number = worksheet.getCell('A' + rowNumber).value;
                        receiving_number = receiving_number != null ? receiving_number.toString() : '';
                        receiving_number = receiving_number.replace(/-/g, '');
                        receiving_number = receiving_number.replace(/'/g, '');

                        if(countryCode && countryCode.trim().length > 0) receiving_number = countryCode + receiving_number;

                        const temp_item = {
                            row_number: rowNumber,
                            'receiving_number': receiving_number,
                        };

                        // console.log('[File Parse] Row number: ', rowNumber, ')', temp_item);
                        rows.push(temp_item);
                    });

                    let reports = "Row,Number,Status,Description\n"

                    // Sequentially load data
                    for (const row of rows) {
                        const ise164 = /^\+\d{1,3}\d{3,14}$/;
                        const { row_number, receiving_number } = row;

                        if(ise164.test(receiving_number)) {
                            try {
                                let result = { "code": 500, "message": "Unknown Action" };
                                if (action === UPLOAD_ACTION_APPEND) {
                                    result = await bulk_opnumber_handle_append(receiving_number, customer_id);
                                } else if (action === UPLOAD_ACTION_UPDATE) {
                                    result = await bulk_opnumber_handle_update(receiving_number, customer_id);
                                } else if (action === UPLOAD_ACTION_DELETE) {
                                    result = await bulk_opnumber_handle_delete(receiving_number, customer_id);
                                }

                                if (result.code == 200)
                                    reports += row_number + "," + receiving_number + "," + 'Success' +',' + result.message + "\n"
                                else
                                    reports += row_number + "," + receiving_number + "," + 'Failed' +',' + result.message + "\n"
                            } catch (ex) {
                                // crashed ++;
                                console.log(`Error occurred while processing, row=${row}, error=${ex}`);
                                reports += row_number + "," + receiving_number + "," + 'Failed' +',' + ex + "\n"
                            }
                        } else {
                            reports += row_number + "," + receiving_number + ",Failed,Receiving number is not in a e164 valid format\n";
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
                    // res.send({ status: 'KO', error: new Error("Error occourred Parsing File") });
                    return cb(err, { 'code': 500, 'message': 'Error occourred parsing file' });
                }
            }
        });
    };

    Model.remoteMethod('bulk_upload', {
        description: 'Bulk loads receiving numbers from file',
        accepts: [{
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
        },
            {
                arg: 'countryCode',
                type: 'string',
                required: false,
                description: 'The country code to be prepended to receiving numbers',
                http: {source: 'form'},
            },
            { arg: 'res', type: 'object', 'http': { source: 'res' } },
        ],
        returns: [
            { 'type': 'string', 'root': true },
            { 'arg': 'Content-Type', 'type': 'string', 'http': { 'target': 'header' } }
        ],
        http: { verb: 'post' }
    });

    Model.bulk_download = async function (res, where) {
        let whereJson = JSON.parse(where)
        let whereClause = { 'where': whereJson };

        try {
            let rnumbers = await Model.find(whereClause);
            rnumbers = JSON.parse(JSON.stringify(rnumbers));
            let string_data = 'Receiving Number, Company ID\n';
            rnumbers.forEach(function (rnumber) {
                string_data +=
                    rnumber.number + ',' +
                    (rnumber.hasOwnProperty('Customer') ? rnumber.Customer['companyId'] : '') + '\n';
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
        ],
        returns: [
            { 'type': 'string', 'root': true },
            { 'arg': 'Content-Type', 'type': 'string', 'http': { 'target': 'header' } }
        ],
        http: { verb: 'get' }
    });

    /**
     * get receiving number
     * @param filter
     * @param cb
     */
    Model.getReceivingNumbers = async function (filter) {
        try {
            console.log("[Receiving Number] get list function: ", filter);

            const filterJson = JSON.parse(filter)

            const res = await Model.find(filterJson);
            for (const num of res) {
                // get tracking number list from the number
                let query = `SELECT id, tracking_number FROM op_number WHERE receiving_numberId = ${num.id}`
                await new Promise(resolve => {
                    Model.dataSource.connector.query(query, (err, results) => {

                        if (err) {
                            return
                        }

                        // num = {...num, trackingNumber: results}
                        num.__data.tracking_numbers = results
                        // numberList.push(num)
                        resolve()
                    })
                })

                // get total calls
                query = `SELECT count(t.id) AS total_calls FROM call_log t LEFT JOIN op_number t1 ON t.opnumberId = t1.id WHERE t1.receiving_numberId = ${num.id}`
                await new Promise(resolve => {
                    Model.dataSource.connector.query(query, (err, results) => {

                        if (err) {
                            return
                        }

                        if (results.length > 0) {
                            num.__data.total_calls = results[0].total_calls
                        }
                        resolve()
                    })
                })
            }
            return res;
        } catch (e) {
            return e;
        }
    }

    Model.remoteMethod('getReceivingNumbers', {
        description: 'Get Receiving Number List with Tracking Numbers and Total Calls',
        http: {
            path: '/receiving_numbers',
            verb: 'get',
        },
        accepts: [
            { arg: 'filter', type: 'string', required: false, description: 'filter param to query' },
        ],
        returns: [
            { type: 'object', root: true }
        ],
    });

    /**
     * update receiving number by id on local and hadoop
     * @param data
     * @returns {Promise<boolean>}
     */

    Model.updateById = async function (data) {
        return true;
    };

    Model.remoteMethod('updateById', {
        description: 'Update Receiving Number',
        http: {
            path: '/updateById',
            verb: 'put',
        },
        accepts: [
            { arg: 'id', type: 'number', required: true, description: 'receiving number id' },
            { arg: 'action', type: 'object', required: true, http: { action: 'body' } },
        ],
        returns: [
            { type: 'object', root: true },
        ],
    })

    /**
     * update receiving number that id is param id
     * @param id
     * @param action
     * @param cb
     */
    Model.update = async function (id, action) {
        try {
            console.log("[Receiving Number] update function ");
            const res = await Model.replaceById(id, action);
            console.log(`[Receiving Number] updated ${id}`);

            // call the api to update the hadoop db
            // first, get the data to send
            const query = "SELECT id AS receivingNumber_id, " +
                " number AS receivingNumber_number, " +
                " description AS receivingNumber_description " +
                " FROM ecms.receiving_number " +
                " WHERE id = " + id

            const results = Model.dataSource.connector.query(query);

            return res;
        } catch (e) {
            return e;
        }
    }

    Model.remoteMethod('update', {
        description: 'Update Receiving Number',
        http: {
            path: '/:id/update',
            verb: 'put',
        },
        accepts: [
            { arg: 'id', type: 'number', required: true, description: 'receiving number id' },
            { arg: 'action', type: 'object', required: true, http: { action: 'body' } },
        ],
        returns: [
            { type: 'object', root: true }
        ],
    });


    /**
     * delete receiving number that id is param id
     * @param id
     * @param cb
     */
    Model.deleteReceivingNumber = async function (id) {
        try {
            console.log('[Receiving Number] delete function ');
            const res = await Model.deleteById(id);
            console.log(`[Receiving Number] deleted ${id}`);

            return res;
        } catch (e) {
            return e;
        }
    }

    Model.remoteMethod('deleteReceivingNumber', {
        description: 'Delete Receiving Number',
        http: {
            path: '/:id/delete',
            verb: 'delete',
        },
        accepts: [
            { arg: 'id', type: 'number', required: true, description: 'receiving number id' },
        ],
        returns: [
            { type: 'object', root: true }
        ],
    });
}
