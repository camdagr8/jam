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
    req.jam['rec'] = {meta: {}};

    /**
     * Permissions
     */
    if (!core.perm_check(permissions, req.jam.currentuser)) {
        req.jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', req);
        return;
    }

    // Get widgets
    core.add_widgets('page-editor', req);

    // Customize wysiwyg
    if (req.jam.plugin.hasOwnProperty('wysiwyg')) {
        req.jam.plugin.wysiwyg['field'] = 'body';
        req.jam.plugin.wysiwyg['placeholder'] = 'Page Content';
    }


    // Get page rec if :id specified in url
    if (req.params['id']) {

        // Get the Content record and save it to `req.jam.rec`
        let obj = new Parse.Object('Content');
        obj.set('objectId', req.params.id);
        obj.fetch().then((result) => {
            req.jam['rec'] = (result) ? result.toJSON() : req.jam.rec;

            if (req.jam.rec.hasOwnProperty('publishAt')) {
                req.jam.rec['publishAt'] = moment(req.jam.rec.publishAt.iso).format('L');
            }

            if (req.jam.rec.hasOwnProperty('unpublishAt')) {
                req.jam.rec['unpublishAt'] = moment(req.jam.rec.unpublishAt.iso).format('L');
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
    req.jam.content    = darr.join('/') + '/view/editor.ejs';

    // Get nonce
    Parse.Cloud.run('nonce_create', {}, {user: req.jam.currentuser}).then((result) => {

        req.jam.nonce = result;
        res.render(core.template.admin, req);

    }, (err) => {
        log(__filename);
        log(err);
        req.jam['err'] = {
            code: 400,
            message: 'Bad Request'
        };
        res.status(req.jam.err.code).render(core.template.theme + '/templates/404', req);

    });
};

const page_save = (req, res) => {

    let nonce = req.body.nonce;
    let output = {data: null, nonce: null};

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {

        delete req.body.nonce;
        return Parse.Cloud.run('content_post', req.body, {sessionToken: req.jam.sessionToken});

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
