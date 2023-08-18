let config = require('./config.json');
if (process.env.NODE_ENV == 'dev') config = require('./config.dev.json');

// Import required libraries
require('@babel/polyfill');
let mysql = require('mysql');
const redis = require('redis');

// Import Loopback framework
loopback = require('loopback');
boot = require('loopback-boot');

// Helpers -- Start
const ip4ToInt = ip => ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;

const isIp4InCidr = ip => cidr => {
  const [range, bits = 32] = cidr.split('/');
  const mask = ~(2 ** (32 - bits) - 1);
  return (ip4ToInt(ip) & mask) === (ip4ToInt(range) & mask);
};

const isIp4InCidrs = (ip, cidrs) => cidrs.some(isIp4InCidr(ip));
// Helpers -- END

// Clustering it
var cluster = require('cluster');
if(cluster.isMaster && !process.env.NODE_ENV.match(/^dev$/)) {
    var numWorkers = require('os').cpus().length;

    console.log('Master cluster setting up ' + numWorkers + ' workers...');

    for(var i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('online', function(worker) {
        console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function(worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {
  const app = (module.exports = loopback());
  app.set('view engine', 'ejs'); // LoopBack comes with EJS out-of-box
  app.set('json spaces', 2); // Format json responses for easier viewing

  // Avoid Event Listener Warning (don't know if is a good choice)
  app.setMaxListeners(200);

  // start the web server
  app.start = () => {
    return app.listen(() => {
      app.emit('started');
      const baseUrl = app.get('url').replace(/\/$/, '');
      console.log('Web server listening at: %s', baseUrl);
      if (app.get('loopback-component-explorer')) {
        const explorerPath = app.get('loopback-component-explorer').mountPath;
        console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
      }
    });
  };


  // Bootstrap the application, configure models, datasources and middleware.
  // Sub-apps like REST API are mounted via boot scripts.
  boot(app, __dirname, async function (err) {

    if (err) throw err;

    app.models().forEach(Model => {
      Model.findOnePromise = function (filter) {
        return new Promise((resolve, reject) => {
          Model.findOne(filter, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      Model.findOrCreatePromise = function (query, data) {
        return new Promise((resolve, reject) => {
          Model.findOrCreate(query, data, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      Model.findPromise = function (filter) {
        return new Promise((resolve, reject) => {
          Model.find(filter, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      Model.upsertPromise = function (data) {
        return new Promise((resolve, reject) => {
          Model.upsert(data, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      Model.upsertWithWherePromise = function (where, data) {
        return new Promise((resolve, reject) => {
          Model.upsertWithWhere(where, data, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      Model.createPromise = function (data) {
        return new Promise((resolve, reject) => {
          Model.create(data, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      Model.destroyAllPromise = function (where) {
        return new Promise((resolve, reject) => {
          Model.destroyAll(where, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      Model.destroyByIdPromise = function (id) {
        return new Promise((resolve, reject) => {
          Model.destroyById(id, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      Model.updateAllPromise = function (where, data) {
        return new Promise((resolve, reject) => {
          Model.updateAll(where, data, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      Model.findByIdPromise = function (id) {
        return new Promise((resolve, reject) => {
          try {
            Model.findById(id, (err, result) => {
              if (err) {
                return reject(err);
              }
              resolve(result);
            });
          } catch (e) {
            reject(e);
          }
        });
      };

      Model.replaceByIdPromise = function (id, data) {
        return new Promise((resolve, reject) => {
          Model.replaceById(id, data, (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      };
    });

    // start the server if `$ node server.js`
    if (require.main === module) app.start();

    // Retrieve Trusted List at Startup
    const whitelist = app.models.Whitelist;
    const wh_items = await whitelist.find({});

    let trusted = [];
    wh_items.forEach(function (item) {
      let cidr = item.ip + '/' + item.mask;
      trusted.push(cidr);
    });

    // Retrieve End Point
    const apiendpoint = app.get('restApiRoot');

    // Instantiate Local Authentication Cache
    // const nc = require('node-cache');
    // const authc = new nc({stdTTL: 100, checkperiod: 120, enableLegacyCallbacks: true});

    const rtoken = redis.createClient({
      url: 'redis://' + config.redis.host + ':' + config.redis.port,
      password: config.redis.pass,
    });

    try {
      await rtoken.connect();

      // Select specific dbs
      await rtoken.select(1);
    } catch (err) {
      console.log(err)
    }

    const excludedurls = [
      apiendpoint + '/Products/reg_list',
      apiendpoint + '/DashUsers/activate',
      apiendpoint + '/DashUsers/register',
      apiendpoint + '/DashUsers/isunique',
      apiendpoint + '/DashUsers/verify_email',
      apiendpoint + '/DashUsers/authenticate',
      apiendpoint + '/DashUsers/request_email',
      apiendpoint + '/DashUsers/forgot-password',
      apiendpoint + '/PaymentMethods/create_intent',
    ];

    // Attach the hook for bypass authentication
    app.use(async (req, res, next) => {
      const ip = req.connection.remoteAddress;
      const url = req._parsedUrl.pathname;

      // Debug Logging
      if (process.env.NODE_ENV == 'dev') console.log('Request done by', ip, 'for', url);

      // Match for Whitelist and Explorer
      if (isIp4InCidrs(ip, trusted) || url.match(/^\/explorer/g) || excludedurls.indexOf(url) >= 0) {
        console.log('[ii]', ip, 'whitelisted for', url, '.');

        // Going ahead middleware execution
        next();

        // Return resources to core
        return req, res, next;
      } else {
        console.log('[ii]', ip, 'not whitelisted!');
        console.table(trusted);
      }

      // Retrieving token from expressjs query object
      let accessToken = req.query.access_token;

      // Trying retriving token from headers
      if (!accessToken) accessToken = req.headers.access_token;

      // Finally looking for token in request url
      if (!accessToken) {
        var qs = require('querystring');
        accessToken = req.headers.access_token;
      }

      // Stop request if no access token defined
      if (accessToken == null || accessToken.length <= 0) {
        console.log('[ee]', ip, 'Unauthorized request!');
        res.status(403).send(JSON.parse(JSON.stringify('{"error": {"statusCode": 403, "message": "Unauthorized, go get an access token."}}')));
        return;
      }

      // Debug
      console.log('[ii]', ip, 'Looking for token:', accessToken);

      // Search for cache stored token (avoid mysql overload)
      try {
        const tok = await rtoken.get(accessToken)
        if (tok) {
          // Debug
          console.log('[ii]', ip, 'Authorized (Token Cached)!');

          // Going ahead middleware execution
          next();

          return req, res, next;
        } else {
          // Debug
          console.log('[ii]', ip, 'Token not Cached!');

          // Get actual datetime
          const now = Date.now();
          // Retrieve access token model
          const ctoken = app.models.DashAccessToken;

          const ftoken = await ctoken.findOne({where: {and: [{id: accessToken}, {expires: {gt: now}}]} });
          if (ftoken) {
            await rtoken.set(ftoken.id, ftoken)

            console.log('[ii]', ip, 'Authorized!');
            // Going ahead middleware execution
            next();
            return req, res, next;
          }

          // Debug
          console.log('[ii]', ip, 'Not Authorized!');
          // Token not found at all
          res.status(403).send(JSON.parse(JSON.stringify(
            '{"error": {"statusCode": 403, "message": "Unauthorized, go get an access token."}}'
          )));
        }
      } catch (err) {
        // Debug
        console.log('[ii]', ip, 'Not Authorized with exception!');
        // Token not found at all
        res.status(403).send(JSON.parse(JSON.stringify(
          '{"error": {"statusCode": 403, "message": "Unauthorized, go get an access token."}}'
        )));
      }
    });
  });

  // Register Custom Authentication Token Model
  app.use(
    loopback.token({
      model: app.models.DashAccessToken,
    }),
  );

  // Inject the Global Error Handler Middleware
  const gerr_handler = require("./utils/errors/gErrorHanlder");
  app.use(gerr_handler);
}
