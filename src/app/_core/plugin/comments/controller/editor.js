const permissions = ['administrator', 'moderator'];

exports.approve = function (req, res) {
    if (!core.perm_check(permissions)) {
        jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', jam);
    }  else {
        if (!_.isEmpty(req.params['id'])) {
            if (_.isEmpty(req.body['status'])) {
                res.json({status: 'ERROR', message: 'status is a required parameter'});
            } else {
                let id        = req.params.id;
                let status    = req.body.status;
                let stoken    = (req.cookies.hasOwnProperty(core.skey)) ? req.cookies[core.skey] : undefined;

                Parse.Cloud.run('comment_approve', {id: id}, {sessionToken: stoken}).then(() => {
                    res.json({status: 'OK'});
                }).catch((err) => {
                    res.json({status: 'ERROR', message: err.message});
                });
            }
        } else {
            res.render(core.template.theme + '/templates/404', jam);
        }
    }
};

exports.delete = function (req, res) {
    if (!core.perm_check(permissions)) {
        jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', jam);
    }  else {
        if (!_.isEmpty(req.params['id'])) {
            let comment = new Parse.Object('Comment');
            comment.set('objectId', req.params.id);
            comment.destroy().then(() => {
                res.json({status: 'OK'});
            }).catch((err) => {
                res.json({status: 'ERROR', message: err.message});
            });
        } else {
            res.render(core.template.theme + '/templates/404', jam);
        }
    }
};
