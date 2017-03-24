const permissions   = ['administrator'];

exports.use = (req, res, next) => {
    /**
     * Permissions
     */
    if (!core.perm_check(permissions)) {
        jam['err'] = {code: '403', message: 'Forbidden'};
        res.render('themes/' + jam['theme'] + '/templates/404', jam);
    }  else {
        next();
    }
};

exports.all = (req, res) => {
    jam.content = './sections/list-templates';

    res.render(appdir + '/_core/view/admin/admin', jam);
};
