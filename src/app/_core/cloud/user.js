

let users_get = (request, response, results = []) => {

	// 0.1 - Use core.query() to contruct the Parse.Query object
	let qry = core.query({table: '_User', skip: request.params.skip, limit: request.params.limit, orderBy: 'username', order: 'ascending'});

	qry.find({useMasterKey: true}).then((users) => {
		results = results.concat(users);

		if (users.length === request.params.limit) {
			request.params.skip += request.params.limit;
			users_get(request, response, results);
		} else {
			response.success(results);
		}

	}, (err) => {
		response.success(results);
	});
};


/**
 *
 * users_get
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Gets users list starting at skip 0 - 1000.
 *
 * @param skip {Number} The starting index. Default: 0.
 */
Parse.Cloud.define('users_get', (request, response) => {

	request.params['skip'] = (request.params.hasOwnProperty('skip')) ? request.params.skip : 0;
	request.params['limit'] = (request.params.hasOwnProperty('limit')) ? request.params.limit : 1000;
	request.params['limit'] = (request.params.limit > 1000) ? 1000 : request.params.limit;

	users_get(request, response);

});


/**
 *
 * user_session_get
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Gets a user via the req.cookies.session token
 *
 * @param token {String} The session token to query for.
 */

Parse.Cloud.define('user_session_get', (request, response) => {

	if (!request.params.hasOwnProperty('token')) { response.error({message: 'token is a required parameter'}); }

	let qry = core.query({table: '_Session'});

	let u = null;

	qry.equalTo('sessionToken', request.params.token);
	qry.include('user');
	qry.first({useMasterKey: true}).then((session) => {
		if (session) {
			u = session.get('user');
			return u;
		} else {
			response.success(null);
		}
	}, (err) => {

		response.error(err);

	}).then((user) => {

		if (user.get('roles')) {
			response.success(user);
			qry.resolve(user);
		} else {
			let rqry = new Parse.Query(Parse.Role);
				rqry.include('roles');
				rqry.equalTo('users', user);

			return rqry.find();
		}

	}).then((roles) => {
		let r = {};

		roles.forEach((role) => {
			let n = String(role.get('name')).toLowerCase();
			r[n] = {objectId: role.id, level: role.get('level')};
		});

		u.set('objectId', u.id);
		u.set('roles', r);

		return u.save(null, {useMasterKey: true});

	}).then((user) => {
		response.success(u);
	});
});
