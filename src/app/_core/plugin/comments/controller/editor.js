
const permissions = require('../perms.json');

const approve = (req, res) => {
    let output    = {data: null, nonce: null};

    if (!_.isEmpty(req.params['id'])) {
        if (_.isEmpty(req.body['status'])) {
            res.json({error: {message: 'status is a required parameter'}});
        } else {
            let id        = req.params.id;
            let status    = req.body.status;

            Parse.Cloud.run('comment_approve', {objectId: id, status: 'publish'}, {sessionToken: stoken}).then((result) => {
                output['data']      = result;
                output['status']    = 'OK';
                res.json(output);
            }).catch((err) => {
                res.json({error: {message: err}});
            });
        }
    } else {
        res.json({error: {message: 'comment id is a required parameter'}});
    }
};

const purge = (req, res) => {
    let nonce     = req.body.nonce;
    let output    = {data: null, nonce: null};

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {
        delete req.body.nonce;
        return Parse.Cloud.run('comment_purge', null, {sessionToken: stoken});
    }).then((result) => {
        output.data = result;
        return Parse.Cloud.run('nonce_create');
    }).then((nonce) => {
        output.nonce = nonce;
    }).catch((err) => {
        output['error'] = err.message;
    }).always(() => {
        res.json(output);
    });

};

const use = (req, res, next) =>  {

    if (!core.perm_check(permissions.edit_others, jam.currentuser)) {
        jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', jam);
    }  else {
        stoken = (req.cookies.hasOwnProperty(core.skey)) ? req.cookies[core.skey] : undefined;

        if (!stoken || typeof stoken === 'undefined') {
            jam['err'] = {code: '403', message: 'Forbidden'};
            res.render(core.template.theme + '/templates/404', jam);
        } else {
            next();
        }
    }
};

const save = (req, res) => {
    if (_.isEmpty(req.params['id'])) {
        res.json({error: {message: 'comment id is a required parameter'}});
        return;
    }

    let nonce     = req.body.nonce;
    let output    = {data: null, nonce: null};

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {
        delete req.body.nonce;

        if (req.params.hasOwnProperty('id')) {
            req.body['objectId'] = req.params.id;
        }

        return Parse.Cloud.run('comment_save', req.body, {sessionToken: stoken});
    }).then((result) => {
        output.data = result;
        return Parse.Cloud.run('nonce_create');
    }).then((nonce) => {
        output.nonce = nonce;
    }).catch((err) => {
        output['error'] = err.message;
    }).always(() => {
        res.json(output);
    });
};


exports.approve    = approve;
exports.delete     = purge;
exports.post       = save;
exports.put        = save;
exports.use        = use;
