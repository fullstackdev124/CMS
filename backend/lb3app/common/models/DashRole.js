'use strict';
var app = require('../../server/server');
var LoopBackContext = require('loopback-context');

function findPropertyValue(jobject, property, value) {
	for (let i = 0; i < jobject.length; i++) {
		let sub = jobject[i];
		if (sub[property] == value) return true;
	};

	return false;
}

module.exports = function (Model) {

	app.on('started', function () {
		Model.nestRemoting('GuiVisibilities');
	});

	Model.AssociatedDashUsers = async function (role_id) {
		const DashUser = app.models.DashUser;
		const whereClause = { where: { roleId: role_id } };
		try {
			let users = await DashUser.find();
			if (users) {
				let results = [];
				users = JSON.parse(JSON.stringify(users));
				users.forEach(function (user) {
					if (Object.keys(user.DashRoleMapping).length > 0)
						if (findPropertyValue(user.DashRoleMapping, 'roleId', role_id))
							results.push(user);
				})
				results = JSON.parse(JSON.stringify(results));
				return results;
			}
		} catch (err) {
			return { message: 'Error: ' + err };
		}
	};

	Model.remoteMethod('AssociatedDashUsers', {
		accepts: [
			{ arg: 'id', type: 'number', required: true },
		],
		http: { verb: 'post' },
		returns: [
			{ type: 'Object', root: true }
		]
	});
}
