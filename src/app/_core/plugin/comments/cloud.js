
const approve = (request, response) => {
    const params = request.params;
    if (!params.hasOwnProperty('id')) {
        response.error('comment id is a required parameter');
        return;
    }

    let comment = new Parse.Object('Comment');
    comment.set('objectId', params.id);
    comment.set('status', 'publish');
    comment.set('approvedBy', request.user);
    comment.set('approvedAt', new Date());
    comment.save(null, {sessionToken: request.user.get('sessionToken')}).then(() => {
        response.success({status: 'OK'});
    }).catch((err) => {
        response.error(err.message);
    });
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

const validate = (params) => {
    let required = {
        'author'    : 'author is a required parameter',
        'post'      : 'post is a required parameter',
        'body'      : 'body is a required parameter'
    };

    for (let prop in required) {
        if (!params.hasOwnProperty(prop)) {
            return required[prop];
        }
    }
};

const before_save = (request, response) => {
    let params = request.object.toJSON();

    // Validate required fields
    let emsg = validate(params);
    if (emsg) {
        response.error(err);
        return;
    }

    // Post Pointer
    if (typeof params.post === 'string') {
        let post = new Parse.Object('Content');
        post.set('objectId', params.post);
        request.object.set('post', post);

    }

    // Author Pointer
    if (typeof params.author === 'string') {
        let author = new Parse.Object('_User');
        author.set('objectId', params.author);
        request.object.set('author', author);

    }

    // New object?
    if (!params.hasOwnProperty('objectId')) {
        // Flagged value
        request.object.set('flagged', false);

        // ACL
        let acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setWriteAccess(params.author, true);
        acl.setRoleWriteAccess("Administator", true);
        acl.setRoleWriteAccess("Moderator", true);

        request.object.setACL(acl);
    }

    // Status
    if (!params.hasOwnProperty('status')) {
        // Use default publish method for comments
        request.object.set('status', 'publish');
    }

    // Body
    params.body = core.hbsParse(params.body);
    request.object.set('body', params.body);

    response.success();

};

const after_save = (request) => {
    let post = request.object.get('post');

    let rel = post.relation('comments');
    rel.add(request.object);

    post.save(null, {useMasterKey: true});
};

const save = (request, response) => {
    let obj = new Parse.Object('Comment');

    obj.save(request.params).then((result) => {
        response.success(result.toJSON());
    }).catch((err) => {
        response.error(err.message);
    });
};

Parse.Cloud.define('comment_approve', approve);

Parse.Cloud.define('comment_list', list);

Parse.Cloud.define('comment_save', save);

Parse.Cloud.beforeSave('Comment', before_save);

Parse.Cloud.afterSave('Comment', after_save);
