// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == 'dev') config = require('../../server/config.dev.json');

const app = require('../../server/server');

const fs = require('fs');
const set = require('lodash/set');

const SqlConnector = require('loopback-connector').SqlConnector;
const ParameterizedSQL = SqlConnector.ParameterizedSQL;
const request = require('request');
const http = require('http');

const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

function timestamp_to_DateTime(unix_timestamp) {
  const a = new Date(unix_timestamp * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = a.getFullYear();
  const month = months[a.getMonth()];
  const date = a.getDate();
  const hour = a.getHours();
  const min = a.getMinutes();
  const sec = a.getSeconds();

  // Format
  const dateTime = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec;
  return dateTime;
}

function timestamp_to_SQLDateTime(unix_timestamp) {
  const a = new Date(unix_timestamp * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = a.getFullYear();
  const month = months[a.getMonth()];
  const date = a.getDate();
  const hour = a.getHours();
  const min = a.getMinutes();
  const sec = pad(a.getSeconds(), 2);

  // Format
  const dateTime = year + '/' + month + '/' + date + ' ' + hour + ':' + min + ':' + sec;
  return dateTime;
}

function createRandomColor() {
  const hexPart = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += hexPart[Math.floor(Math.random() * 16)];
  }

  return color;
}

function randomizer(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low);
}

async function callLogQualify(cdr_record, phonebookId, customerId, opnumberId, recordId, dryrun) {
  try {

    /*
     * ENABLE This if you want to create a call log destination
     * number as tracking number if doesn't yet exists.
     *
    if (opnumberId == null && !dryrun) {
      const OpNumber = app.models.OpNumber;
      const TrSources = app.models.TrackingSources;

      // Find the first tracking source from this customer.
      let first_tr_source = await TrSources.findOnePromise({
        where: {customerId: customerId},
        limit: 1,
      });

      if (!first_tr_source) {
        // Create default tracking source
        first_tr_source = await TrSources.createOnePromise({
          name: 'CallLog',
          description: 'Call Log Qualify Generated',
          customerId: customerId,
        });
      }

      const trnumber = {
        tracking_sourceId: first_tr_source.id,
        tracking_number: cdr_record.called_user,
        customerId: customerId,
      };

      try {
        const result = await OpNumber.createPromise(trnumber);
        opnumberId = result.id;
      } catch (ex) {
        throw ex;
      }
    }
    */

    let call_status = 'No Answer';
    if (cdr_record.reason === 'OK') call_status = 'Answered';

    if (cdr_record.hasOwnProperty('prosbc_drct')) {
      if (cdr_record.code === 200) call_status = 'Answered';
      else call_status = 'No Answer';

      call_status += '\n(' + cdr_record.reason + ')';
    }

    const startime = cdr_record.call_start_time ? cdr_record.call_start_time : Math.floor(Date.now() / 1000);

    let callerNumber = cdr_record.caller_user;
    if (callerNumber.includes('+1')) callerNumber = callerNumber.substring(2);

    const call_log = {
      callId: cdr_record.call_id,
      callDirection: 'inbound',
      callerNumber: callerNumber,
      trackingNumber: cdr_record.called_user,
      caller_contactId: phonebookId,
      opnumberId: opnumberId,
      customerId: customerId,
      callrecordingId: recordId,
      metrics: timestamp_to_DateTime(startime) + '\n' + call_status,
      flag: 1,
      callTerminated: 1,
      callStatus: cdr_record.code,
      callStatusMessage: cdr_record.reason,
      duration: cdr_record.duration,
      msDuration: cdr_record.ms_duration,
      setuptime: cdr_record.setuptime,
      recording_enable: cdr_record.recording_enable,
    };

    // Push created if exists otherwise will use "NOW()" db function
    if (cdr_record.hasOwnProperty('created')) {
      call_log.created = timestamp_to_SQLDateTime(startime);
    }

    // Logging
    console.log('[Call Log] Builded entry:', JSON.stringify(call_log));

    const CallLog = app.models.CallLog;
    const call_log_found = await CallLog.findOnePromise({
      where: {callId: cdr_record.call_id},
      limit: 1,
    });
    if (call_log_found) {
      const call_log_updated = await CallLog.updateAllPromise({callId: cdr_record.call_id}, call_log);
      console.log('[Call Log] Updated:', call_log_updated);
      return {...call_log_found, ...call_log};
    } else {
      const call_log_created = await CallLog.createPromise(call_log);
      console.log('[Call Log] Created:', JSON.stringify(call_log_created));
      return call_log_created;
    }
  } catch (ex) {
    console.log(`callLogQualify() - error occurred : ${ex}`);
    throw ex;
  }
}

