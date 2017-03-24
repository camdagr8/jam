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

    jam['baseurl']           = req.protocol + '://' + req.get('host');
    jam['theme']             = 'default';
    jam['blocks']            = [];
    jam['currentuser']       = null;
    jam['helpers']           = [];
    jam['is']                = {};
    jam['meta_types']        = [
        {name: 'HTML',          value: 'HTML'},
        {name: 'Plain Text',    value: 'TEXT'},
        {name: 'Number',        value: 'NUMBER'},
        {name: 'Object',        value: 'OBJECT'},
        {name: 'Array',         value: 'ARRAY'}
    ];
    jam['pages']             = [];
    jam['plugin']            = {};
    jam['plugins']           = [];
    jam['sidebar']           = [];
    jam['url']               = url;
    jam['users']             = [];
    jam['widgets']           = [];
    jam['template_files']    = [];
    jam['templates']         = [];



    // jam.is.admin boolean
    let base_urls = ['admin', 'dashboard'];
    jam['is']['admin']  = (base_urls.indexOf(url[0]) > -1);

    // Start the process
    let prm = Parse.Promise.when(Parse.Cloud.run('config_get'));
    prm.then((result) => { // Get Config objects

        let keys = _.keys(result);
        keys.forEach((key) => { jam[key] = result[key]; });

    }, (err) => { // Not able to get the configs

        log(err);
        jam['installed'] = false;
        prm.reject();

    }).then(() => { // Get the current user from session token

        let stoken = (req.cookies.hasOwnProperty(core.skey)) ? req.cookies[core.skey] : null;
        return (stoken) ? Parse.Cloud.run('user_session_get', {token: stoken}) : null;

    }).then((user) => { // Set the currentuser value: Parse.User || null

        jam['currentuser'] = user;

    }, (err) => { // No current user: Keep going

        log(err);

    }).then(() => { // Get Content/Pages

        return Parse.Cloud.run('content_get_pages');

    }).then((pages) => { // Get Content/Pages success

        jam['pages'] = pages;

    }, (err) => { // Get Content/Pages error

        log(err);

    }).then(() => { // Get helpers and plugins

        // Core helpers & plugins
        jam['helpers'] = core.plugins(appdir + '/_core/helper', true);
        jam['plugins'] = core.plugins(appdir + '/_core/plugin');

        // User helpers & plugins
        jam['helpers'] = jam.helpers.concat(core.plugins(appdir + '/helper', true));
        jam['plugins'] = jam.plugins.concat(core.plugins(appdir + '/plugin'));

    }).then(() => { // Get template files

        return core.scan(`${appdir}/view/themes/${jam.theme}/templates/`);

    }).then((files) => { // Get template files success
        let path = `${appdir}/view/themes/${jam.theme}/templates/`;

        files.forEach((file) => {

            let obj = {
                file: file,
                name: core.ext_remove(file),
                path: path + file
            };

            jam['template_files'].push(obj);
        });

    }, (err) => { // Get template files error

        log(err);

    }).then(() => { // Get templates array

        return Parse.Cloud.run('template_get');

    }).then((templates) => {

        jam['templates'] = templates;

    }, (err) => {

        log(err);

    }).always(() => {

        next();

    });

};
