const _ = require('underscore');


/**
 * Config functions
 */


/**
 *
 * config_get
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Retrieves a single config variable or the entire list.
 *
 * @param key {String} The name of the config variable to retrieve. Default: null
 *
 * @returns {ParseObject}
 */

const config_get = (request, response, skip, output) => {

	output = output || {};
	skip = skip || 0;

	let limit = 100;

	let qry = core.query({table: 'Config', skip: skip, limit: limit});

	if (request.params.hasOwnProperty('key')) { // Single config object query
		qry.equalTo('key', request.params.key.toLowerCase());
	}

	qry.find().then((results) => { // Process results into output object.

		results.forEach((result) => {
			let k = result.get('key');
			let v = result.get('value');

			if (output.hasOwnProperty(k)) {
				if (!_.isArray(output[k])) {
					output[k] = [output[k]];
				}
				output[k].push(v[k]);

			} else {
				output[k] = v[k];
			}
		});

		return results.length;

	}, (err) => { // Query error

		response.error(err);

	}).then((len) => {

		if (len === limit) { // Call config_get() again if the len is at the `limit` so that we get all records.

			skip += limit;
			config_get(request, response, skip, output);

		} else { // We got all the records -> move along

			if (request.params.hasOwnProperty('key')) {

				let v = output[request.params.key];
				response.success(v);

			} else {

				response.success(output);

			}
		}

	});

};


Parse.Cloud.define('config_get', config_get);

/**
 *
 * config_set
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Sets a config object
 *
 * @param key {String} The name of the config object
 * @param value {Object} The config object
 */
Parse.Cloud.define('config_set', (request, response) => {

	if (typeof request.params.key === 'undefined') {
		response.error({code: 1, message: 'config_set: key is a required parameter'});
		return;
	}

	let key = String(request.params.key).toLowerCase();
	let val = request.params.value;

	delete val.key;

	let qry = core.query({table: 'Config'});
	qry.equalTo('key', key);
	qry.first().then((result) => {
		let obj = result || new Parse.Object('Config');
		obj.set('key', key);
		obj.set('value', val);

		return obj.save();
	}).then((obj) => {
		response.success(obj);
	}, (obj, err) => {
		response.error(err);
	});
});
