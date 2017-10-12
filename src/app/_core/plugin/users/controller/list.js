const permissions   = ['administrator'];

exports.use = (req, res, next) => {
    /**
     * Permissions
     */
    if (!core.perm_check(permissions, req.jam.currentuser)) {
        req.jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', req);
    }  else {
        next();
    }
};

exports.all = (req, res) => {
    let darr       = __dirname.split('/'); darr.pop();
    req.jam.content    = darr.join('/') + '/view/list.ejs';

    res.render(core.template.admin, req);
};
