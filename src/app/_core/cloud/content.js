
const moment   = require('moment');
const pubicons = {
    'draft':         'lnr-pencil',
    'publish':       'lnr-paper-plane',
    'publish-later': 'lnr-calendar-31',
    'delete-later':  'lnr-calendar-cross',
    'delete':        'lnr-trash'
};

/**
 * -----------------------------------------------------------------------------
 * Functions
 * -----------------------------------------------------------------------------
 */
/**
 *
 * content_get
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Gets the specified `route` from the `Content` table.
 *
 * @param request.params.route {String} The url route to query. Example: /page/test or /
 *
 * @returns {Object} Returns a Parse.Object
 */
const content_get = (request, response) => {
    let queries = [];
    // 0.1 - Use core.query() to contruct the Parse.Query object
    let rqry = core.query({table: 'Content'});

    // 1.0 - Apply route search
    rqry.contains('routes', request.params.route);

    queries.push(rqry);

    let rarr = request.params.route.split('/');
    rarr.shift();
    if (rarr.length === 2) {

        let cqry = core.query({table: 'Content'});
        cqry.contains('routes', rarr[1]);
        cqry.contains('category', rarr[0]);

        queries.push(cqry);
    }

    let qry = Parse.Query.or(...queries);

    // 2.0 - Execute query
    qry.first().then((result) => {

        if (!result) {
            response.error("page not found");
        } else {
            response.success(result);
        }

    }, () => {
        response.error("page not found");
    });
};

const content_purge = (request, response) => {
    let type = (request.params.hasOwnProperty('type')) ? request.params.type : null;
    let qry = core.query({table: "Content", limit: 1000});
    qry.equalTo('status', 'delete');
    if (type !== null) { qry.equalTo('type', type); }

    qry.find().then((results) => {
        return Parse.Object.destroyAll(results);
    }).catch((err) => {
        response.error(err.message);
    }).then(() => {
        response.success(true);
    });
};

/**
 *
 * content_get_pages
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Gets the list of pages from the Content table.
 *
 * @param request.params.skip {Number} The starting index. Default: 0.
 * @param request.params.limit {Number} The number of pages to return. Default: 1000.
 *
 * @returns {Array} Returns an array of Parse.Objects.
 */
const content_get_pages = (request, response) => {

    let results    = [];
    let pagination = {};
    let params     = request.params;
    let page       = (params.hasOwnProperty('page')) ? Number(params.page) : 1;
    let limit      = (params.hasOwnProperty('limit')) ? Number(params.limit) : 50;
    let order      = (params.hasOwnProperty('order')) ? params.order : 'descending';
    let orderBy    = (params.hasOwnProperty('orderBy')) ? params.orderBy : 'createdAt';
    let skip       = (limit * page) - limit;
    skip           = (skip < 0) ? 0 : skip;


    // 0.1 - Use core.query() to contruct the Parse.Query object
    let qopt = {
        table      : 'Content',
        orderBy    : orderBy,
        order      : order
    };

    const qry = core.query(qopt);

    if (!params.hasOwnProperty('deleted')) {
        qry.notEqualTo('status', 'delete');
    }

    qry.equalTo('type', 'page');
    qry.count().then((count) => {
        let pages    = Math.ceil(count / limit);
        let nxt      = Math.min(page + 1, pages);
        let prv      = Math.max(page - 1, page);
        let max      = page + 2;
        let min      = page - 2;

        max          = (max > pages) ? pages : max;
        min          = (min < 1) ? 1 : min;

        pagination = {
            count    : count,
            pages    : pages,
            page     : page,
            next     : nxt,
            prev     : prv,
            max      : max,
            min      : min,
            query    : (params.hasOwnProperty('deleted')) ? '?deleted=true' : ''
        };

        qry.skip(skip);
        qry.limit(limit);
        return qry.find();

    }).then((items) => {

        items.forEach((item) => {
            let obj            = item.toJSON();
            obj['status_icon'] = pubicons[obj.status];
            obj['edit_url']    = jam.baseurl + '/admin/page/' + obj.objectId;
            obj['routes']      = obj['routes'] || [];

            results.push(obj);
        });

    }, (err) => {
        log(__filename);
        log(err.message);
    }).always(() => {
        let output = {pagination: pagination, list: results};
        response.success(output);
    });
};

/**
 *
 * content_get_posts
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Gets the list of posts from the Content table.
 *
 * @param request.page {Number} The search results page to return.
 *
 * @returns {Array} Returns an array of Parse.Objects.
 */
