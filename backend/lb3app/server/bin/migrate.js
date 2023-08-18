import server from '../server.js';

const ds = server.dataSources.db;
const tag = 'migrate - ';

const tables = ['ReceivingNumber', 'SipGateways'];

ds.isActual(tables, (_, actual) => {
	if (!actual) {
		console.log(tag, 'Database should be updated according to model');
		ds.autoupdate(tables, (err, result) => {
			if (err) {
				console.log(tag, 'Error occurred while auto updating database', err);
				return;
			}
			console.log(tag, 'Updated database, result:', result);
		});
	}
});
