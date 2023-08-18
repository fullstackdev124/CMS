
/**
 * Check for db migrations to be applied
 */

if (process.env.NODE_ENV != 'dev') {
  // let mysql = require('mysql');
  const mysql = require('sync-mysql');
  let migration = require('../utils/migrations/core');

  let dbconf = require('../datasources.json');
  if (process.env.NODE_ENV == 'dev') dbconf = require('../datasources.dev.json');

  module.exports = function (server) {
    console.log("[BOOT] Evaluating all migrations to be applied:");
    let connection = new mysql({
      // debug           : true,
      connectionLimit    : 10,
      multipleStatements : true,
      host           : dbconf.db.host,
      port           : dbconf.db.port,
      user           : dbconf.db.user,
      password       : dbconf.db.password,
      database       : dbconf.db.database,
      connectTimeout : dbconf.db.connectTimeout
    });

    migration.migrate(connection, __dirname + '/../../../db/migrations');
  };
} else {
  console.log("[ii] Running in dev mode, skipping migrations.");
}

 /**
  * Migration END
  */
