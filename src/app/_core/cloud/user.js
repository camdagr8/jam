
/**
 * -----------------------------------------------------------------------------
 * Functions
 * -----------------------------------------------------------------------------
 */

/**
 *
 * user_before_save
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Parse.User save validation
 */
const user_before_save = (request, response) => {
    let reqs = {
        email: 'email is a required parameter'
    };

    for (let prop in reqs) {
        if (!request.object.set(prop)) {
            response.error(reqs[prop]);
        }
    }

    request.object.set('username', request.object.get('email'));

    response.success();
};

/**
 *
 * user_delete
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Permanently deletes a Parse.User object
 * @param request.user {Object} The Parse.User object to delete.
 */
const user_delete = (request, response) => {
    if (!request.user) {
        response.error('request.user is a required parameter');
    }

    request.user.destroy({useMasterKey: true}).then(() => {
        response.success(true);
    }, (err) => {
       response.error(err.message);
    });
};

/**
 *
 * user_get
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Returns the Parse.Uesr object matching specified field: email|objectId|username.
 * @param request.params.email {String} The user email address.
 * @param request.params.objectId {String} The user objectId.
 * @param request.params.username {String} The user name.
 */
const user_get = (request, response) => {
    let qry = new Parse.Query(Parse.User);

    if (request.params.hasOwnProperty('email')) {
        qry.equalTo('email', request.params.email);
    }

    if (request.params.hasOwnProperty('username')) {
        qry.equalTo('username', request.params.username);
    }

    if (request.params.hasOwnProperty('objectId')) {
        qry.equalTo('objectId', request.params.objectId);
    }

    qry.first().then((user) => {
        let u = user || false;
        response.success(u);
    }, (err) => {
        response.error(err.message);
    });
};

/**
 *
 * user_post
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Creates a new user.
 */
const user_post = (request, response) => {
    let roles = (request.params.hasOwnProperty('roles')) ? request.params.roles : undefined;
    delete request.params['roles'];

    let user = new Parse.User();
    user.save(request.params, {useMasterKey: true}).then((u) => {
        if (roles) {
            request.params.roles = roles;
            request.user         = u;
            user_role_set(request, response);
        } else {
            response.success(u);
        }
    }, (err) => {
        response.error(err.message);
    });
};

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
        let user  = request.user;
        let keys  = _.keys(request.params.prefs);
        let prefs = user['pref'] || {};

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

/**
 *
 * user_role_set
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Assign roles to specified user.
 * @param request.user {Object} Parse.User object to target.
 * @param request.params.roles {Array|String} List of Parse.Role.name values.
 */
const user_role_set = (request, response) => {

    if (!request.user) {
        response.error('request.user is a required parameter');
    }

    let roles = request.params['roles'] || [];
    roles     = (!_.isArray(roles)) ? [roles] : roles;
    roles     = roles.join(',');
    roles     = String(roles).toLowerCase();
    roles     = roles.split(',');

    request.params['roles'] = [];

    let qry = new Parse.Query(Parse.Role);
    qry.find().then((results) => {
        if (results.length > 0) {
            results.forEach((role) => {
                let name = String(role.get('name')).toLowerCase();

                if (roles.indexOf(name) > -1) {
                    role.getUsers().add([request.user]);
                    request.params.roles.push(role);
                } else {
                    role.getUsers().remove([request.user]);
                }
            });

            return Parse.Object.saveAll(results, {useMasterKey: true});
        } else {
            response.success(request.user);
        }

    }, (err) => {
        response.error(err.message);
    }).then(() => {

        let robj = {};

        request.params.roles.forEach((role) => {
            robj[String(role.get('name')).toLowerCase()] = {
                objectId: role.id,
                level:    role.get('level')
            };
        });

        request.user.set('roles', robj);

        return request.user.save(null, {useMasterKey: true});

    }, (err) => {
        response.error(err.message);
    }).then((u) => {
        response.success(u);
    }, (err) => {
        response.error(err.message);
    });
};

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
const user_session_get = (request, response) => {

    if (!request.params.hasOwnProperty('token')) {
        response.error({message: 'token is a required parameter'});
    }

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
            r[n]  = {objectId: role.id, level: role.get('level')};
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
const users_get = (request, response, results = []) => {

    // 0.1 - Use core.query() to construct the Parse.Query object
    let qry = core.query({
        table:   '_User',
        skip:    request.params.skip,
        limit:   request.params.limit,
        orderBy: 'username',
        order:   'ascending'
    });

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


/**
 * -----------------------------------------------------------------------------
 * Declarations
 * -----------------------------------------------------------------------------
 */
Parse.Cloud.define('user_delete', (request, response) => {
    Parse.Cloud.run('user_get', request.params).then((u) => {
        if (u) {
            request.user = u;
            user_delete(request, response);
        } else {
            response.success(true);
        }
    }, (err) => {
        response.error(err.message);
    });
});

Parse.Cloud.define('user_get', user_get);

Parse.Cloud.define('user_post', (request, response) => {
    Parse.Cloud.run('user_get', request.params).then((u) => {
        if (!u) {
            user_post(request, response);
        } else {
            response.error(`email address '${request.params.email}' already in use`);
        }
    }, (err) => {
        response.error(err.message);
    });
});

Parse.Cloud.define('user_pref_set', (request, response) => {

    // No request.user? No request.token? Got jam.currentuser?
    if (!request['user'] && !request.params['token'] && jam.currentuser !== null) {
        request['user'] = jam.currentuser;
    }

    user_pref_set(request, response);
});

Parse.Cloud.define('user_session_get', user_session_get);

Parse.Cloud.define('users_get', (request, response) => {

    request.params['skip']  = (request.params.hasOwnProperty('skip')) ? request.params.skip : 0;
    request.params['limit'] = (request.params.hasOwnProperty('limit')) ? request.params.limit : 1000;
    request.params['limit'] = (request.params.limit > 1000) ? 1000 : request.params.limit;

    users_get(request, response);

});

Parse.Cloud.beforeSave('User', user_before_save);

