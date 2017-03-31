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
    // 0.1 - Use core.query() to contruct the Parse.Query object
    let qry = core.query({table: 'Content'});

    // 1.0 - Apply route search
    qry.containsAll('routes', [request.params.route]);

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
    let qry = core.query({table: "Content", limit: 1000});
    qry.equalTo('status', 'delete');
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
const content_get_pages = (request, response, results = []) => {

    // 0.1 - Use core.query() to contruct the Parse.Query object
    let qry = core.query({
        table:   'Content',
        skip:    request.params.skip,
        limit:   request.params.limit,
        orderBy: 'updatedAt',
        order:   'descending'
    });

    qry.equalTo('type', 'page');
    qry.find().then((content) => {

        content.forEach((item) => {
            let obj            = item.toJSON();
            obj['status_icon'] = pubicons[obj.status];
            obj['edit_url']    = jam.baseurl + '/admin/page/' + obj.objectId;
            obj['routes']      = obj['routes'] || [];

            results.push(obj);
        });

        if (content.length === request.params.limit) {
            request.params.skip += request.params.limit;
            content_get_pages(request, response, results);
        } else {
            response.success(results);
        }

    }, (err) => {
        log(err);
        response.success(results);
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
        routes = [routes];
        request.object.set('routes', routes);
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

Parse.Cloud.define('content_post', content_post);

Parse.Cloud.define('content_purge', content_purge);

Parse.Cloud.beforeSave('Content', content_before_save);

/**
 * After Content save function that creates a timestamp in the local build so that
 * browsersync will cause a reload when the database is changed.
 */
//Parse.Cloud.afterSave('Content', core.timestamper);


