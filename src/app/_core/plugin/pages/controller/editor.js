/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
const moment         = require('moment');
const permissions    = ['administrator', 'publisher', 'moderator'];


/**
 * -----------------------------------------------------------------------------
 * Functions
 * -----------------------------------------------------------------------------
 */
const page_use = (req, res, next) => {
    jam['rec'] = {meta: {}};

    /**
     * Permissions
     */
    if (!core.perm_check(permissions)) {
        jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', jam);
        return;
    }

    // Get widgets
    core.add_widgets('page-editor');

    // Customize wysiwyg
    if (jam.plugin.hasOwnProperty('wysiwyg')) {
        jam.plugin.wysiwyg['field'] = 'body';
        jam.plugin.wysiwyg['placeholder'] = 'Page Content';
    }


    // Get page rec if :id specified in url
    if (req.params['id']) {

        // Get the Content record and save it to `jam.rec`
        let obj = new Parse.Object('Content');
        obj.set('objectId', req.params.id);
        obj.fetch().then((result) => {
            jam['rec'] = (result) ? result.toJSON() : jam.rec;

            if (jam.rec.hasOwnProperty('publishAt')) {
                jam.rec['publishAt'] = moment(jam.rec.publishAt.iso).format('L');
            }

            if (jam.rec.hasOwnProperty('unpublishAt')) {
                jam.rec['unpublishAt'] = moment(jam.rec.unpublishAt.iso).format('L');
            }

            next();

        }, () => {
            res.render(core.template.theme + '/templates/404');
        });

    } else {
        next();
    }
};

const page_get = (req, res) => {
    let darr       = __dirname.split('/'); darr.pop();
    jam.content    = darr.join('/') + '/view/editor.ejs';

    // Get nonce
    Parse.Cloud.run('nonce_create').then((result) => {

        jam.nonce = result;
        res.render(core.template.admin, jam);

    }, (err) => {

        log(err);
        jam['err'] = {
            code: 400,
            message: 'Bad Request'
        };
        res.status(jam.err.code).render(core.template.theme + '/templates/404', jam);

    });
};

const page_save = (req, res) => {

    let nonce = req.body.nonce;
    let output = {data: null, nonce: null};

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {

        delete req.body.nonce;
        return Parse.Cloud.run('content_post', req.body);

    }, (err) => {

        res.json({error: err});

    }).then((result) => {

        output.data = result.toJSON();
        return Parse.Cloud.run('nonce_create');

    }, (err) => {

        res.json({error: err});

    }).then((nonce) => {

        output.nonce = nonce;
        res.json(output);

    }, (err) => {
        res.json({error: err});
    });
};

/**
 * -----------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------
 */
exports.use     = page_use;
exports.get     = page_get;
exports.post    = page_save;
exports.put     = page_save;
