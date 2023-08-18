// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == 'dev') config = require('../../server/config.dev.json');

const fs = require('fs');
const app = require('../../server/server');

// TODO -- This is a test for now
const provider = require('../providers/TelnyxNP');

// TODO -- Temporary provider config in order to introduce new interface classes
const temprovider = config.number_providers.call48;

// Import correct module based on provider protocol
if (temprovider.protocol == 'https') var http = require('follow-redirects').https;
else var http = require('follow-redirects').http;

/**
 * Request Authentication to Number API Provider
 * @returns object containining bearer token
 */
const call48auth = async function () {
  return new Promise(async (resolve, reject) => {
    try {
      var options = {
        method: 'POST',
        hostname: temprovider.host,
        port: temprovider.port,
        path: temprovider.path + '/login',
        headers: {
          'Content-Type': 'application/json',
        },
        maxRedirects: 20,
      };

      var req = http.request(options, function (res) {
        var chunks = [];

        res.on('data', function (chunk) {
          chunks.push(chunk);
        });

        res.on('end', function (chunk) {
          var body = Buffer.concat(chunks);
          if (body != null && body.toString().length > 0) {
            try {
              const json_body = JSON.parse(body.toString());
              if (json_body.code != 200) {
                º;
                let err = new Error();
                err.statusCode = json_body.code;
                err.message = json_body.error;
                reject(err);
              }
              resolve(json_body);
            } catch (err) {
              reject(err);
            }
          }
        });

        res.on('error', function (error) {
          reject(error);
        });
      });

      var postData = JSON.stringify({
        user_name: temprovider.username,
        password: temprovider.password,
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Buy a number from Call48 Number Provider
 * @param {*} number to buy
 * @returns Promise
 */
const call48buy = async function (number) {
  return new Promise(async (resolve, reject) => {
    call48auth()
      .then(auth_result => {
        try {
          const token = auth_result.data.token;

          // Revert to default value
          if (!number.type || number.type.trim().length <= 0) {
            let err = new Error();
            err.statusCode = 500;
            err.message = 'Type is a needed value!';
            reject(err);
          }

          var options = {
            method: 'post',
            hostname: temprovider.host,
            port: temprovider.port,
            path: temprovider.path + '/purchase',
            headers: {
              Authorization: token,
              'Content-Type': 'application/json',
            },
          };

          var req = http.request(options, function (res) {
            var chunks = [];

            res.on('data', function (chunk) {
              chunks.push(chunk);
            });

            res.on('end', function (chunk) {
              var body = Buffer.concat(chunks);
              if (body != null && body.toString().length > 0) {
                try {
                  const json_body = JSON.parse(body.toString());
                  if (json_body.code != 200) {
                    let err = new Error();
                    err.statusCode = json_body.code;
                    err.message = json_body.error;
                    reject(err);
                  }

                  resolve(json_body.data);
                } catch (err) {
                  reject(err);
                }
              }
            });

            res.on('error', function (err) {
              reject(err);
            });
          });

          // Derive XXXX
          number.xxxx = number.number.substring(number.number.length - 4);

          var postData = JSON.stringify({
            type: number.type,
            numbers: [number],
          });

          req.write(postData);
          req.end();
        } catch (err) {
          reject(err);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
};

/**
 * Release a number from Call48 Number Provider
 * @param {*} number to buy
 * @returns Promise
 */
const call48delete = async function (number) {
  return new Promise(async (resolve, reject) => {
    call48auth()
      .then(auth_result => {
        try {
          const token = auth_result.data.token;

          // Revert to default value
          if (!number.prov_id || number.prov_id <= 0) {
            let err = new Error({
              statusCode: 500,
              message: 'Provider id is a needed value!',
            });
            resolve(err);
          }

          var options = {
            method: 'put',
            hostname: temprovider.host,
            port: temprovider.port,
            path: '/api/did/status/update',
            headers: {
              Authorization: token,
              'Content-Type': 'application/json',
            },
          };

          var req = http.request(options, function (res) {
            var chunks = [];

            res.on('data', function (chunk) {
              chunks.push(chunk);
            });

            res.on('end', function (chunk) {
              var body = Buffer.concat(chunks);
              if (body != null && body.toString().length > 0) {
                try {
                  const json_body = JSON.parse(body.toString());
                  if (json_body.code != 200) {
                    let err = new Error({
                      statusCode: json_body.code,
                      message: json_body.error,
                    });
                    resolve(err);
                  }

                  resolve(json_body.data);
                } catch (e) {
                  resolve(e);
                }
              }
            });

            res.on('error', function (err) {
              resolve(err);
            });
          });

          // Real payload for removing numbers for Call48 provider
          // API documentation is fake (https://apicontrol.call48.com/apidocs#did-did-delete)
          var postData = JSON.stringify({
            did_ids: [number.prov_id],
            did_status_id: 8,
            did_status: 'Removed',
          });

          req.write(postData);
          req.end();
        } catch (err) {
          resolve(err);
        }
      })
      .catch(err => {
        resolve(err);
      });
  });
};

/**
 * Release a toll free number from local database
 * @param {*} number
 * @returns Promise
 */
const tolldelete = async function (number) {
  return new Promise(async (resolve, reject) => {
    try {
      const np = app.models.NumberProvider;
      const filter = {where: {and: [{number: number.number}, {reserved: 1}]}};
      np.findOne(filter, (err, found_number) => {
        if (!err && found_number) {
          found_number.reserved = false;
          found_number.save(null, (err, saved_number) => {
            if (!err && saved_number) resolve(saved_number);
            if (!err) {
              err = new Error();
              err.statusCode = 500;
              err.message = 'Error releasing number, if the problem persists contact administrator!';
            }

            resolve(err);
          });
        } else {
          let err = new Error();
          err.statusCode = 500;
          err.message = 'Error releasing number, if the problem persists contact administrator!';
          resolve(err);
        }
      });
    } catch (err) {
      resolve(err);
    }
  });
};

/**
 * Locally check if number is already reserved
 * @param {*} number
 * @returns
 */
function isNumberAlreadyReserved(number) {
  const np = app.models.NumberProvider;
  const filter = {
    where: {and: [{number: number}, {reserved: 1}]},
  };
  np.findOne(filter, (err, found_number) => {
    if (!err && found_number) {
      return true;
    } else {
      return false;
    }
  });
}

/**
 * Normilize returned Call48 API lookup call
 * @param {*} data
 * @returns Array of NumberProvider objects
 */
const normalizeCall48data = async function (data) {
  if (data.hasOwnProperty('result')) {
    let normalized_data = [];
    data.result.forEach(c48num => {
      let fee;
      let name = null;
      let recur = 'monthly';

      // Number already reserved
      if (isNumberAlreadyReserved(c48num.did_number)) return;

      /**
       * Check for variable data
       */
      if (c48num.hasOwnProperty('daily')) {
        fee = c48num.daily;
        recur = 'daily';
      }

      if (c48num.hasOwnProperty('weekly')) {
        fee = c48num.weekly;
        recur = 'weekly';
      }

      if (c48num.hasOwnProperty('monthly')) {
        fee = c48num.monthly;
        recur = 'monthly';
      }

      if (c48num.hasOwnProperty('yearly')) {
        fee = c48num.yearly;
        recur = 'yearly';
      }

      if (c48num.hasOwnProperty('name')) name = c48num.name;

      /**
       * Create a unique number
       */
      let number = {
        prov_id: c48num.did_id,
        name: name,
        number: c48num.did_number,
        type: c48num.type,
        recur: recur,
        npa: c48num.npa,
        nxx: c48num.nxx,
        ratecenter: c48num.ratecenter,
        state: c48num.state,
        fee: fee,
        setup_fee: c48num.setup,
        raw: c48num,
      };

      // Push it inside normalized data array
      normalized_data.push(number);
    });

    // Return json object
    return JSON.parse(JSON.stringify(normalized_data));
  } else {
    let err = new Error();
    err.statusCode = 500;
    err.message = 'Unable to parse provider returned result set!';
    throw err;
  }
};

/**
 * Read Excel/CSV file
 */
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

module.exports = function (Model) {
  app.on('started', function () {});

  Model.suffix = async (type, cb) => {
    return new Promise(async (resolve, reject) => {
      // Mainly used for toll free numbers
      if (!type || type.length <= 0) type = 'toll';

      const query = "SELECT LEFT(`number` , 3) as `suffix` FROM `number_provider` WHERE `type`='" + type + "' GROUP BY suffix ORDER BY suffix";

      try {
        Model.dataSource.connector.query(query, (err, results) => {
          if (err) reject(err);
          if (results && results.length > 0) {
            resolve(JSON.parse(JSON.stringify(results)));
          } else {
            resolve({statusCode: 404, message: 'Nothing found!'});
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  };

  Model.remoteMethod('suffix', {
    description: 'Retrieve Provider Numbers by Suffix',
    http: {
      path: '/suffix',
      verb: 'get',
    },
    accepts: [{arg: 'type', type: 'string', required: false}],
    returns: [{type: 'object', root: true}],
  });

  Model.lookup = async (type, number, state, ratecenter, npa, nxx, limit, cb) => {
    return new Promise(async (resolve, reject) => {
      // TODO -- International not yet implemented
      if (type == 'intl') {
        let err = new Error();
        err.statusCode = 422;
        err.message = 'Not yet implemented!';
        reject(err);
        // Toll Free Just Query for Local DB
      } else if (type == 'toll') {
        if (!limit) limit = 10;
        const np = app.models.NumberProvider;
        const filter = {
          limit: limit,
          where: {and: [{number: {like: number}}, {reserved: 0}]},
        };
        np.find(filter, (err, numbers) => {
          if (!err && numbers) {
            resolve(numbers);
          } else {
            if (!err) {
              err = new Error();
              err.statusCode = 404;
              err.message = 'Lookup returned no results.';
            }

            reject(err);
          }
        });
        // Local DID Query Call48 API Service Provider
      } else {
        // Calls the new provider Interface
        const numbers = await provider.lookup(type, number, state, npa, nxx, ratecenter, limit)
        if (numbers.code!=null && numbers.code==500)
          reject(numbers.error)
        else
          resolve(numbers)
      }
    });
  };

  Model.remoteMethod('lookup', {
    description: 'Search for a available numbers querying remote provider',
    http: {
      path: '/num_prov_lookup',
      verb: 'get',
    },
    accepts: [
      {arg: 'type', type: 'string', required: true},
      {arg: 'number', type: 'string'},
      {arg: 'state', type: 'string'},
      {arg: 'ratecenter', type: 'string'},
      {arg: 'npa', type: 'string'},
      {arg: 'nxx', type: 'string'},
      {arg: 'limit', type: 'number'},
    ],
    returns: [{type: 'object', root: true}],
  });

  Model.countries = async (state, cb) => {
    return new Promise(async (resolve, reject) => {
      call48auth()
        .then(auth_result => {
          try {
            const token = auth_result.data.token;

            // Build search string
            let search = '/countries';

            var options = {
              method: 'get',
              hostname: temprovider.host,
              port: temprovider.port,
              path: temprovider.path + search,
              headers: {
                Authorization: token,
                'Content-Type': 'application/json',
              },
            };

            var req = http.request(options, function (res) {
              var chunks = [];

              res.on('data', function (chunk) {
                chunks.push(chunk);
              });

              res.on('end', function (chunk) {
                var body = Buffer.concat(chunks);
                if (body != null && body.toString().length > 0) {
                  const json_body = JSON.parse(body.toString());
                  if (json_body.code != 200) {
                    let err = new Error();
                    err.statusCode = json_body.code;
                    err.message = json_body.error;
                    return cb(err, {message: 'failed', data: err.message});
                  }
                  try {
                    resolve(json_body.data);
                  } catch (err) {
                    reject(err);
                  }
                }
              });

              res.on('error', function (err) {
                reject(err);
              });
            });

            req.end();
          } catch (err) {
            reject(err);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  Model.remoteMethod('countries', {
    description: 'Retrieve countries list from ',
    http: {
      path: '/countries',
      verb: 'get',
    },
    accepts: [],
    returns: [{type: 'object', root: true}],
  });

  Model.ratecenter = async (state, cb) => {
    return new Promise(async (resolve, reject) => {
      const query = "SELECT DISTINCT ratecenter as rate_center FROM lerg WHERE state='" +
          String(state).toUpperCase() + "' AND ratecenter <> '' ORDER BY ratecenter ASC";
      Model.dataSource.connector.query(query, (err, found_lergs) => {
        if (err) return cb(err, {message: 'failed', data: 'Unable to retrieve rate centers.'});
        resolve(found_lergs);
      });
    });
  };

  Model.remoteMethod('ratecenter', {
    description: 'Retrieve rate centers by state',
    http: {
      path: '/ratecenter',
      verb: 'get',
    },
    accepts: [{arg: 'state', type: 'string', required: true}],
    returns: [{type: 'object', root: true}],
  });

  Model.reserve = async (numbers, options, cb) => {
    return new Promise(async (resolve, reject) => {
      const token = JSON.parse(JSON.stringify(options.accessToken));
      if (!token) reject(new Error('Invalid user or customer.'));

      // Parse input
      numbers = JSON.parse(numbers);
      const customer = token.DashUser.Customer;
      const settings = JSON.parse(customer.settings);

      // Set global status code and message
      var status_code = 200;
      let status_message = [];

      // Double loop for same think I don't really like it
      // but I've to know amount before start sequentially
      // purchasing number from different providers
      var number_cost = 0;
      for (let i = 0; i < numbers.length; i += 1) {
        let number = numbers[i];
        if (number.type == 'toll') number_cost += parseFloat(settings.tollfree) + parseFloat(settings.tollfree_fee);
        else if (number.type == 'local') number_cost += parseFloat(settings.localdid) + parseFloat(settings.localdid_fee);
      }

      if (number_cost > parseFloat(customer.balance)) {
        reject(new Error({statusCode: 500, message: 'Insufficient balance'}));
      }

      for (let i = 0; i < numbers.length; i += 1) {
        let number = numbers[i];

        // Number is already reserved ... notify and go ahead
        if (number.reserved) {
          status_code = 207;
          let err = new Error();
          err.statusCode = 400;
          err.message = 'Number ' + number.number + ' already reserved';
          status_message.push({statusCode: 500, message: err});
          continue;
        }

        // Check if should to be reserved from some kind of provider
        var buy_result = null;
        switch (number.type) {
          case 'intl':
          case 'local':
            // buy_result = await call48buy(number);
            buy_result = await provider.reserve(number.number)
            break;
          case 'toll':
            // Nothing to buy ... is internal
            break;
        }

        /** Error returned by api */
        if ((number.type != "toll") && (buy_result.code != null && buy_result.code == 500)) {
          status_code = 207;
          status_message.push(buy_result.error);
          continue;
        }

        // Create Amount for this number
        let amount = 0;
        if (number.type == 'toll') amount += parseFloat(settings.tollfree) + parseFloat(settings.tollfree_fee);
        else if (number.type == 'local') amount += parseFloat(settings.localdid) + parseFloat(settings.localdid_fee);

        // Charge user on local balance
        const pm = app.models.PaymentMethod;
        const created_charge = await pm.create_charge(amount, customer.currency, true, customer, null, "Charging for number " + number.number + " (" + number.type + ") reservation.", 5, false)
          .catch(e => { reject(e); return; });
        if (!created_charge) {
          let err = new Error();
          err.statusCode = 500;
          err.message = 'Unable to charge customer for ' + amount + ' ' + customer.currency + ', notify administrator if the problem persists.';
          reject(err);
          return;
        }

        // Set number as reserved
        number.reserved = 1;

        // Create an autogenerated name
        number.name = number.type + ' ' + number.number;

        // Sanitize raw data if any
        number.raw = !number.raw ? {} : JSON.stringify(number.raw);

        if (number.prov_id==-1)
          number.prov_id = null
        if (number.type=="local") {
          if (number.number.length==12)
            number.number = number.number.substring(2)
          else if (number.number.length==1)
            number.number = number.number.substring(1)
        }

        // Creating internal number and associating to an Op Number
        const num_prov = app.models.NumberProvider;
        num_prov.findOrCreate({where: {and: [{number: number.number}, {type: number.type}]}}, number, (err, result_numprov, created) => {
          if (err || !result_numprov) {
            status_code = 207;
            status_message.push({statusCode: 500, message: err});
          }
          else {
            const dfl_ts = app.models.TrackingSources;
            const filter = {where: {and: [{name: {like: 'OTHERS'}}, {customerId: customer.id}]}};
            dfl_ts.findOne(filter, async (err, found_trsource) => {
              if (!err) {
                // Create a default tracking source if it not found
                if (!found_trsource) {
                  // Create Default Tracking Source
                  const tr_source = {
                    name: 'OTHERS',
                    type: 'offsite',
                    position: 0,
                    customerId: customer.id,
                    description: 'Default tracking source for customer ' + customer.companyName,
                  };

                  found_trsource = await dfl_ts.create(tr_source);
                }

                // Create tracking number
                const tracking_number = {
                  active: 1,
                  tracking_sourceId: found_trsource.id,
                  customerId: customer.id,
                  tracking_number: number.number,
                  number_providerId: result_numprov.id,
                };

                // If not created just update number provider as reserved
                if (!created) {
                  result_numprov.reserved = 1;
                  num_prov.upsert(result_numprov);
                }

                // Create or update an existing tracking number with number provider
                const opn = app.models.OpNumber;
                opn.upsertWithWhere({tracking_number: number.number}, tracking_number, (err, updated_opnum) => {
                  if (!err && updated_opnum) {
                    // OK
                  } else {
                    status_code = 202;
                    if (!err) {
                      let err = new Error();
                      err.statusCode = 500;
                      err.message = 'Unable to update provider tracking number: ' + number.number;
                    }
                    status_message.push({
                      number: number.number,
                      message: err,
                    });
                  }
                });
              }
              else {
                if (!err) {
                  err = new Error();
                  err.statusCode = 404;
                  err.message = 'Lookup returned no results.';
                }

                reject(err);
              }
            });
          }
        });
      }

      // Check if there where some warnings if not just return a successful message
      if (status_message.length < 1) status_message = 'Operation successfully completed!';

      // Return overall message
      resolve({statusCode: status_code, message: status_message});
    });
  };

  Model.remoteMethod('reserve', {
    description: 'Buy one or more numbers',
    http: {
      path: '/reserve',
      verb: 'post',
    },
    accepts: [
      {arg: 'numbers', type: 'string', required: true},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'},
    ],
    returns: [{type: 'object', root: true}],
  });

  Model.release = async (number, cb) => {
    return new Promise(async (resolve, reject) => {
      // Parse input
      try {
        number = JSON.parse(number);
      } catch (err) {
        reject(err);
      }

      // Release Number Provider if any
      if (number.hasOwnProperty('NumberProvider')) {
        // Elsewhere store just number provider
        let nprov = number.NumberProvider;

        // Check if should to be reserved from some kind of provider
        var release_result = null;
        switch (nprov.type) {
          case 'intl':
          case 'local':
            release_result = await call48delete(nprov);
            break;
          case 'toll':
            release_result = await tolldelete(nprov);
            break;
        }
      }

      // Destroy Associated Tracking Number
      const opn = app.models.OpNumber;
      opn.destroyById(number.id);

      // Return overall message
      resolve({statusCode: 200, message: 'Number successfully released!'});
    });
  };

  Model.remoteMethod('release', {
    description: 'Release a number',
    http: {
      path: '/release',
      verb: 'post',
    },
    accepts: [{arg: 'number', type: 'string', required: true}],
    returns: [{type: 'object', root: true}],
  });

  Model.bulk_upload = function (encoded_file, file_extension, cb) {
    const filename = '/tmp/upload_tollnumber_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '.' + file_extension;
    fs.writeFile(filename, encoded_file, 'base64', async function (err) {
      if (err !== null) {
        cb(err);
      } else {
        const Excel = require('exceljs');
        const workbook = new Excel.Workbook();

        // retrieving worksheet based on filetype
        const {err, worksheet} = await get_worksheet(workbook, filename, file_extension);
        if (worksheet != null) {
          // Worksheet eachRow is fully asyncronous, I need that row will be sequentially evaluated
          // to correctly load data without duplicates.
          const all_prom = [];
          worksheet.eachRow({includeEmpty: true}, function (row, rowNumber) {
            if (rowNumber === 1) return;

            // Let's assume that give file will only have one column validated with number
            let toll_number = worksheet.getCell('A' + rowNumber).value;
            toll_number = toll_number != null ? toll_number.toString() : '';
            toll_number = toll_number.replace(/\s+/g, '');
            toll_number = toll_number.replace(/-/g, '');

            const np = app.models.NumberProvider;
            all_prom.push(
              new Promise((resolve, reject) => {
                np.findOne({where: {number: toll_number}}, (err, number) => {
                  if (!err && !number) {
                    // Build Number Provider Entry
                    const tollfree_record = {
                      name: 'Toll Free: ' + toll_number,
                      number: toll_number,
                      type: 'toll',
                      recur: 'monthly',
                      description: 'Bulk Import',
                    };

                    np.create(tollfree_record, (err, num_result) => {
                      if (!err && num_result) resolve(num_result);
                      else reject(new Error('Error inserting ' + toll_number));
                    });
                  } else {
                    reject(new Error('Error looking up for ' + toll_number));
                  }
                });
              }),
            );
          });

          Promise.all(all_prom)
            .then(res => {
              return cb(null, res);
            })
            .catch(err => {
              return cb(err);
            });
        } else {
          cb(err, {code: 500, message: 'Error occourred parsing file'});
        }
      }
    });
  };

  Model.remoteMethod('bulk_upload', {
    description: 'Bulk loads receiving numbers from file',
    http: {
      path: '/bulk_upload',
      verb: 'post',
    },
    accepts: [
      {
        arg: 'encoded_file',
        type: 'string',
        required: true,
        description: 'Base64 encoded file',
      },
      {
        arg: 'file_extension',
        type: 'string',
        required: true,
        description: 'File type extension',
      },
    ],
    returns: [{type: 'object', root: true}],
  });
};
