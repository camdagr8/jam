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
        redirect: `${jam.baseurl}/admin/users`
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
    jam['rec'] = {};

    /**
     * Permissions
     */
    if (!core.perm_check(permissions)) {
        jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', jam);
        return;
    }

    // Get widgets
    core.add_widgets('user-editor');

    // Get template rec if :id specified in url
    if (req.params['id']) {
        jam['rec'] = _.findWhere(jam.users, {objectId: req.params.id});
    }
    next();
};

exports.get = (req, res) => {
    let darr       = __dirname.split('/'); darr.pop();
    let dir        = darr.join('/') + '/view';
    jam.content    = darr.join('/') + '/view/editor.ejs';

    // Get nonce
    Parse.Cloud.run('nonce_create').then((result) => {

        jam['nonce'] = result;
        res.render(core.template.admin, jam);

    }, (err) => {

        jam['err'] = {code: 400, message: 'Bad Request'};
        res.status(jam.err.code).render(core.template.theme + '/templates/404', jam);

    });
};

exports.post      = user_save;
exports.put       = user_save;
exports.delete    = user_delete;
