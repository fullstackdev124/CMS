/**
 *
 * Actual WebSocket Java Server supports old protocol version
 * Socket.io 2.x is required.
 *
 */

// Config File
const config = require('./config.json');

// Libs
const mysql = require("mysql");
const express = require("express");
const io = require("socket.io-client");
const { exec } = require("child_process");

/**
 *
 * SocketIO Section
 *
 */

const socket = io("http://127.0.0.1:8890", {
	path: '/socket.io',
	transports: ["websocket"]
});

socket.on("connect", () => {
	// Debug
	console.log("[ii] Connected:", socket.id);

	socket.emit("subscribe", '{"channels":' + config.topic + ' }', () => {
		// Debug
		console.log("[ii] Subscribed!");
	});
});

socket.on("publish", function(data) {
	if (data) {
		message = JSON.parse(data);
		body = JSON.parse(JSON.stringify(message.body));
		console.log("[ii] Received data on channel", message.channel, ":", body);
		switch (message.channel) {
			case "it.techfusion.coresip.admin.AsyncMessageManager":
				asyncMessageManagerHandler(body);
				break;
			default:
				console.log("[ww] Channel(", message.channel, ") not handled yet")
		}
	} else {
		// Debug
		console.log("[ee] Malformed publish received!");
	}
});

socket.on("disconnect", () => {
	// Debug
	console.log("[ii] Disconnected:", socket.id);
});

/**
 *
 * Live SQL
 *
 **/
function checkforReload() {
	var connection = mysql.createConnection({
		host: config.database.host,
		user: config.database.username,
		password: config.database.password,
		database: config.database.dbname
	});

	connection.connect();
	connection.query('SELECT * FROM modules_reload WHERE result=1', function (error, results, fields) {
		if (error || !results.length) {
			connection.end();
		} else {
			results.forEach(result => {
				let command = result.command;
				exec(command, (error, stdout, stderr) => {
					if (error) {
						console.log(`[ee] Unable to execute command ${command}: ${error.message}`);
					} else {
						console.log(`[ii] '${command}' returned:\n`, stdout, stderr);
						connection.query(`UPDATE modules_reload SET result=0 WHERE id=${result.id}`, function (error, results, fields) {
							if (error) throw error;
						});
					}
	
					connection.end();
				});
			});
		}
	});

	// Trigger timeout again -- forever!
	setTimeout(checkforReload, 2*1000);
}
	
// Set a 2 seconds timeout for reload checking
setTimeout(checkforReload, 2*1000);

/**
 *
 * RESTful Section
 *
 */

var app = express();

app.listen(config.local_rest.port, () => {
	console.log("REST Service port:", config.local_rest.port);
});

app.get("/notify", (req, res, next) => {

	if (typeof req.query.managerid == 'undefined') {
		res.status(500).json({ message: 'Wrong parameters' });
		return;
	}

	if (typeof req.query.entity == 'undefined') {
		res.status(500).json({ message: 'Wrong parameters' });
		return;
	}

	if (typeof req.query.state == 'undefined') {
		res.status(500).json({ message: 'Wrong parameters' });
		return;
	}

	let managerid = req.query.managerid;
	let entity = req.query.entity;
	let state = req.query.state;

	// Try to parse as best as possible state value as a boolean
	if (state === '0' || state === 0 || state === false || state === "false" || state === "close" || state === "closed") state = false;
	else state = true;

	const request = require('request');
	const http = require('http');

	const coresip_req = http.request({
		hostname: config.coresip_rest.host,
		port: config.coresip_rest.port,
		path: '/CoreSIP_IPPBX/api/v1/boss-secretaries/update-bypass',
		method: 'PUT',
		headers: {}
	}, coresip_res => {
		console.log(`[ii] Response from CoreSIP Rest (status code: ${coresip_res.statusCode}), (status message: ${coresip_res.statusMessage})`);
		if (coresip_res.statusCode < 200 || coresip_res.statusCode > 202) {
			res.status(500).json({ message: "Error notifing status!" });
			return;
		}

		coresip_res.on('data', d => {
			console.log(`[ii] Manager Status Update Success (data: ${d})`)
		});
	});

	coresip_req.on('error', error => {
		console.error(`[ee] Error udating manager status (error: ${error}`);
		res.status(500).json({ message: "Error notifing status!" });
		return;
	});

	const post_data = { boss: managerid, status: state };
	coresip_req.write(JSON.stringify(post_data));
	coresip_req.end();

	state = (state) ? "open" : "close";
	let command = "/usr/local/bin/notify_external.sh -e " + entity + " -s " + state;
	exec(command, (error, stdout, stderr) => {
		if (error) {
			console.log(`[ee] Unable to notify user-agent status: ${error.message}`);
			res.status(500).json({ message: "Error notifing status!" });
		} else {
			console.log(`[ii] '${command}' returned:\n`, stdout, stderr);
			res.status(200).json({ message: "Notification success!" });
		}

		return;
	});
});

/**
 *
 * Helper Functions
 *
 */

function asyncMessageManagerHandler(body) {
	let state = "close";
	let manager = body.manager;

	if (!manager) return;
	var mysql = require('mysql');

	var con = mysql.createConnection({
		host: config.database.host,
		user: config.database.username,
		password: config.database.password,
		database: config.database.dbname
	});

	con.connect(function(err) {
		if (err) throw err;
		con.query(
			"SELECT username, domain FROM coresip.boss as bs, coresip.subscriber as sb WHERE bs.subscriber_id=sb.id AND bs.id=" + manager + " LIMIT 1;",
			function(err, result, fields) {
				if (err) throw err;

				result = result.pop();

				switch (body.status) {
					case "false":
						state = "close";
						console.log("Manager (", body.manager, ") IMA filter disabled!");
						break;
					default:
						state = "open"
						console.log("Manager (", body.manager, ") IMA filter enabled!");
				}

				let entity = "sip:" + config.precode + result.username + "@" + config.localhost + ":" + config.localport;
				let command = "/usr/local/bin/notify_external.sh -e " + entity + " -s " + state;
				exec(command, (error, stdout, stderr) => {
					if (error) {
						console.log(`[ee] Unable to notify user-agent status: ${error.message}`);
						return;
					} else {
						console.log(`[ii] '${command}' returned:\n`, stdout, stderr);
					}
				});
			});
	});
}
