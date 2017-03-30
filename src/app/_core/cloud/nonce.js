/**
 *
 * nonce_create
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Create a `Nonce` record.
 */
Parse.Cloud.define('nonce_create', (request, response) => {

	let obj = new Parse.Object('Nonce');

	obj.save().then((rec) => {
		response.success(rec.id);
	}, (err) => {
		response.error(err);
	});
});



/**
 *
 * nonce_delete
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Deletes the specified `Nonce` record.
 * @param objectId The objectId of the Nonce record object.
 */
Parse.Cloud.define('nonce_delete', (request, response) => {

	if (!request.params.hasOwnProperty('id')) {
		response.error({code: 101, message: 'unable to find nonce'});
		return;
	}

	let obj = new Parse.Object('Nonce');
	obj.set('objectId', request.params.id);
	obj.destroy().then(() => {
		response.success(true);
	}, (err) => {
		response.error(err);
	});
});



/**
 *
 * nonce_get
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Gets the specified `Nonce` record and destroys it.
 */
Parse.Cloud.define('nonce_get', (request, response) => {

	if (!request.params.hasOwnProperty('id')) {
		response.error({code: 101, message: 'unable to find nonce'});
		return;
	}

	let obj = new Parse.Object('Nonce');
	obj.set('objectId', request.params.id);
	obj.fetch().then((nonce) => {

		return Parse.Cloud.run('nonce_delete', {id: nonce.id});

	}, (err) => {
		response.error(err);
	}).then((state) => {
		response.success(state);
	}, (err) => {
		response.error(err);
	});
});
