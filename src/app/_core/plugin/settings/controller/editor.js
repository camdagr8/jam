const permissions    = ['administrator'];

exports.use = (req, res, next) => {
    /**
     * Permissions
     */
    if (!core.perm_check(permissions)) {
        jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', jam);
        return;
    }

    // Get widgets
    core.add_widgets('settings-editor');

    next();
};

exports.get = (req, res) => {
    let darr       = __dirname.split('/'); darr.pop();
    jam.content    = darr.join('/') + '/view/editor.ejs';

    // Get nonce
    Parse.Cloud.run('nonce_create').then((result) => {

        jam.nonce = result;
        res.render(core.template.admin, jam);

    }, (err) => {
        log(__filename);
        log(err);
        jam['err'] = {
            code: 400,
            message: 'Bad Request'
        };
        res.status(jam.err.code).render(core.template.theme + '/templates/404', jam);

    });
};

exports.post = (req, res) => {

    let nonce = req.body.nonce;

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {

        delete req.body.nonce;

        let keys = _.keys(req.body);

        let qry = new Parse.Query('Config');
        qry.containedIn('key', keys);
        qry.limit(1000);
        return qry.find();

    }).then((results) => {
        results.forEach((item) => {
            let k = item.get('key');
            let v = {};
            v[k] = req.body[k];
            item.set('value', v);
        });

        return Parse.Object.saveAll(results);

    }).catch((err) => {
        jam.cookie.set('error', err.message);
    }).then(() => {
        jam.cookie.set('status', 'Successfully updated settings');
    }).always(() => {
        res.redirect('/admin/settings');
    });
};
