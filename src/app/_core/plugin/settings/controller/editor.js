const permissions    = ['administrator'];

exports.use = (req, res, next) => {
    /**
     * Permissions
     */
    if (!core.perm_check(permissions, req.jam.currentuser)) {
        req.jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', req);
        return;
    }

    // Get widgets
    core.add_widgets('settings-editor', req);

    next();
};

exports.get = (req, res) => {
    let darr           = __dirname.split('/'); darr.pop();
    req.jam.content    = darr.join('/') + '/view/editor.ejs';

    // Get nonce
    Parse.Cloud.run('nonce_create').then((result) => {

        req.jam.nonce = result;
        res.render(core.template.admin, req);

    }, () => {
        req.jam['err'] = {
            code: 400,
            message: 'Bad Request'
        };
        res.status(jam.err.code).render(core.template.theme + '/templates/404', req);
    });
};

exports.post = (req, res) => {
    let nonce = req.body.nonce;

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {
        delete req.body.nonce;
        return Parse.Cloud.run('config_set', req.body);
    }).catch((err) => {
        req.jam.cookie.set('error', err.message);
    }).then(() => {
        req.jam.cookie.set('status', 'Successfully updated settings');
    }).always(() => {
        res.redirect('/admin/settings');
    });
};
