/**
 * -----------------------------------------------------------------------------
 * Imports & Settings
 * -----------------------------------------------------------------------------
 */
const permissions   = ['administrator'];

/**
 * -----------------------------------------------------------------------------
 * Functions
 * -----------------------------------------------------------------------------
 */
const template_use = (req, res, next) => {
    req.jam['rec'] = {};

    /**
     * Permissions
     */
    if (!core.perm_check(permissions, req.jam.currentuser)) {
        req.jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', req);
        return;
    }

    // Get widgets
    core.add_widgets('template-editor', req);

    // Get template rec if :id specified in url
    if (req.params['id']) {

        let tmp = _.findWhere(req.jam['templates'], {objectId: req.params.id});
        if (!tmp) {
            res.render(core.template.theme + '/templates/404', req);
        } else {
            req.jam['rec'] = tmp;
            next();
        }

    } else {
        next();
    }
};

const template_save = (req, res) => {
    let nonce = req.body.nonce;
    let output = {data: null, nonce: null};

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {

        delete req.body.nonce;
        return Parse.Cloud.run('template_post', req.body);

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

const template_delete = (req, res) => {

    let nonce = req.body.nonce;
    let output = {
        message: `Deleted Template`,
        redirect: `${req.jam.baseurl}/admin/templates`
    };

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {

        delete req.body.nonce;
        return Parse.Cloud.run('template_delete', req.body);

    }, (err) => {

        res.json({error: err});

    }).then(() => {

        res.json(output);

    }, (err) => {
        res.json({error: err});
    });
};

const template_get = (req, res) => {
    let darr       = __dirname.split('/'); darr.pop();
    req.jam.content    = darr.join('/') + '/view/editor.ejs';

    // Get nonce
    Parse.Cloud.run('nonce_create').then((result) => {

        req.jam['nonce'] = result;
        res.render(core.template.admin, req);

    }, (err) => {

        req.jam['err'] = {code: 400, message: 'Bad Request'};
        res.status(req.jam.err.code).render(core.template.theme + '/templates/404', req);

    });
};
/**
 * -----------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------
 */
exports.use       = template_use;
exports.get       = template_get;
exports.delete    = template_delete;
exports.post      = template_save;
exports.put       = template_save;
