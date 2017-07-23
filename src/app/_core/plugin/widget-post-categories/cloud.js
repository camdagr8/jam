const slugify = require('slugify');

const cat_list = (request, response) => {
    let results    = [];
    let params     = request.params;
    let page       = (params.hasOwnProperty('page')) ? Number(params.page) : 1;
    let limit      = (params.hasOwnProperty('limit')) ? Number(params.limit) : 100;
    let order      = (params.hasOwnProperty('order')) ? params.order : 'ascending';
    let orderBy    = (params.hasOwnProperty('orderBy')) ? params.orderBy : 'slug';
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
        table      : 'Category',
        orderBy    : orderBy,
        order      : order
    };

    const qry = core.query(qopt);

    if (params.hasOwnProperty('find')) {
        let reg = new RegExp(params.find, 'gi');
        qry.matches('name', reg);
    }

    qry.count().then((count) => {
        let pages    = Math.ceil(count / limit);
        let nxt      = page + 1;
        let prv      = Math.min(page - 1, 1);
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

        qry.skip(skip);
        qry.limit(limit);

        if (params.hasOwnProperty('containedIn')) {
            qry.containedIn('slug', params.containedIn);
        }

        if (params.hasOwnProperty('notContainedIn')) {
            qry.notContainedIn('slug', params.notContainedIn);
        }

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

const cat_save = (request, response) => {

    let params = request.params;

    if (!params.hasOwnProperty('category')) {
        response.error('category is a required parameter');
        return;
    }

    let slug    = slugify(String(params.category).toLowerCase());
    let obj     = new Parse.Object('Category');

    if (params.hasOwnProperty('objectId')) {
        obj.set('objectId', params.objectId);
    }

    obj.set('name', params.category);
    obj.set('slug', slug);
    obj.save().then((result) => {
        response.success(result.toJSON());
    }).catch((err) => {
        response.error(err.message);
    });
};

const cat_delete = (request, response) => {
    if (!request.params.hasOwnProperty('objectId')) {
        response.error('objectId is a required parameter');
        return;
    }

    Parse.Cloud.run('category_get', {objectId: request.params.objectId, format: 'object'}).then((result) => {
        return result.destroy();
    }).always(() => {
        response.success({status: 'OK', category: request.params.objectId});
    });
};

const cat_get = (request, response) => {

    let queries = [
        new Parse.Query('Category'),
        new Parse.Query('Category')
    ];

    queries[0].equalTo('objectId', request.params.objectId);
    queries[1].equalTo('slug', String(request.params.objectId).toLowerCase());

    let qry = new Parse.Query.or(...queries);
    qry.first().then((result) => {
        if (result) {
            let output = result.toJSON();
            if (request.params.hasOwnProperty('format')) {
                switch (request.params.format) {
                    case 'object':
                        output = result;
                        break;
                }
            }

            response.success(output);
        } else {
            response.success();
        }
    }).catch((err) => {
       response.error(err.message);
    });
};

const cat_before_save = (request, response) => {
    let qry = new Parse.Query('Category');
    qry.equalTo('slug', request.object.get('slug'));
    qry.count().then((count) => {
        if (count > 0) {
            response.error('category already exists');
        } else {
            response.success('ok');
        }
    });
};

Parse.Cloud.define('category_get', cat_get);

Parse.Cloud.define('category_list', cat_list);

Parse.Cloud.define('category_save', cat_save);

Parse.Cloud.define('category_delete', cat_delete);

Parse.Cloud.beforeSave('Category', cat_before_save);
