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
    let darr       = __dirname.split('/'); darr.pop();
    req.jam.content    = darr.join('/') + '/view/editor.ejs';

    // Get nonce
    Parse.Cloud.run('nonce_create').then((result) => {

        req.jam.nonce = result;
        res.render(core.template.admin, req);

    }, (err) => {
        log(__filename);
        log(err);
        req.jam['err'] = {
            code: 400,
            message: 'Bad Request'
        };
        res.status(jam.err.code).render(core.template.theme + '/templates/404', req);

    });
};

exports.post = (req, res) => {

    let nonce = req.body.nonce;

    let keys = _.keys(req.body);
    keys = _.without(keys, 'nonce');

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {

        delete req.body.nonce;

        let qry = new Parse.Query('Config');
        qry.containedIn('key', keys);
        qry.limit(1000);
        return qry.find();

    }).then((results) => {
        let rkeys = [];

        results.forEach((item) => {
            let k = item.get('key');
            rkeys.push(k);
            let v = {};
            v[k] = req.body[k];
            item.set('value', v);
        });


        let diff = _.difference(keys, rkeys);
        diff.forEach((k) => {
            if (!req.body[k]) { return; }

            let val    = {};
            let v      = req.body[k];
            let obj    = new Parse.Object('Config');
            val[k]     = v;

            obj.set('key', k);
            obj.set('value', val);

            results.push(obj);

        });

        return Parse.Object.saveAll(results);

    }).catch((err) => {
        req.jam.cookie.set('error', err.message);
    }).then(() => {
        req.jam.cookie.set('status', 'Successfully updated settings');
    }).always(() => {
        res.redirect('/admin/settings');
    });
};
