const moment = require('moment');
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

    }).catch((err) => {
        log(err.message, __filename);
    }).always(() => {
        response.success({pagination: pagination, list: results});
    });
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

Parse.Cloud.define('file_post', (request, response) => {
    let usr = request.user || jam.currentuser;

    if (!usr) {
        response.error('request.user is a required parameter');
        return;
    }

    let obj = new Parse.Object('File');

    Parse.Cloud.run('file_get', {name: request.params.name}).then((results) => {
        if (results.length > 0) {
            obj.set('objectId', results[0].id);
        }
    }).catch((err) => {
        response.error(err.message);
    }).then(() => {
        _.keys(request.params).forEach((key) => {
            obj.set(key, request.params[key]);
        });

        return obj.save();
    }).then((result) => {
        response.success(result);
    }).catch((err) => {
        response.error(err.message);
    });
});

Parse.Cloud.define('file_list', list);
