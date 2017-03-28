const _ 		= require('underscore');


/**
 *
 * TODO:
 * user_post
 * user_delete
 * user_set_role
 * user_set_pref
 */

/**
 *
 * user_get
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Gets a list of users from the Parse.User table.
 */
const users_get = (request, response, results = []) => {

	// 0.1 - Use core.query() to construct the Parse.Query object
	let qry = core.query({table: '_User', skip: request.params.skip, limit: request.params.limit, orderBy: 'username', order: 'ascending'});

	qry.find({useMasterKey: true}).then((users) => {

        users.forEach((result) => {
            let user = result.toJSON();

            user['edit_url'] = jam.baseurl + '/admin/user/' + user.objectId;

            results.push(user);
        });

		if (users.length === request.params.limit) {
			request.params.skip += request.params.limit;
			users_get(request, response, results);
		} else {
			response.success(results);
		}

	}, () => {
		response.success(results);
	});
};

const user_session_get = (request, response) => {

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

    }).then(() => {
        response.success(u);
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
 * @param request.params.skip {Number} The starting index. Default: 0.
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
 * @param request.params.token {String} The session token to query for.
 */

Parse.Cloud.define('user_session_get', user_session_get);

/**
 *
 * user_pref_set
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Sets the pref.property of the supplied user.
 *
 * @param request.user {Object} The user object to update.
 * @param request.params.prefs {Object} The name value pairs to apply to the user. If the value is set to null, the pref property will be unset.
 * @param request.params.token {String} The session ID of the user. This will call the user_session_get function and set the request.user value.
 */
const user_pref_set = (request, response) => {

    if (!request['user']) {
        if (request.params.hasOwnProperty('token')) {
            Parse.Cloud.run('user_session_get', request.params).then((user) => {
                request['user'] = user;
                user_pref_set(request, response);
            }, (err) => {
                response.error(err.message);
            });
        } else {
            response.error('request.user is a required parameter');
        }
    } else {
        let user     = request.user;
        let keys     = _.keys(request.params.prefs);
        let prefs    = user['pref'] || {};

        keys.forEach((key) => {
            let val = request.params.prefs[key];
            if (val === null) {
                delete prefs[key];
            } else {
                prefs[key] = val;
            }
        });

        user.set('prefs', prefs);
        user.save(null, {useMasterKey: true}).then((user) => {
            if (jam.currentuser !== null) {
                if (jam.currentuser.id === user.id) {
                    return jam.currentuser.fetch();
                } else {
                    return user;
                }
            } else {
                return user;
            }
        }, (err) => {
            response.error(err.message);
        }).then((user) => {
            response.success(user);
        });
    }
};

Parse.Cloud.define('user_pref_set', (request, response) => {

    // No request.user? No request.token? Got jam.currentuser?
    if (!request['user'] && !request.params['token'] && jam.currentuser !== null) {
        request['user'] = jam.currentuser;
    }

    user_pref_set(request, response);
});
