
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

    obj.save(null).then((result) => {
        response.success(result);
    }, (err) => {
        response.error(err.message);
    })
};

const template_before_save = (request, response) => {
    // Format metabox value
    let metabox = request.object.get('metabox');
    if (typeof metabox !== 'undefined') {

        if (!_.isArray(metabox)) {
            let names = metabox.name;
            let types = metabox.type;
            let ids   = metabox.id;

            if (!_.isArray(names)) { names = [names]; }
            if (!_.isArray(types)) { types = [types]; }
            if (!_.isArray(ids)) { ids = [ids]; }

            let obj_arr = [];
            for (let i = 0; i < names.length; i++) {
                let obj = {name: names[i], type: types[i], id: ids[i]};
                obj_arr.push(obj);
            }

            request.object.set('metabox', obj_arr);
        }
    }

    response.success();
};

/**
 * -----------------------------------------------------------------------------
 * Cloud Definitions
 * -----------------------------------------------------------------------------
 */
Parse.Cloud.define('template_get', template_get);

Parse.Cloud.define('template_post', template_post);

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
