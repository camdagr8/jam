const moment     = require('moment');
const slugify    = require('slugify');

const before_save = (request, response) => {

    let params = request.object.toJSON();

    // Validate required fields
    let emsg = validate(params);
    if (emsg) {
        response.error(emsg);
        return;
    }

    // New Object?
    if (request.object.isNew()) {
        // File creator
        request.object.set('creator', request.user);

        // ACL

        let acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setWriteAccess(request.user.id, true);
        acl.setRoleWriteAccess("Administator", true);
        acl.setRoleWriteAccess("Moderator", true);

        request.object.setACL(acl);
    } else {
        // moderator?
        if (jam.hasOwnProperty('currentuser')) {
            if (params.author.id !== request.user.id) {
                request.object.set('moderatedBy', request.user);
                request.object.set('moderatedAt', new Date());
            }
        }
    }

    // slugify file name
    let name = slugify(params.name);
    request.object.set('name', name);

    // extension
    let ext    = name.toLowerCase().split('.').pop();
    ext        = ext.toLowerCase();

    request.object.set('extension', ext);

    // type
    if (params.hasOwnProperty('type')) {
        let typearr    = params.type.split('/');
        let type       = (typearr.length > 1) ? typearr[0] : params.type;
        type           = type.toLowerCase();
        type           = file_type(type, ext);

        request.object.set('type', type);
    }

    response.success();
};

const file_type = (filetype, ext) => {
    let types = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'svg'],
        video: ['mp4', 'm4v', 'mov'],
        audio: ['wav', 'mp3']
    };

    let type = 'file';

    for (let prop in types) {
        if (prop === filetype) {
            type = prop;
            break;
        }

        if (types[prop].indexOf(ext) > -1) {
            type = prop;
            break;
        }
    }

    return type;
};

const list = (request, response) => {
    let results    = [];
    let params     = request.params;
    let page       = (params.hasOwnProperty('page')) ? Number(params.page) : 1;
    let limit      = (params.hasOwnProperty('limit')) ? Number(params.limit) : 100;
    let order      = (params.hasOwnProperty('order')) ? params.order : 'descending';
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
        table      : 'File',
        orderBy    : orderBy,
        order      : order
    };

    const qry = core.query(qopt);

    if (params.hasOwnProperty('find')) {
        let reg = new RegExp(params.find, 'gi');
        qry.matches('name', reg);
    }

    if (params.hasOwnProperty('type')) {
        let type = (Array.isArray(params.type)) ? params.type : [params.type];
        qry.containedIn('type', type);
    }

    if (params.hasOwnProperty('containedIn')) {
        let containedIn = (Array.isArray(params.containedIn)) ? params.containedIn : [params.containedIn];
        qry.containedIn('objectId', params.containedIn);
    }

    if (params.hasOwnProperty('notContainedIn')) {
        let notContainedIn = (Array.isArray(params.notContainedIn)) ? params.notContainedIn : [params.notContainedIn];
        qry.notContainedIn('objectId', notContainedIn);
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
            params.include = (Array.isArray(params.include)) ? params.include : [params.include];
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

    }).catch((err) => {
        log(err.message, __filename);
    }).always(() => {
        response.success({pagination: pagination, list: results});
    });
};

const save = (request, response) => {
    let obj = new Parse.Object('File');

    obj.save(request.params, {sessionToken: stoken}).then((result) => {
        response.success(result.toJSON());
    }).catch((err) => {
        response.error(err.message);
    });
};

const validate = (params) => {
    if (!jam.hasOwnProperty('currentuser')) {
        return 'You must be a signed in user to upload a file';
    }

    let required = {
        'file'    : 'file is a required parameter',
        'name'    : 'name is a required parameter'
    };

    for (let prop in required) {
        if (!params.hasOwnProperty(prop)) {
            return required[prop];
        }
    }
};

Parse.Cloud.define('file_get', (request, response) => {
    let usr = request.user || jam.currentuser;

    if (!usr && !request.params.hasOwnProperty('ovr')) {
        response.error('request.user is a required parameter');
        return;
    }

    let skip     = request.params.hasOwnProperty('skip') ? request.params.skip : 0;
    let limit    = request.params.hasOwnProperty('limit') ? request.params.limit : 1000;
    let qry      = core.query({table: 'File', order: 'descending', orderBy: 'createdAt', limit: limit, skip: skip});

    if (request.params.hasOwnProperty('name')) {
        qry.equalTo('name', request.params.name);
    }

    if (request.params.hasOwnProperty('extension')) {
        let exts = request.params.extension;
        if (!_.isArray(exts)) {
            exts = [exts];
        }
        qry.containedIn('extension', exts);
    }

    if (request.params.hasOwnProperty('date')) {
        let d = new Date(request.params.date);
        qry.lessThan('createdAt', d);
    }

    qry.find().then((results) => {
        response.success(results);
    }).catch((err) => {
        response.error(err.message);
    });
});

Parse.Cloud.define('file_post', save);

Parse.Cloud.define('file_list', list);

Parse.Cloud.beforeSave('File', before_save);
