
// Load Config
let config = require('../../server/config.json');
if (process.env.NODE_ENV == "dev") config = require("../../server/config.dev.json");

const app = require('../../server/server');
const request = require('request');
const http = require('http');

module.exports = function (Model) {
	app.on('started', function () {
	});

	Model.details = async function (number) {
		try {
			const filter = {
				limit: 1,
				where: { contact_number: { like: '%' + number } },
			};
			let result = Model.findOne(filter);
			if (!result) return null;
			const CallLog = app.models.CallLog;
			let callog = await CallLog.findOne({ where: { 'caller_contactId': result.id } });
			if (!callog) return null;
			callog = JSON.parse(JSON.stringify(callog));

			if (!callog.hasOwnProperty('Phonebook')) return {};

			result = callog.Phonebook;

			if (!callog.hasOwnProperty('OpNumber') || callog.OpNumber.hasOwnProperty('TrackingSources'))
				result.tsource = {};

			result.tsource = callog.OpNumber.TrackingSources;
			return result;
		} catch (e) {
			return e;
		}
	};

	Model.remoteMethod('details', {
		accepts: [
			{ arg: 'number', type: 'number', required: true },
		],
		http: { verb: 'get' },
		returns: [
			{ type: 'object', root: true },
		],
	});

	/**
	 * update phone book that id is param id
	 * @param id
	 * @param action
	 * @param cb
	 */
	Model.update = async function (id, action) {
		try {
			console.log('[Phone Book] update function ');
			const res = await Model.replaceById(id, action);
			console.log(`[Phone Book] updated ${id}`);

			// call the api to update the hadoop db
			// first, get the data to send
			const query = 'SELECT id AS phonebook_id, ' +
				'name AS phonebook_name, ' +
				'email AS phonebook_email, ' +
				'street AS phonebook_street, ' +
				'city AS phonebook_city, ' +
				'state AS phonebook_state, ' +
				'country AS phonebook_country, ' +
				'postal_code AS phonebook_postalCode, ' +
				'contact_number AS phonebook_contactNumber, ' +
				'note AS phonebook_note ' +
				' FROM ecms.phonebook ' +
				' WHERE id = ' + id;
			const results = Model.dataSource.connector.query(query);
			// console.log(">>> phone book data to send to the hadoop: ", results)

			return res;
		} catch (e) {
			return e;
		}
	};

	Model.remoteMethod('update', {
		description: 'Update Phone Book',
		http: {
			path: '/:id/update',
			verb: 'put',
		},
		accepts: [
			{ arg: 'id', type: 'number', required: true, description: 'phonebook id' },
			{ arg: 'action', type: 'object', required: true, http: { action: 'body' } },
		],
		returns: [
			{ type: 'object', root: true },
		],
	});

	/**
	 * delete phonebook that id is param id
	 * @param id
	 * @param cb
	 */
	Model.deletePhoneBook = async function (id) {
		try {
			console.log('[Phone Book] delete function ');
			const res = Model.deleteById(id);
			console.log(`[Phone Book] deleted ${id}`);

			return res;
		} catch (e) {
			return e;
		}
	};

	Model.remoteMethod('deletePhoneBook', {
		description: 'Delete Phone Book',
		http: {
			path: '/:id/delete',
			verb: 'delete',
		},
		accepts: [
			{ arg: 'id', type: 'number', required: true, description: 'phonebook id' },
		],
		returns: [
			{ type: 'object', root: true },
		],
	});
};
