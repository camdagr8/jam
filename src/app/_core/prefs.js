const _ = require('underscore');

/**
 *
 * prefs module
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Retrieves configuration variables, preferences, and other necessary data.
 */
module.exports = (req, res, next) => {


    let url = req.url.split('/');
    url.shift();

    jam                = {};
    jam['baseurl']     = req.protocol + '://' + req.get('host');
    jam['theme']       = 'default';
    jam['blocks']      = [];
    jam['currentuser'] = null;
    jam['helpers']     = [];
    jam['pages']       = [];
    jam['plugin']      = {};
    jam['plugins']     = [];
    jam['sidebar']     = [];
    jam['url']         = url;
    jam['users']       = [];
    jam['widgets']     = [];

    Parse.Cloud.run('config_get').then((result) => { // Get Config objects
        log('config_get');
        let keys = _.keys(result);
        keys.forEach((key) => { jam[key] = result[key]; });

    }, (err) => { // Not able to get the configs
        log('no configs');

        jam.installed = false;
        next();

    }).then(() => { // Get the current user from session token
        log('get current user from session');
        let stoken = (req.cookies.hasOwnProperty(core.skey)) ? req.cookies[core.skey] : null;
        return (stoken) ? Parse.Cloud.run('user_session_get', {token: stoken}) : null;

    }).then((user) => { // Set the currentuser value: Parse.User || null
        log('set current user');
        jam.currentuser = user;

    }, (err) => { // No current user: Keep going
        log(err);

    }).then(() => {
        log('content_get_pages');
        return Parse.Cloud.run('content_get_pages');

    }).then((pages) => {
        log('got pages');
        jam['pages'] = pages;

    }, (err) => {

        log(err);

    }).then(() => {

        log('helpers');
        // Core helpers & plugins
        jam['helpers'] = core.plugins(appdir + '/_core/helper', true);
        jam['plugins'] = core.plugins(appdir + '/_core/plugin');

        // User helpers & plugins
        jam['helpers'] = jam.helpers.concat(core.plugins(appdir + '/helper', true));
        jam['plugins'] = jam.plugins.concat(core.plugins(appdir + '/plugin'));

    }).then(() => { // Done!
        log(jam);
        next();
    });
};
