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
const user_save = (req, res) => {

    let nonce = req.body.nonce;
    let output = {data: null, nonce: null};

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {

        delete req.body.nonce;
        let cloudFNC = 'user_' + req.method.toLowerCase();
        return Parse.Cloud.run(cloudFNC, req.body);

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

const user_delete = (req, res) => {

    let nonce = req.body.nonce;
    let output = {
        message: `Deleted ${req.body.username}`,
        redirect: `${req.jam.baseurl}/admin/users`
    };

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {

        delete req.body.nonce;
        return Parse.Cloud.run('user_delete', req.body);

    }, (err) => {

        res.json({error: err});

    }).then(() => {

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
exports.use = (req, res, next) => {
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
    core.add_widgets('user-editor', req);

    // Get template rec if :id specified in url
    if (req.params['id']) {
        req.jam['rec'] = _.findWhere(req.jam.users, {objectId: req.params.id});
    }
    next();
};

exports.get = (req, res) => {
    let darr       = __dirname.split('/'); darr.pop();
    req.jam.content    = darr.join('/') + '/view/editor.ejs';

    // Get nonce
    Parse.Cloud.run('nonce_create').then((result) => {

        req.jam['nonce'] = result;
        res.render(core.template.admin, req);

    }, (err) => {

        req.jam['err'] = {code: 400, message: 'Bad Request'};
        res.status(jam.err.code).render(core.template.theme + '/templates/404', req);

    });
};

exports.post      = user_save;
exports.put       = user_save;
exports.delete    = user_delete;
