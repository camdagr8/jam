
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
    let route = (typeof request.params.route === 'string') ? [request.params.route] : request.params.route;
    rqry.containsAll('routes', route);

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
    qry.descending('createdAt');

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
    let last;
    let count     = 0;
    let params    = request.params;
    let qry       = new Parse.Query('Content');
    let type      = (params.hasOwnProperty('type')) ? params.type : null;
    let limit     = (params.hasOwnProperty('limit')) ? params.limit : 1000;
    let session   = (request.user) ? request.user.getSessionToken() : undefined;

    qry.equalTo('status', 'delete');
    qry.descending('createdAt');
    qry.equalTo('type', type);
    qry.limit(limit);

    let promise = qry.find({sessionToken: session}).then((results) => {
        count    = results.length;
        last     = _.last(results);
        return Parse.Object.destroyAll(results, {sessionToken: session});
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
            content_purge(result.request, result.response);
        }

        promise.resolve();
    }).catch((err) => {
        response.error(err.message);
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
const content_list = (request, response) => {

    let results       = [];
    let params        = request.params;
    let type          = (params.hasOwnProperty('type')) ? params.type : 'post';
    let page          = (params.hasOwnProperty('page')) ? Number(params.page) : 1;
    let limit         = (params.hasOwnProperty('limit')) ? Number(params.limit) : 50;
    let order         = (params.hasOwnProperty('order')) ? params.order : 'descending';
    let orderBy       = (params.hasOwnProperty('orderBy')) ? params.orderBy : 'createdAt';
    let skip          = (limit * page) - limit;
    skip              = (skip < 0) ? 0 : skip;
    let pagination    = {
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
        table      : 'Content',
        orderBy    : orderBy,
        order      : order
    };

    const qry = core.query(qopt);

    // Content type
    qry.equalTo('type', type);

    // User
    if (params.hasOwnProperty('user')) {
        let user;

        if (typeof params.user === 'string') {
            user = new Parse.User();
            user.set('objectId', params.user);
        } else {
            user = params.user;
        }

        qry.equalTo('creator', user);
    }

    // Status
    if (!params.hasOwnProperty('status')) {
        qry.notEqualTo('status', 'delete');
    } else {

        if (params.status[0] === 'unpublish-later') {
            qry.greaterThan('unpublishAt', new Date());
        }

        params['status'] = (params.hasOwnProperty('status')) ? params.status : 'publish';
        params['status'] = (typeof params.status === 'string') ? [String(params.status).toLowerCase()] : params.status;
        params['status'] = _.without(params.status, 'unpublish-later');

        if (params.status.length > 0) {
            qry.containedIn('status', params.status);
        }
    }

    // Find
    if (params.hasOwnProperty('find')) {
        let v = core.strip_tags(params.find);
        qry.containsAll('index', v);
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
            let obj            = item.toJSON();
            obj['status_icon'] = pubicons[obj.status];
            obj['edit_url']    = '/admin/'+type+'/' + obj.objectId;
            obj['routes']      = obj['routes'] || [];

            results.push(obj);
        });

    }, (err) => {
        log(err.message, __filename);
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

    if (!request.params.hasOwnProperty('routes')) {
        obj.unset('routes');
    }

    if (request.user) {
        if (!request.params.objectId) {
            // set the initial creator
            obj.set('creator', request.user);
        } else {
            // log the update
            obj.addUnique('editors', {timestamp: new Date(), user: request.user.id, data: request.params});
        }
    } else {
        response.error('request.user is undefined');
        return;
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
    if (!routes) {
        request.object.set('routes', []);
    }

    let cats = request.object.get('category');
    if (typeof cats === 'string') {
        request.object.set('category', [cats]);
    }


    let title = request.object.get('title');
    request.object.set('title', title);

    let index = [];
    let meta = request.object.get('meta');
    meta['title'] = title;

    for (let prop in meta) {
        let val = core.strip_tags(meta[prop]);
        index = index.concat(val);
    }

    if (index.length > 0) {
        index = _.uniq(index);
        request.object.set('index', index);
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
    request.params['type'] = 'page';
    content_list(request, response);
});

Parse.Cloud.define('content_get_posts', (request, response) => {
    request.params['type'] = 'post';
    content_list(request, response);
});

Parse.Cloud.define('content_post', content_post);

Parse.Cloud.define('content_purge', content_purge);

Parse.Cloud.beforeSave('Content', content_before_save);
