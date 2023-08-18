"use strict";
const file_system = require('fs');
const md5_sum = require('md5-file');

/**
 * Migration chain entrypoint
 *
 * @param mysql_connection {Connection} -  to work with database
 * @param migrations_folder {string} - path to migrations folder
 */
module.exports.migrate = function(mysql_connection, migrations_folder) {
    if (!migrations_folder) {
        throw new Error('migrations folder are required');
    }

    // Starting migrations lookup
    migrate(mysql_connection, migrations_folder);
};

/**
 * this function is an entry point to execute new migrations
 * if new are exists
 *
 * @param mysql_connection {Connection} -  to work with database
 * @param migrations_folder {string} - path to migrations folder
 */
function migrate(mysql_connection, migrations_folder) {
    var migrations = [];

    file_system.readdirSync(migrations_folder).forEach(function (file) {
        if (file) {
            info('Migration [' + file + '] found, pushing it to the stack.');
            let result = parse_file(file, migrations_folder + '/' + file);
            migrations.push(result);
        }
    });

    process_migrations(mysql_connection, migrations);
}

/**
 * this function executes new migrations
 * if new are exists
 *
 * @param mysql_connection {Connection} -  to work with database
 * @param migrations {object[]} - all existed migrations data
 */
function process_migrations(mysql_connection, migrations) {

    for (let i = 0; i < migrations.length; ++i) {
        info("Evaluating migration: " + migrations[i].name + "(" + migrations[i].hash_sum + ")");
        let result = mysql_connection.query('SELECT hash_sum FROM migration_schema WHERE version="' + migrations[i].version + '" LIMIT 1;');

        // Migration already processed, handle it
        if(result != null && result.length != 0) {
            let migcheck = result.shift();
            if(migcheck.hash_sum != migrations[i].hash_sum) {
                error("A migration with the same version, but different checksum is already applied. Please manually check for inconsistence!");
            }

            // Something happened migration failed, interrupt process
            warning("Migration " + migrations[i].name + "(" + migrations[i].hash_sum + ") is already applied");
            continue;
        }

        // Get migration content
        let content = file_system.readFileSync(migrations[i].absolute_path, "utf8");

        try {
            // Start Transaction
            result = mysql_connection.query("START TRANSACTION;");
            // Apply Migration Content
            result = mysql_connection.query(content);
            // Commit Transaction
            result = mysql_connection.query("COMMIT;");
            // Insert result to Database
            result = mysql_connection.query("INSERT INTO migration_schema VALUES('" + migrations[i].version + "', '" + migrations[i].name + "', '" + migrations[i].hash_sum + "', CURRENT_TIMESTAMP);");
            info('Migration [' + migrations[i].version + '][' + migrations[i].name + '] successfully applied');
        } catch(err) {
            error("Error while handling migration " + migrations[i].name + ": " + err);
            result = mysql_connection.query("ROLLBACK;");
            return;
        }
    }
}

/**
 * parse file name {version, name, hash_sum}
 *
 * @param file_name {string} - file name
 * @param full_path_to_file {string} - absolute file path
 */
function parse_file(file_name, full_path_to_file) {
    "use strict";

    let matches = /V(\d+(?:\.\d+)*)__([\w\_]+)\.sql/g.exec(file_name);
    if (!matches || matches.index < 0) {
        throw new Error(`file ['${file_name}'] has an invalid file name template\nSee help for more information`);
    }

    return {
        version: matches[1],
        name: matches[2].replace(/_/g, ' '),
        hash_sum: md5_sum.sync(full_path_to_file),
        absolute_path: full_path_to_file
    }
}

function info(message) {
    "use strict";

    console.log('[INFO] ' + message);
}

function warning(message) {
    "use strict";

    console.warn('[WARNING] ' + message);
}

function error(message) {
    "use strict";

    console.error('[ERROR] ' + message);
}
