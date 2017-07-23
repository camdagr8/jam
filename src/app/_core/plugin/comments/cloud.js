
const after_save = (request) => {
    let post = request.object.get('post');

    let rel = post.relation('comments');
    rel.add(request.object);

    post.save(null, {useMasterKey: true});
};

const approve = (request, response) => {

    const params = request.params;
    if (!params.hasOwnProperty('objectId')) {
        response.error('objectId is a required parameter');
        return;
    }

    let comment = new Parse.Object('Comment');
    comment.set('objectId', params.objectId);
    comment.set('status', 'publish');
    comment.set('approvedBy', request.user);
    comment.set('approvedAt', new Date());
    comment.save(null, {sessionToken: stoken}).then(() => {
        response.success({status: 'OK'});
    }).catch((err) => {
        response.error(err.message);
    });
};

const before_save = (request, response) => {

    let params = request.object.toJSON();

    // Validate required fields
    let emsg = validate(params);
    if (emsg) {
        response.error(emsg);
        return;
    }

    // Post Pointer
    if (typeof params.post === 'string') {
        let post = new Parse.Object('Content');
        post.set('objectId', params.post);
        request.object.set('post', post);
    }

    // Author Pointer
    if (!params.hasOwnProperty('author') && jam.hasOwnProperty('currentuser')) {
        params['author'] = jam.currentuser.id;
    }

    if (typeof params.author === 'string') {
        let author = new Parse.User();
        author.set('objectId', params.author);
        request.object.set('author', author);
    }
    params['author'] = request.object.get('author');

    // New object?
    if (request.object.isNew()) {
        // Flagged value
        request.object.set('flagged', false);

        // ACL
        let acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setWriteAccess(params.author, true);
        acl.setRoleWriteAccess("Administator", true);
        acl.setRoleWriteAccess("Moderator", true);

        request.object.setACL(acl);
    } else {
        // moderator?
        if (jam.hasOwnProperty('currentuser')) {
            if (params.author.id !== jam.currentuser.id) {
                request.object.set('moderatedBy', jam.currentuser);
                request.object.set('moderatedAt', new Date());
            }
        }
    }

    // Status
    if (!params.hasOwnProperty('status')) {
        // Use default publish method for comments
        request.object.set('status', 'publish');
    }

    // Body
    params.body = core.hbsParse(params.body);
    request.object.set('body', params.body);

    // Flagged
    if (params.hasOwnProperty('flagged')) {
        if (typeof params['flagged'] === 'string') {
            params['flagged'] = Boolean(params.flagged === 'true');
            request.object.set('flagged', params.flagged);
        }
    }

    response.success();

};

const list = (request, response) => {
    let results    = [];
    let params     = request.params;
    let page       = (params.hasOwnProperty('page')) ? Number(params.page) : 1;
    let limit      = (params.hasOwnProperty('limit')) ? Number(params.limit) : 100;
    let order      = (params.hasOwnProperty('order')) ? params.order : 'ascending';
    let orderBy    = (params.hasOwnProperty('orderBy')) ? params.orderBy : 'createdAt';
    let skip       = (limit * page) - limit;
    let pagination = {
        limit    : limit,
        count    : 0,
        pages    : 0,
        page     : 0,
        next     : 0,
        prev     : 0,
        max      : 0,
        min      : 0
    };

    // 0.1 - Use core.query() to contruct the Parse.Query object
    let qopt = {
        table      : 'Comment',
        orderBy    : orderBy,
        order      : order
    };

    const qry = core.query(qopt);

    // Status
    params['status'] = (params.hasOwnProperty('status')) ? params.status : 'publish';
    params['status'] = (typeof params.status === 'string') ? [String(params.status).toLowerCase()] : params.status;
    qry.containedIn('status', params.status);

    if (params.hasOwnProperty('find')) {
        let reg = new RegExp(params.find, 'gi');
        qry.matches('body', reg);
    }

    if (params.hasOwnProperty('post')) {
        let post = params.post;

        if (typeof post === 'string') {
            post = new Parse.Object('Content');
            post.set('objectId', params.post);
        }

        qry.equalTo('post', post);
    }

    if (params.hasOwnProperty('author')) {
        let author = params.author;

        if (typeof author === 'string') {
            author = new Parse.User();
            author.set('objectId', params.author);
        }

        qry.equalTo('author', author);
    }

    if (params.hasOwnProperty('flagged')) {
        qry.equalTo('flagged', params.flagged);
    }

    if (params.hasOwnProperty('containedIn')) {
        qry.containedIn('objectId', params.containedIn);
    }

    if (params.hasOwnProperty('notContainedIn')) {
        qry.notContainedIn('objectId', params.notContainedIn);
    }

    qry.count().then((count) => {
        let pages    = Math.ceil(count / limit);
        let nxt      = page + 1;
        let prv      = page - 1;
        let max      = page + 2;
        let min      = page - 2;

        max          = (max > pages) ? pages : max;
        min          = (min < 1) ? 1 : min;
        prv          = (prv < 1) ? 1 : prv;

        pagination = {
            limit    : limit,
            count    : count,
            pages    : pages,
            page     : page,
            next     : nxt,
            prev     : prv,
            max      : max,
            min      : min,
        };

        if (params.hasOwnProperty('include')) {
            params.include = (typeof params.include === 'string') ? [params.include] : params.include;
            params.include.forEach((inc) => { qry.include(inc); });
        }

        qry.skip(skip);
        qry.limit(limit);

        return qry.find();

    }).then((items) => {

        items.forEach((item) => {
            let obj = item.toJSON();
            results.push(obj);
        });

        response.success({pagination: pagination, list: results});

    }).catch((err) => {
        log(__filename);
        log(err.message);
        response.success({pagination: pagination, list: results});
    });
};

const purge = (request, response) => {

    let last;
    let count     = 0;
    let params    = request.params;
    let qry       = new Parse.Query('Comment');
    let limit     = (params.hasOwnProperty('limit')) ? params.limit : 1000;

    qry.equalTo('status', 'delete');
    qry.descending('createdAt');
    qry.limit(limit);

    let promise = qry.find({sessionToken: stoken}).then((results) => {
        count    = results.length;
        last     = _.last(results);
        return Parse.Object.destroyAll(results, {sessionToken: stoken});
    }).then(() => {
        if (count === limit) {
            return {request: request, response: response};
        } else {
            return 'OK';
        }
    }).then((result) => {
        if (result === 'OK') {
            response.success(result);
        } else {
            purge(result.request, result.response);
        }

        promise.resolve();
    }).catch((err) => {
        response.error(err.message);
    });
};

const save = (request, response) => {
    let obj = new Parse.Object('Comment');

    obj.save(request.params, {sessionToken: stoken}).then((result) => {
        response.success(result.toJSON());
    }).catch((err) => {
        response.error(err.message);
    });
};

const validate = (params) => {
    let required = {
        'post'      : 'post is a required parameter',
        'body'      : 'body is a required parameter'
    };

    for (let prop in required) {
        if (!params.hasOwnProperty(prop)) {
            return required[prop];
        }
    }
};

Parse.Cloud.define('comment_approve', approve);

Parse.Cloud.define('comment_list', list);

Parse.Cloud.define('comment_purge', purge);

Parse.Cloud.define('comment_save', save);

Parse.Cloud.beforeSave('Comment', before_save);

Parse.Cloud.afterSave('Comment', after_save);
