const permissions   = ['administrator', 'publisher', 'moderator'];

exports.use = (req, res, next) => {
    /**
     * Permissions
     */
    if (!core.perm_check(permissions)) {
        jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', jam);
    }  else {
        let page = (req.params.hasOwnProperty('page')) ? Number(req.params.page) : 1;
        Parse.Cloud.run('content_get_posts', {page: page}).then((results) => {
            jam['posts'] = results;
        }).catch((err) => {
            log(__filename);
            log(err.message);
        }).always(next);
    }
};

exports.all = (req, res) => {
    let darr       = __dirname.split('/'); darr.pop();
    jam.content    = darr.join('/') + '/view/list.ejs';

    res.render(core.template.admin, jam);
};
