const slugify = require('slugify');

const cat_list = (request, response) => {
    let results    = [];
    let params     = request.params;
    let page       = (params.hasOwnProperty('page')) ? Number(params.page) : 1;
    let limit      = (params.hasOwnProperty('limit')) ? Number(params.limit) : 50;
    let order      = (params.hasOwnProperty('order')) ? params.order : 'ascending';
    let orderBy    = (params.hasOwnProperty('orderBy')) ? params.orderBy : 'slug';
    let skip       = (limit * page) - limit;
    let pagination = {
        pages: 0,
        page: 0,
        next: 0,
        prev: 0,
        max: 0,
        min: 0
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

    if (params.hasOwnProperty('containedIn')) {
        qry.containedIn('slug', params.containedIn);
    }

    if (params.hasOwnProperty('notContainedIn')) {
        qry.notContainedIn('slug', params.notContainedIn);
    }

    qry.count().then((count) => {
        let pages    = Math.ceil(count / limit);
        let nxt      = Math.min(page + 1, pages);
        let prv      = Math.max(page - 1, page);
        let max      = page + 2;
        let min      = page - 2;

        max          = (max > pages) ? pages : max;
        min          = (min < 1) ? 1 : min;

        pagination = {
            pages    : pages,
            page     : page,
            next     : nxt,
            prev     : prv,
            max      : max,
            min      : min
        };

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

    let qry = new Parse.Query('Category');
    qry.get(request.params.objectId).then((result) => {
        return result.destroy();
    }).catch((err) => {
        response.error(err.message);
    }).then(() => {
        response.success();
    });
};

const cat_get = (request, response) => {
    if (!request.params.hasOwnProperty('objectId')) {
        response.error('objectId is a required parameter');
        return;
    }

    let qry = new Parse.Query('Category');
    qry.get(request.params.objectId).then((result) => {
        response.success(result.toJSON());
    }).catch((err) => {
        response.error(err.message);
    });
};

Parse.Cloud.define('category_get', cat_get);

Parse.Cloud.define('category_list', cat_list);

Parse.Cloud.define('category_save', cat_save);

Parse.Cloud.define('category_delete', cat_delete);
