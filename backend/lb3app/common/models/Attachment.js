// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == "dev") config = require("../../server/config.dev.json");

const app = require('../../server/server');
const http = require('http');

/*
https://svn.apache.org/repos/asf/subversion/trunk/notes/http-and-webdav/webdav-usage.html
*/

module.exports = function (Model) {
	const auth = Buffer.from(config.fsApiUsername + ':' + config.fsApiPassword).toString('base64');

	app.on('started', () => {
		Model.observe('before save', (ctx, next) => {
			if (!ctx.instance) { next(); }
			if (ctx.instance.versionId) {
				checkIfExist('v' + ctx.instance.versionId + '/', (_, res1) => {
					// console.log('check exist folder:', res1.statusCode);
					if (res1.statusCode === 404 || res1.statusCode === 301) {
						addFolder('v' + ctx.instance.versionId + '/', (_, res2) => {
							// console.log('Status created folder:', res2.statusCode);
							if (res2.statusCode === 404) next(new Error('Cannot create folder version in SVN'));
						});
					} else if (res1.statusCode === 200) {
						// console.log('...folder (version assets) already exist');
					}
					const tmpPath = 'v' + ctx.instance.versionId + '/' + ctx.instance.nome;
					addAttachment({ base64: ctx.instance.base64, path: tmpPath }, () => { });
					ctx.instance.url = 'http://' + config.host + ':' + config.port + config.restApiRoot + '/Attachments/download/?vid=' + ctx.instance.versionId + '&' + ctx.instance.nome;
					next();
				});
			} else {
				next(new Error('No Version ID specified'));
			}
		});

		Model.observe('before delete', (ctx, next) => {
			// console.log(JSON.stringify(ctx.where)); // {"id":1}
			// deleteFromSvn(__path__, (_, res) => {
			// 	console.log(res);
			// });
			next();
		});

		const getAttachments = (cb) => {
			const req = http.request({
				hostname: config.fsApiHost,
				port: config.fsApiPort,
				path: config.fsApiRoot + '/corporate/',
				method: 'GET',
				headers: { 'Authorization': 'Basic ' + auth },
			}, res => {
				res.on('data', d => { cb(null, { statusCode: res.statusCode, data: d }); });
			});
			req.on('error', error => {
				cb(null, error);
			});
			req.end();
		};

		const getAttachment = (customerId, fileName, cb) => {
			const req = http.request({
				hostname: config.fsApiHost,
				port: config.fsApiPort,
				path: config.fsApiRoot + '/corporate/' + customerId + '/' + fileName,
				method: 'GET',
				headers: { 'Authorization': 'Basic ' + auth },
			}, res => {
				res.on('data', d => { cb(null, { statusCode: res.statusCode, data: d }); });
			});
			req.on('error', error => {
				cb(null, error);
			});
			req.end();
		};

		const addAttachment = (d, cb) => {
			const byteData = Buffer.from(d.base64, 'base64');
			const req = http.request({
				hostname: config.fsApiHost,
				port: config.fsApiPort,
				path: config.fsApiRoot + '/corporate/' + d.path,
				method: 'PUT',
				headers: {
					'Authorization': 'Basic ' + auth,
					'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
					'Content-Length': Buffer.byteLength(byteData),
				},
			}, res => {
				res.setEncoding('utf8');
				res.on('data', resData => { cb(null, { statusCode: res.statusCode, data: resData }); });
			});
			req.write(byteData);
			req.on('error', error => { cb(null, error); });
			req.end();
		};

		const deleteFromSvn = (path, cb) => {
			const req = http.request({
				hostname: config.fsApiHost,
				port: config.fsApiPort,
				path: config.fsApiRoot + '/corporate/' + path,
				method: 'DELETE',
				headers: { 'Authorization': 'Basic ' + auth },
			}, res => {
				res.on('data', d => { cb(null, { statusCode: res.statusCode, data: d }); });
			});
			req.on('error', error => {
				cb(null, error);
			});
			req.end();
		};

		const addFolder = (folderName, cb) => {
			const req = http.request({
				hostname: config.fsApiHost,
				port: config.fsApiPort,
				path: config.fsApiRoot + '/corporate/' + folderName,
				method: 'MKCOL',
				headers: { 'Authorization': 'Basic ' + auth },
			}, res => {
				res.on('data', d => { cb(null, { statusCode: res.statusCode, data: d }); });
			});
			req.on('error', error => { cb(null, error); });
			req.end();
		};

		const checkIfExist = (path, cb) => {
			const req = http.request({
				hostname: config.fsApiHost,
				port: config.fsApiPort,
				path: config.fsApiRoot + '/corporate/' + path,
				method: 'GET',
				headers: { 'Authorization': 'Basic ' + auth },
			}, res => {
				res.on('data', d => { cb(null, { statusCode: res.statusCode, data: d }); });
			});
			req.on('error', error => { cb(null, error); });
			req.end();
		};

		Model.checkIfExist = checkIfExist;
		Model.addAttachment = addAttachment;
		Model.getAttachment = getAttachment;
		Model.getAttachments = getAttachments;
		Model.addFolder = addFolder;
		Model.deleteFromSvn = deleteFromSvn;

		Model.download = (vid, nome, cb) => {
			http.request({
				hostname: config.fsApiHost,
				port: config.fsApiPort,
				path: config.fsApiRoot + '/corporate/v' + vid + '/' + nome,
				method: 'GET',
				headers: { 'Authorization': 'Basic ' + auth },
			}, res => {
				res.setEncoding('binary');
				let stream = [];
				res.on('data', chunk => {
					stream.push(Buffer.from(chunk, 'binary'));
				}).on('end', () => {
					const buffer = Buffer.concat(stream);
					cb(null, { name: nome, versionId: vid, base64: buffer.toString('base64') });
				});
			})
				.on('error', error => { cb(null, error); })
				.end();
		};

		Model.remoteMethod('getCorporateAttachmentList', {
			description: 'This should not be visible to all',
			accepts: [],
			http: { verb: 'get' },
			returns: [{ type: 'array', root: true }],
		});

		Model.remoteMethod('addFolder', {
			description: 'Add folder (ticket ID)',
			accepts: [{ arg: 'folderName', type: 'string', required: true }],
			http: { verb: 'get' },
			returns: [{ type: 'string', root: true }],
		});

		Model.remoteMethod('getAttachments', {
			description: 'Get all attackments (!!)',
			accepts: [],
			http: { verb: 'get' },
			returns: [{ type: 'string', root: true }],
		});

		Model.remoteMethod('checkIfExist', {
			description: 'Check if a file/folder exist with given path',
			accepts: [{ arg: 'path', type: 'string', required: false }],
			http: { verb: 'get' },
			returns: [{ type: 'string', root: true }],
		});

		Model.remoteMethod('getAttachment', {
			description: 'Get a single attachment',
			accepts: [
				{ arg: 'customerId', type: 'number', required: true },
				{ arg: 'fileName', type: 'string', required: true },
			],
			http: { verb: 'get' },
			returns: [{ type: 'string', root: true }],
		});

		Model.remoteMethod('addAttachment', {
			description: 'Add an attachment',
			accepts: [
				{ arg: 'data', type: 'object', required: true, http: { source: 'body' } },
			],
			http: { verb: 'post' },
			returns: [{ type: 'string', root: true }],
		});

		Model.remoteMethod('deleteFromSvn', {
			description: 'Delete attachment / folder',
			accepts: [
				{ arg: 'path', type: 'string', required: true },
			],
			http: { verb: 'get' },
			returns: [{ type: 'string', root: true }],
		});
		Model.remoteMethod('download', {
			description: 'Download attachment',
			accepts: [
				{ arg: 'vid', type: 'number', required: true },
				{ arg: 'nome', type: 'string', required: true },
			],
			http: { verb: 'get' },
			returns: [{ type: 'string', root: true }],
		});
	});
};