function handle_delayed_cdr(cdr_record, fast) {
  return new Promise(async (resolve, reject) => {

    if (cdr_record.hasOwnProperty('prosbc_drct')) {
      // console.log("CDR got:", cdr_record);

      let code = null;
      let reason = cdr_record.term_cause;

      if (reason.match(/^NORMAL/)) {
        code = 200;
      } else if (reason.match(/^\d+_.*/)) {
        const matches = reason.match(/^(\d+)_(.*)/);
        code = matches[1];
        reason = matches[2];
      } else {
        code = 500;
      }

      const tmp_cdr = {
        prosbc_drct: true,
        reason: reason,
        ms_duration: cdr_record.duration * 1000,
        call_id: cdr_record.session_id.split(' ').join(''),
        caller_user: cdr_record.calling,
        called_user: cdr_record.called,
        code: code,
        setuptime: 0,
        method: 'INVITE',
        duration: cdr_record.duration,
        created: cdr_record.start_time,
        call_start_time: cdr_record.connc_time > 0 ? cdr_record.connc_time : cdr_record.start_time,
        recording_enable: true,
      };

      cdr_record = tmp_cdr;
      // console.log("Converted CDR:", cdr_record);
      // return callback(null, {"message": "CDR record stored"});
    }

    // Recording may not be immediately available
    const Recording = app.models.CallRecording;
    Recording.findOne({where: {name: cdr_record.call_id}}, (err, recording) => {
      let recordId = null;
      if (recording && !err) {
        recordId = recording.id;
      }

      const OpNumber = app.models.OpNumber;
      OpNumber.findOne({where: {tracking_number: cdr_record.called_user}}, (err, opnumber) => {
        let opnumberId = null;
        let customerId = 1;
        if (opnumber && !err) {
          opnumberId = opnumber.id;
          customerId = opnumber.customerId;
          const Customer = app.models.Customer;
          Customer.findOne({where: {id: customerId}}, (e1, customer) => {
            if (customer && !e1) {
              const recording_enable = opnumber.recording_enable === '1' && customer.recording_enable === '1';
              if (!recording_enable) {
                if (recordId) Recording.deleteById(recordId);
                cdr_record.recording_enable = false;
                recordId = null;
              }
            }
          });
        }

        const Phonebook = app.models.Phonebook;

        // Storing caller number
        let number = cdr_record.caller_user;

        // Dipping caller number
        if (!number.startsWith(config.opencnam.num_prefix) && number.length < config.opencnam.num_len) number = config.opencnam.num_prefix + number;

        // Logging
        console.log('[Phonebook] Looking for a record matching:', number);

        // Looking for an already existing Phonebook record
        Phonebook.findOne({where: {contact_number: number}}, (err, phonebook) => {
          let phonebookId = null;
          if ((phonebook && !err) || !config.opencnam.enabled) {
            if (phonebook && !err) {
              phonebookId = phonebook.id;
              // Logging
              console.log('[Phonebook] Entry found id:', phonebook.id, 'name:', phonebook.name);
            } else {
              // Logging
              console.log('[Phonebook] Entry not found and OpenCNAM dipping feature disabled!');
            }

            // Updating Call Log
            callLogQualify(cdr_record, phonebookId, customerId, opnumberId, recordId, fast)
              .then(result => {
                resolve(result);
              })
              .catch(err => {
                reject(err);
              });
          } else {
            // Building CNAM url
            const url =
              config.opencnam.url + '/' + number + '?account_sid=' + config.opencnam.account_sid + '&format=json&auth_token=' + config.opencnam.auth_token + '&no_value=unknown';

            // Logging
            console.log('[Phonebook] Entry not found, quering CNAM:', url);

            // Do Request
            request(url, {json: true}, (err, res, body) => {
              if (!err) {
                // Logging
                console.log('[OpenCNAM] Returned:', JSON.stringify(body));

                // Build Phonebook Contact
                const phonebook_record = {
                  name: body.name,
                  email: 'info@techfusion.it',
                  street: '',
                  city: '',
                  state: '',
                  country: '',
                  postalCode: '',
                  contact_number: number,
                  note: 'OpenCNam Resolved',
                };

                // Create Phonebook Record
                Phonebook.create(phonebook_record, function (err, pbook_result) {
                  if (!err) {
                    phonebookId = pbook_result.id;
                    // Logging
                    console.log('[Phonebook] Created entry:', JSON.stringify(pbook_result));
                  } else {
                    // Logging
                    console.log('[Phonebook] Creation Error:', JSON.stringify(err));
                  }

                  // Updating Call Log
                  callLogQualify(cdr_record, phonebookId, customerId, opnumberId, recordId, fast)
                    .then(result => {
                      resolve(result);
                    })
                    .catch(err => {
                      reject(err);
                    });
                });
              } else {
                // Logging
                console.log('[OpenCNAM] Error:', JSON.stringify(err));

                // Updating Call Log
                callLogQualify(cdr_record, phonebookId, customerId, opnumberId, recordId, fast)
                  .then(result => {
                    resolve(result);
                  })
                  .catch(err => {
                    reject(err);
                  });
              }
            });
          }
        });
      });
    });
  });
}

