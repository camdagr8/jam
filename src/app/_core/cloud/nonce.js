const moment = require('moment');

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

	obj.save(null, {sessionToken: stoken}).then((rec) => {
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
	obj.destroy(null, {sessionToken: stoken}).then(() => {
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


/**
 *
 * nonce_purge
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Purges nonces older than the specified number of days.
 * @param request.days {Number} The number of days back to start the purge.
 * @param request.hours {Number} The number of hours back to start the purge.
 */
const nonce_purge = (request, response) =>{
    let params = request.params;
    let date;

    if (params.hasOwnProperty('hours') || !date) {
        let hours = (params.hasOwnProperty('hours')) ? params.hours : 72;
        date = moment().subtract(hours, 'hours').startOf('hour');
    }

    if (params.hasOwnProperty('days') || !date) {
        let days = (params.hasOwnProperty('days')) ? params.days : 7;
        date = moment().subtract(days, 'days').startOf('day');
    }

    let qry = new Parse.Query('Nonce');
    qry.lessThan('createdAt', date.toDate());
    return qry.each((results) => {
        return (typeof results !== 'undefined') ? results.destroy() : null;
    }).then(() => {
        return response.success('Nonce purge complete!');
    }).catch((err) => {
        return response.error(err.message);
    }).always(() => {
        return response.success('Nonce purge complete!');
    });
};

Parse.Cloud.job('nonce_purge', nonce_purge);
