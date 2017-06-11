
/**
 * -----------------------------------------------------------------------------
 * Functions
 * -----------------------------------------------------------------------------
 */
const template_get = (request, response, skip = 0, output = []) => {

    let limit    = 1000;
    let qry      = core.query({table: 'Template', skip: skip, limit: limit});

    if (request.params['objectId']) { // Get a single template by ID

        qry.get(request.params.objectId).then((result) => {
            response.success(result);
        }, (err) => {
            response.error(err.message);
        });

    } else { // Get all templates

        qry.find().then((results) => {

            results.forEach((item) => {
                output.push(item.toJSON());
            });

            if (results.length >= limit) {
                skip += limit;
                template_get(request, response, skip, output);
            } else {
                response.success(output);
            }

        }, (err) => {
            response.error(err.message);
        });
    }

};

const template_post = (request, response) => {
    delete request.params.nonce;

    let obj = new Parse.Object('Template');

    _.keys(request.params).forEach((key) => {
        obj.set(key, request.params[key]);
    });

    if (!request.params.hasOwnProperty('metabox')) {
        obj.unset('metabox');
    }
    obj.save(null).then((result) => {
        response.success(result);
    }, (err) => {
        response.error(err.message);
    })
};

const template_before_save = (request, response) => {

    let usr = request.user || jam.currentuser;
    if (usr) {
        request.object.set('creator', usr);
    }

    response.success();
};

/**
 *
 * template_delete
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Deletes a single Template object or an array of them.
 * @param request.params.objectId {String|Array} The objectId(s) to delete.
 */
const template_delete = (request, response) => {
    let params    = request.params;
    let ids       = params['objectId'];

    if (typeof ids === 'string') {
        ids = [ids];
    }

    let objs = [];
    ids.forEach((id) => {
        let obj = new Parse.Object('Template');
        obj.set('objectId', id);
        objs.push(obj);
    });

    Parse.Object.destroyAll(objs, {useMasterKey: true}).then(() => {
        response.success(true);
    }).catch((err) => {
        resonse.error(err.message);
    });
};
/**
 * -----------------------------------------------------------------------------
 * Cloud Definitions
 * -----------------------------------------------------------------------------
 */
Parse.Cloud.define('template_get', template_get);

Parse.Cloud.define('template_post', template_post);

Parse.Cloud.define('template_delete', template_delete);

/**
 *
 * Before Template Save
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Formats certain fields before inserting.
 */
Parse.Cloud.beforeSave('Template', template_before_save);
