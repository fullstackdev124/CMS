module.exports = function (server) {
	var remotes = server.remotes();
	const read_properties = ['exists', 'findbyid', 'find', 'findone', 'count'];
	const write_properties = ['create', 'updateattributes', 'upsert', 'destroybyid'];

	/**
	 * If is needed to inject something right before any other method call
	 * just do it right now
	 */
	remotes.before('**', function (ctx, next, method) {

		/*
		const property = method.name;
		const model = method.sharedClass.name;

		// Just to remember
		console.log("[PRE/HOOK] - TODO::", property, "-", model);

		let at = ctx.req.accessToken;
		if (at != null) {
			const property = method.name;
			const model = method.sharedClass.name;
			at = JSON.parse(JSON.stringify(at));

			const username = at.DashUser.username;
			const acl = server.models.ACL;
			acl.find({"where":{"and":[{"model": model},{"property": {like: property}},{'principalId': username}]}}, function(err, acls) {
				if(err || !acls) {
					console.log("Chitammuort:", err);
				} else {
					console.log("ACLs:", acls);
				}
			});

			// To many verbose
			// console.log('[Auth Request]', model, property, at.DashUser, at.DashUser.DashRoleMapping);
			console.log('[Auth Request]', model, property);

		} else {
			console.log('[Unauth Request]');
		}
		*/

		next();
	});
};
