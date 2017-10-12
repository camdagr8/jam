const permissions    = ['administrator', 'publisher', 'moderator'];


/**
 * -----------------------------------------------------------------------------
 * Functions
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
    core.add_widgets('dashboard', req);

    next();

};
exports.all = (req, res) => {
    req.jam.content = './sections/dashboard';
    res.render(core.template.admin, req);
};