/**
 * Return first week day of given date
 * @param {Date} d
 */
function getMonday(d) {
  const ld = new Date(d);
  const day = ld.getDay();
  const diff = ld.getDate() - day + (day == 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * TODO -- Is needed to check if this can replace method above
 * @param {*} d
 */
function getAnotherMonday(d) {
  const ld = new Date(d);
  const day = ld.getDay();
  const diff = ld.getDate() - day + (day == 0 ? -6 : 1);
  return new Date(ld.setDate(diff));
}

/**
 * Return number of days in a specific month
 * @param {number} month
 * @param {number} year
 */
const getDaysInMonth = function (month, year) {
  return new Date(year, month, 0).getDate();
};

/**
 * Pad a number with leading zeroes
 * @param {number} number
 * @param {number} digits
 */
function pad(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}


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

// THIS METHOD IS REALLY CPU/MEMORY INTENSIVE and TIME CONSUMING
function jsonSortByKey(object) {
  const sortedObj = {};
  const keys = Object.keys(object);

  keys.sort(function (key1, key2) {
    (key1 = key1.toLowerCase()), (key2 = key2.toLowerCase());
    if (parseInt(key1) < parseInt(key2) || key1 < key2) return -1;
    if (parseInt(key1) > parseInt(key2) || key1 > key2) return 1;
    return 0;
  });

  for (const index in keys) {
    const key = keys[index];
    if (typeof object[key] == 'object' && !(object[key] instanceof Array)) {
      sortedObj[key] = jsonSortByKey(object[key]);
    } else {
      sortedObj[key] = object[key];
    }
  }

  return sortedObj;
}

function buildArray(object) {
  const array_obj = {};
  const keys = Object.keys(object);

  for (const index in keys) {
    const key = keys[index];
    array_obj[key] = object[key];
  }

  return array_obj;
}

module.exports = function (Model) {
  app.on('started', () => {
    Model.nestRemoting('OpNumber');
  });

  // Global storage configuration for file upload
  const multer = require('multer');
  let uploaded_filename = '';
  let uploaded_extension = '';

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dirPath = '/tmp/uploads/';
      if (!fs.existsSync(dirPath)) var dir = fs.mkdirSync(dirPath);
      cb(null, dirPath + '/');
    },
    filename: function (req, file, cb) {
      const extension = file.originalname.substring(file.originalname.lastIndexOf('.')).replace(/\./g, '');
      const file_name = Date.now() + '.' + extension;

      uploaded_filename = file_name;
      uploaded_extension = extension;

      cb(null, file_name);
    },
  });

  //* *** ADDING X-Total-Count header globally for all find based methods */
  const connector = app.dataSources.db.connector;
  const _buildWhere = connector._buildWhere.bind(connector);

  connector._buildWhere = function (model, where) {
    for (const key in where) {
      if (key.includes('.')) {
        Object.assign(where, set({}, key, where[key]));
        delete where[key];
      }
    }

    let whereClause = _buildWhere(model, where);
    const relations = app.models[model].relations;

    for (const key in where) {
      if (relations && relations[key]) {
        const relation = relations[key];
        const inSelect = this.buildSelect(
          relation.modelTo.modelName,
          {
            fields: [relation.keyTo],
            where: {
              and: [app.models[model]._coerce(where[key], {}, app.models[relation.modelTo.modelName].definition)],
            },
          },
          {parameterize: false, order: true},
        );
        whereClause = new ParameterizedSQL({
          sql: whereClause.sql + (whereClause.sql !== '' ? ' AND ' : '') + this.columnEscaped(relation.modelFrom.modelName, relation.keyFrom) + ' IN (' + inSelect.sql + ')',
          params: whereClause.params.concat(inSelect.params),
        });
      }
    }
    return whereClause;
  };

  // Set X-Total-Count for all search requests
  const remotes = app.remotes();

  remotes.after('*.find', function (ctx, next) {
    let filter;
    if (ctx.args && ctx.args.filter) {
      try {
        filter = JSON.parse(ctx.args.filter).where;
      } catch (e) {
        filter = ctx.args.filter.where;
      }
    }

    // TODO -- Cannot set headers after they are sent to the client -- on line 1407
    // -- Should to be fixed, wait for.
    if (!ctx.res._headerSent) {
      this.count(filter, function (err, count) {
        try {
          ctx.res.set('X-Total-Count', count);
        } catch (e) {}
        next();
      });
    } else {
      next();
    }
  });
  //* *** ADDING X-Total-Count header globally for all find based methods *** END */

  Model.raw_cdr_record = function (cdr_record, fast, cb) {
    if(fast) {
      handle_delayed_cdr(cdr_record, fast);
      cb();
    } else {
      // Randomize record insertion to avoid burst
      setTimeout(async () => {
        try {
          await handle_delayed_cdr(cdr_record);
        } catch (e) {
          console.log('[ee] storing record:', e);
        } finally {
          cb();
        }
      }, randomizer(500, 2000));
      // setTimeout(handle_delayed_cdr.bind(null, cdr_record, cb), randomizer(500, 2000));
    }
  };

  Model.remoteMethod('raw_cdr_record', {
    accepts: [
      {arg: 'cdr', type: 'object', required: true},
      {arg: 'fast', type: 'boolean', required: false}
    ],
    http: {verb: 'post'},
    returns: [{type: 'boolean', root: true}],
  });

  Model.export_report = function (sdate, edate, offset, options, cb) {
    //  Retrieve customer id from authentication token
    const user = JSON.parse(JSON.stringify(options.accessToken));
    if (!user) return cb(new Error('Unauthorized!'));
    let customerId = null
    if (user.DashUser.id!=1) // super admin
      customerId = user.DashUser.customerId;

    if(sdate > edate) return cb(null , {error: "Wrong dates!"});

    let timezone = ( offset / 60 >= 0 ? ("+" + (offset / 60)) : (offset / 60) ) + ":" + (offset % 60<10 ? ("0" + (offset % 60)) : offset % 60);
    console.log(`call call_log_export('${sdate}', '${edate}')`, timezone)
    Model.dataSource.connector.query(`call call_log_export('${sdate} 00:00:00', '${edate} 23:59:59', '${timezone}', ${customerId})`, function(err, callogs) {
      if(err) return cb(err, {});

      return cb(null, { result: callogs[0] });
    });
  };

  Model.remoteMethod('export_report', {
    accepts: [
      {arg: 'start_date', type: 'string', required: false},
      {arg: 'end_date', type: 'string', required: false},
      {arg: 'offset', type: 'number', required: false},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    http: {verb: 'post'},
    returns: [{type: 'object', root: true}],
  });


  Model.activity_report = function (sdate, edate, offset, options, cb) {
    //  Retrieve customer id from authentication token
    const user = JSON.parse(JSON.stringify(options.accessToken));
    if (!user) return cb(new Error('Unauthorized!'));
    let customerId = null
    if (user.DashUser.id!=1) // super admin
      customerId = user.DashUser.customerId;

    if(sdate > edate) return cb(null , {error: "Wrong dates!"});

    let timezone = ( offset / 60 >= 0 ? ("+" + (offset / 60)) : (offset / 60) ) + ":" + (offset % 60<10 ? ("0" + (offset % 60)) : offset % 60);
    Model.dataSource.connector.query(`call call_log_report('${sdate} 00:00:00', '${edate} 23:59:59', '${timezone}', ${customerId})`, function(err, callogs) {
      if(err) return cb(err, {});

      return cb(null, { result: callogs[0] });
    });
  };

  Model.remoteMethod('activity_report', {
    accepts: [
      {arg: 'start_date', type: 'string', required: false},
      {arg: 'end_date', type: 'string', required: false},
      {arg: 'offset', type: 'number', required: false},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    http: {verb: 'post'},
    returns: [{type: 'object', root: true}],
  });

  Model.overview_report = function (sdate, edate, offset, options, cb) {
    //  Retrieve customer id from authentication token
    const user = JSON.parse(JSON.stringify(options.accessToken));
    if (!user) return cb(new Error('Unauthorized!'));
    let customerId = null
    if (user.DashUser.id!=1) // super admin
      customerId = user.DashUser.customerId;

    if(sdate > edate) return cb(null , {error: "Wrong dates!"});

    let timezone = ( offset / 60 >= 0 ? ("+" + (offset / 60)) : (offset / 60) ) + ":" + (offset % 60<10 ? ("0" + (offset % 60)) : offset % 60);
    Model.dataSource.connector.query(`call call_log_report('${sdate} 00:00:00', '${edate} 23:59:59', '${timezone}', ${customerId})`, function(err, callogs) {
      if(err) return cb(err, {});

      return cb(null, { result: callogs[0] });
    });
  };

  Model.remoteMethod('overview_report', {
    accepts: [
      {arg: 'start_date', type: 'string', required: false},
      {arg: 'end_date', type: 'string', required: false},
      {arg: 'offset', type: 'number', required: false},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    http: {verb: 'post'},
    returns: [{type: 'object', root: true}],
  });

  Model.updateCustomer = async function (updateInfo) {
    const update = JSON.parse(updateInfo);

    let query = '';
    const newCustomerId = update.newCustomerId;
    const curCustomerId = update.curCustomerId ? update.curCustomerId : null;
    const opnumberId = update.opNumberId ? update.opNumberId : null;

    if (curCustomerId) query = `UPDATE call_log SET customerId = ${newCustomerId} WHERE customerId = ${curCustomerId}`;
    else if (opnumberId) query = `UPDATE call_log SET customerId = ${newCustomerId} WHERE opnumberId = ${opnumberId}`;

    if (query === '') {
      return null;
    } else {
      try {
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

  Model.global_recv_unique_calc = async function () {
    const CallLog = app.models.CallLog;
    try {
      const logs = await CallLog.find({});
      // Purge Previous Table Data
      let query = 'DELETE FROM `tsources_phonebook_rel` WHERE 1';

      await Model.dataSource.connector.query(query);
      query = 'UPDATE `tracking_sources` SET `global_unique`=0 WHERE 1';
      await Model.dataSource.connector.query(query);
      // Iterate through logs
      for(var i = 0; i < callogs.length; i++) {
        var log = callogs[i];
        log = JSON.parse(JSON.stringify(log));
        if (!log.OpNumber) return;
        // Get only logs with a valid TrackingSources object
        if (log.OpNumber.hasOwnProperty('TrackingSources')) {
          if (log.hasOwnProperty('Phonebook')) {
            const tspb = app.models.TsourcesPhonebookRel;
            const tspb_create = {
              tsourceid: log.OpNumber.TrackingSources.id,
              pbookid: log.Phonebook.id,
              counter: 1,
            };
            tspb.find(
              {
                where: {
                  and: [{tsourceid: tspb_create.tsourceid}, {pbookid: tspb_create.pbookid}],
                },
              },
              function (err, tspb_rel) {
                if (err || !tspb_rel) {
                  console.table(tspb_rel);
                  tspb_create.counter = tspb_rel.counter + 1;
                }
                console.table(tspb_create);
                tspb.create(tspb_create, null);
              },
            );
          } else {
            console.log('TSource:', log.OpNumber.TrackingSources.name, 'with no contact number');
          }
        } else {
          console.log('OP Number without tracking source');
        }
      }
      return {message: 'Operation done.'};
    } catch (err) {
      return err;
    }
  };

  Model.remoteMethod('global_recv_unique_calc', {
    accepts: [],
    http: {verb: 'get'},
    returns: [{type: 'object', root: true}],
  });

  // Model.bulk_radius_upload = function(encoded_file, file_extension, cb) {
  Model.bulk_radius_upload = function (req, res, cb) {
    // Dry run -- set this to true to avoid data creation
    const dryrun = null;

    // Get file
    const upload = multer({storage: storage}).array('file', 12);
    upload(req, res, async function (err1) {
      if (err1) {
        cb(err1, {code: 500, message: 'Error uploading file'});
      }

      // Build absolute filepath
      const filename = '/tmp/uploads/' + uploaded_filename;

      const Excel = require('exceljs');
      const workbook = new Excel.Workbook();

      // retrieving worksheet based on filetype
      const {err, worksheet} = await get_worksheet(workbook, filename, uploaded_extension);
      if (worksheet != null) {
        // assuming column 1 is storing OpNumber and column 2 ReceivingNumber
        worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
          let acctuniqueid = worksheet.getCell('C' + rowNumber).value.toString();
          let callingstationid = worksheet.getCell('D' + rowNumber).value.toString();
          let calledstationid = worksheet.getCell('E' + rowNumber).value.toString();
          const trackingsource = worksheet.getCell('F' + rowNumber).value.toString();
          let receivingnumber = worksheet.getCell('G' + rowNumber).value.toString();
          let setuptime = worksheet.getCell('H' + rowNumber).value.toString();
          let connectime = worksheet.getCell('I' + rowNumber).value.toString();
          let disconnectime = worksheet.getCell('J' + rowNumber).value.toString();
          let callstatus = worksheet.getCell('K' + rowNumber).value.toString();
          let duration = worksheet.getCell('AK' + rowNumber).value.toString();

          acctuniqueid = acctuniqueid.replace(/-\(\)\s*/g, '');
          callingstationid = callingstationid.replace(/-\(\)\s*/g, '');
          calledstationid = calledstationid.replace(/-\(\)\s*/g, '');
          receivingnumber = receivingnumber.replace(/-\(\)\s*/g, '');
          setuptime = Date.parse(setuptime.replace(/-\(\)\s*/g, ''));
          connectime = Date.parse(connectime.replace(/-\(\)\s*/g, ''));
          disconnectime = Date.parse(disconnectime.replace(/-\(\)\s*/g, ''));
          callstatus = callstatus.replace(/-\(\)\s*/g, '');
          duration = parseInt(duration.replace(/-\(\)\s*/g, ''));

          let callcode = '200';
          let callmesg = 'OK';
          if (callstatus != 'answer') {
            callstatus = 'No Answer';
            callcode = '487';
            callmesg = 'CANCEL';
          } else {
            callstatus = 'Answered';
          }

          const cdr_record = {
            id: acctuniqueid,
            call_id: acctuniqueid,
            call_direction: 'inbound',
            caller_user: callingstationid,
            called_user: calledstationid,
            call_start_time: setuptime / 1000,
            code: callcode,
            reason: callmesg,
            duration: duration,
            ms_duration: duration * 1000,
            setuptime: 0,
            created: 1,
          };

          const OpNumber = app.models.OpNumber;
          OpNumber.findOne({where: {tracking_number: calledstationid}}, (err, opnumber) => {
            let opnumberId = null;
            let customerId = 1;
            if (opnumber && !err) {
              opnumberId = opnumber.id;
              customerId = opnumber.custom;
            }

            const Phonebook = app.models.Phonebook;

            // Storing caller number
            let number = callingstationid;

            // Dipping caller number
            if (!number.startsWith(config.opencnam.num_prefix) && number.length < config.opencnam.num_len) number = config.opencnam.num_prefix + number;

            // Logging
            console.log('[Phonebook] Looking for a record matching:', number);

            // Looking for an already existing Phonebook record
            Phonebook.findOne({where: {contact_number: number}}, (err, phonebook) => {
              let phonebookId = null;
              if (phonebook && !err) {
                phonebookId = phonebook.id;

                // Logging
                console.log('[Phonebook] Entry found id:', phonebook.id, 'name:', phonebook.name);

                // Debug
                console.log('[Radius ACCT] Handling record:', cdr_record);

                // Updating Call Log
                callLogQualify(cdr_record, phonebookId, customerId, opnumberId, null, dryrun);
              } else {
                // Building CNAM url
                const url =
                  config.opencnam.url +
                  '/' +
                  number +
                  '?account_sid=' +
                  config.opencnam.account_sid +
                  '&format=json&auth_token=' +
                  config.opencnam.auth_token +
                  '&no_value=unknown';

                // Logging
                console.log('[Phonebook] Entry not found, quering CNAM:', url);

                // Do Request
                request(url, {json: true}, (err, res, body) => {
                  if (!err) {
                    // Logging
                    console.log('[OpenCNAM] Returned:', body);

                    // Build Phonebook Contact
                    const phonebook_record = {
                      name: body.name,
                      email: 'info@techfusion.it',
                      street: '',
                      city: '',
                      state: '',
                      country: '',
                      postalCode: '',
                      contact_number: number,
                      note: 'OpenCNam Resolved',
                    };

                    // Create Phonebook Record
                    Phonebook.create(phonebook_record, function (err, pbook_result) {
                      if (!err) {
                        phonebookId = pbook_result.id;
                        // Logging
                        console.log('[Phonebook] Created entry:', pbook_result);
                      } else {
                        // Logging
                        console.log('[Phonebook] Creation Error:', err);
                      }

                      // Debug
                      console.log('[Radius ACCT] Handling record:', cdr_record);

                      // Updating Call Log
                      callLogQualify(cdr_record, phonebookId, customerId, opnumberId, null, dryrun);
                    });
                  } else {
                    // Logging
                    console.log('[OpenCNAM] Error:', err);

                    // Debug
                    console.log('[Radius ACCT] Handling record:', cdr_record);

                    // Updating Call Log
                    callLogQualify(cdr_record, phonebookId, customerId, opnumberId, null, dryrun);
                  }
                });
              }
            });
          });
        });
        cb(err, {code: 200, message: 'File correctly uploaded'});
      } else {
        cb(err, {code: 500, message: 'Error occourred parsing file'});
      }
    });
  };

  Model.remoteMethod('bulk_radius_upload', {
    description: 'Bulk loads call logs from radius exported file',
    accepts: [
      {
        arg: 'req',
        type: 'object',
        http: {
          source: 'req',
        },
      },
      {
        arg: 'res',
        type: 'object',
        http: {
          source: 'res',
        },
      },
    ],
    returns: {
      arg: 'data',
      type: 'object',
      root: true,
    },
    http: {verb: 'post'},
  });

  Model.count_logs = function (offset, weekend, options, cb) {
    const user = JSON.parse(JSON.stringify(options.accessToken));
    if (!user) return cb(new Error('Unauthorized!'));
    let customerId = null;
    if (user.DashUser.id!=1) // super admin
      customerId = user.DashUser.customerId;

    let timezone = ( offset / 60 >= 0 ? ("+" + (offset / 60)) : (offset / 60) ) + ":" + (offset % 60<10 ? ("0" + (offset % 60)) : offset % 60);

    console.log(`call dashboard_count(${customerId}, '${timezone}', ${weekend})`)
    Model.dataSource.connector.query(`call dashboard_count(${customerId}, '${timezone}', ${weekend})`, function(err, callogs) {
      if(err) return cb(err, {});

      return cb(null, callogs);
    });
  };

  Model.remoteMethod('count_logs', {
    accepts: [
      {arg: 'offset', type: 'number', required: true},
      {arg: 'weekend', type: 'number', required: true},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    http: {verb: 'get'},
    returns: [{type: 'object', root: true}],
  });

  Model.getCustomersByTotalCalls = function(startDate, endDate) {
    return new Promise(resolve => {
      let sql = " select c.firstName, c.lastName, c.companyName, c.companyID, `log`.calls " +
        " from (select a.customerId, count(*) as calls from call_log a " +
        " where a.duration is not null and a.duration>0 " +
        " and a.created>='" + startDate + "' and a.created<='" + endDate + "' " +
        " group by a.customerId " +
        " order by calls desc limit 10 ) `log`, customer c " +
        " where c.id=`log`.customerId "
      Model.dataSource.connector.query(sql, function(err, customers){
        // console.log(err)
        if(err)
          resolve([])
        resolve(customers)
      })
    })
  }

  Model.getCustomersByAvgDuration = function(startDate, endDate) {
    return new Promise(resolve => {
      let sql = " select c.firstName, c.lastName, c.companyName, c.companyID, `log`.duration " +
        " from ( select a.customerId,  sum(a.duration)/count(*) as duration from call_log a " +
        " where a.duration is not null and a.duration>0 " +
        " and a.created>='" + startDate + "' and a.created<='" + endDate + "' " +
        " group by a.customerId " +
        " order by duration desc limit 10 ) `log`, customer c " +
        " where c.id=`log`.customerId "
      Model.dataSource.connector.query(sql, function(err, customers){
        console.log(err)
        if(err)
          resolve([])
        resolve(customers)
      })
    })
  }

  Model.getTrackingSourcesByTotalCalls = function(startDate, endDate) {
    return new Promise(resolve => {
      let sql = " select ts.name, count(*) as calls from call_log a " +
        " LEFT JOIN `op_number` AS `op` ON `a`.opnumberId=`op`.id " +
        " LEFT JOIN `tracking_sources` AS `ts` ON `op`.tracking_sourceId=`ts`.id " +
        " where a.duration is not null and a.duration>0 " +
        " and a.created>='" + startDate + "' and a.created<='" + endDate + "' " +
        " group by ts.id " +
        " order by calls desc limit 5"
      Model.dataSource.connector.query(sql, function(err, ts){
        // console.log(err)
        if(err)
          resolve([])
        resolve(ts)
      })
    })
  }

  Model.getTrackingSourcesByAvgDuration = function(startDate, endDate) {
    return new Promise(resolve => {
      let sql = " select ts.name, sum(a.duration)/count(*) as duration from call_log a " +
        " LEFT JOIN `op_number` AS `op` ON `a`.opnumberId=`op`.id " +
        " LEFT JOIN `tracking_sources` AS `ts` ON `op`.tracking_sourceId=`ts`.id " +
        " where a.duration is not null and a.duration>0 " +
        " and a.created>='" + startDate + "' and a.created<='" + endDate + "' " +
        " group by ts.id " +
        " order by duration desc limit 5"
      Model.dataSource.connector.query(sql, function(err, ts){
        // console.log(err)
        if(err)
          resolve([])
        resolve(ts)
      })
    })
  }

  Model.statistics = async function (startDate, endDate, options, cb) {
    const user = JSON.parse(JSON.stringify(options.accessToken));
    if (!user) return cb(new Error('Unauthorized!'));
    let customerId = null;
    if (user.DashUser.id!=1) // super admin
      customerId = user.DashUser.customerId;

    let result = { customersByTotalCall: [], customersByAvgDuration: [], trackingSourcesByTotalCall: [], trackingSourcesByAvgDuration: [] }
    let sql = ""

    if (customerId==null) {
      result.customersByTotalCall = await Model.getCustomersByTotalCalls(startDate, endDate)
      result.customersByAvgDuration = await Model.getCustomersByAvgDuration(startDate, endDate)
      result.trackingSourcesByTotalCall = await Model.getTrackingSourcesByTotalCalls(startDate, endDate)
      result.trackingSourcesByAvgDuration = await Model.getTrackingSourcesByAvgDuration(startDate, endDate)
    }

    return result;
  };

  Model.remoteMethod('statistics', {
    accepts: [
      {arg: 'startDate', type: 'string', required: true},
      {arg: 'endDate', type: 'string', required: true},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    http: {verb: 'get'},
    returns: [{type: 'object', root: true}],
  });
};
