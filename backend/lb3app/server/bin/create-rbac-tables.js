import server from '../server.js';

const ds = server.dataSources.db;
const lbTables = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role'];

ds.automigrate(lbTables, (er) => {
	if (er) throw er;
	console.log('Loopback tables [' - lbTables - '] created in ', ds.adapter.name);
	ds.disconnect();
});
