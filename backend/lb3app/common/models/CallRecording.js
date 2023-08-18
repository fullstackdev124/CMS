'use strict';

// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == "dev") config = require("../../server/config.dev.json");

var app = require('../../server/server');
const request = require('request');
const http = require('http');

module.exports = function (Model) {
	app.on('started', function () {
	});

	Model.raw_cdr_recording = function (recording, cb) {
		const Recording = app.models.CallRecording;
		Recording.find({ where: { 'name': recording.name } }, function (err, found) {

			if (err) { return cb(err, null); }

			if (found.length) {
				Recording.updateAll({ 'name': recording.name }, recording, function (err, recording_result) {
					return cb(err, recording_result);
				});
			} else {
				Recording.create(recording, function (err, recording_result) {

					if (err) { return cb(err, null); }

					const CallLog = app.models.CallLog;
					CallLog.findOne({ where: { 'callId': recording_result.name } }, (err, call_log) => {
						if (call_log && !err) {
							if (call_log.recording_enable) {
								call_log.callrecordingId = recording_result.id;
								call_log.save(null, function (err, save_result) {
									return cb(err, save_result);
								});
							} else {
								Recording.deleteById(recording_result.id);
							}

						} else {
							return cb(err, recording_result);
						}
					});
				});
			}
		});
	};

	Model.remoteMethod('raw_cdr_recording', {
		accepts: [
			{ arg: 'recording', type: 'object', required: true }
		],
		http: { verb: 'post' },
		returns: [
			{ type: 'boolean', root: true }
		]
	});
}