const content_get_posts = (request, response) => {

    let results    = [];
    let pagination = {};
    let params     = request.params;
    let page       = (params.hasOwnProperty('page')) ? Number(params.page) : 1;
    let limit      = (params.hasOwnProperty('limit')) ? Number(params.limit) : 50;
    let order      = (params.hasOwnProperty('order')) ? params.order : 'descending';
    let orderBy    = (params.hasOwnProperty('orderBy')) ? params.orderBy : 'createdAt';
    let skip       = (limit * page) - limit;
    skip           = (skip < 0) ? 0 : skip;


    // 0.1 - Use core.query() to contruct the Parse.Query object
    let qopt = {
        table      : 'Content',
        orderBy    : orderBy,
        order      : order
    };

    const qry = core.query(qopt);

    if (!params.hasOwnProperty('deleted')) {
        qry.notEqualTo('status', 'delete');
    }

    qry.equalTo('type', 'post');
    qry.count().then((count) => {
        let pages    = Math.ceil(count / limit);
        let nxt      = Math.min(page + 1, pages);
        let prv      = Math.max(page - 1, page);
        let max      = page + 2;
        let min      = page - 2;

        max          = (max > pages) ? pages : max;
        min          = (min < 1) ? 1 : min;

        pagination = {
            count    : count,
            pages    : pages,
            page     : page,
            next     : nxt,
            prev     : prv,
            max      : max,
            min      : min,
            query    : (params.hasOwnProperty('deleted')) ? '?deleted=true' : ''
        };

        qry.skip(skip);
        qry.limit(limit);
        return qry.find();

    }).then((items) => {

        items.forEach((item) => {
            let obj            = item.toJSON();
            obj['status_icon'] = pubicons[obj.status];
            obj['edit_url']    = jam.baseurl + '/admin/post/' + obj.objectId;
            obj['routes']      = obj['routes'] || [];

            results.push(obj);
        });
    }, (err) => {
        log(__filename);
        log(err.message);
    }).always(() => {
        response.success({pagination: pagination, list: results});
    });
};

/**
 *
 * content_post
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Creates a new `Content` object.
 *
 */
const content_post = (request, response) => {
    delete request.params.nonce;

    let obj = new Parse.Object('Content');

    _.keys(request.params).forEach((key) => {
        obj.set(key, request.params[key]);
    });

    if (!request.params.hasOwnProperty('category')) {
        obj.unset('category');
    }

    if (!request.params.hasOwnProperty('unpublishAt')) {
        obj.unset('unpublishAt');
    }

    obj.save(null).then((result) => {
        response.success(result);
    }, (err) => {
        response.error(err.message);
    });

};

/**
 *
 * Before Content Save
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Formats certain fields before inserting.
 */
const content_before_save = (request, response) => {

    let publishAt = request.object.get('publishAt');
    if (typeof publishAt === 'string') {

        let d = new Date(publishAt);
        request.object.set('publishAt', d);
    }

    let unpublishAt = request.object.get('unpublishAt');
    if (typeof unpublishAt === 'string') {

        let d = new Date(unpublishAt);
        request.object.set('unpublishAt', d);
    }

    let routes = request.object.get('routes');
    if (typeof routes === 'string') {
        request.object.set('routes', [routes]);
    }

    let cats = request.object.get('category');
    if (typeof cats === 'string') {
        request.object.set('category', [cats]);
    }

    let usr = request.user || jam.currentuser;
    if (usr) {
        request.object.set('creator', usr);
    }

    response.success();

};

/**
 * -----------------------------------------------------------------------------
 * Cloud Definitions
 * -----------------------------------------------------------------------------
 */

Parse.Cloud.define('content_get', content_get);

Parse.Cloud.define('content_get_pages', (request, response) => {
    request.params['skip']  = (request.params.hasOwnProperty('skip')) ? request.params.skip : 0;
    request.params['limit'] = (request.params.hasOwnProperty('limit')) ? request.params.limit : 1000;
    request.params['limit'] = (request.params.limit > 1000) ? 1000 : request.params.limit;

    content_get_pages(request, response);
});

Parse.Cloud.define('content_get_posts', content_get_posts);

Parse.Cloud.define('content_post', content_post);

Parse.Cloud.define('content_purge', content_purge);

Parse.Cloud.beforeSave('Content', content_before_save);

/**
 * After Content save function that creates a timestamp in the local build so that
 * browsersync will cause a reload when the database is changed.
 */
//Parse.Cloud.afterSave('Content', core.timestamper);
