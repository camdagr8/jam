const permissions    = ['administrator', 'publisher', 'moderator'];


/**
 * -----------------------------------------------------------------------------
 * Functions
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
    core.add_widgets('dashboard');

    next();

};
exports.all = (req, res) => {
    jam.content = './sections/dashboard';
    res.render(core.template.admin, jam);
};
