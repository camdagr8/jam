const Promise    = require('promise');

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

    req['jam']                   = (req.hasOwnProperty('jam')) ? req.jam : {};
    req.jam['sessionToken']      = (req.cookies[core.skey]) ? req.cookies[core.skey] : undefined;
    req.jam['baseurl']           = req.protocol + '://' + req.get('host');
    req.jam['theme']             = 'default';
    req.jam['currentuser']       = null;
    req.jam['url']               = url;
    req.jam['blocks']            = [];
    req.jam['helpers']           = [];
    req.jam['is']                = {};
    req.jam['config']            = {};

    req.jam['meta_types']    = [
        {name: 'HTML',          value: 'HTML'},
        {name: 'Plain Text',    value: 'TEXT', checked: true},
        {name: 'Number',        value: 'NUMBER'},
        {name: 'Object',        value: 'OBJECT'},
        {name: 'Array',         value: 'ARRAY'},
        {name: 'Checkbox',      value: 'CHECKBOX'},
        {name: 'Radio',         value: 'RADIO'},
        {name: 'Upload',        value: 'UPLOAD'}
    ];

    req.jam['pages']             = [];
    req.jam['plugin']            = {};
    req.jam['plugins']           = [];
    req.jam['posts']             = [];
    req.jam['sidebar']           = [];
    req.jam['users']             = [];
    req.jam['widgets']           = [];
    req.jam['template_files']    = [];
    req.jam['templates']         = [];
    req.jam['dashboards']        = [];

    // jam.is.admin boolean
    let base_urls = ['admin', 'dashboard'];
    req.jam['is']['admin']  = (base_urls.indexOf(url[0]) > -1);

    // Sort metabox types
    req.jam['meta_types'] = _.sortBy(req.jam.meta_types, 'name');

    // Start the process
    let prm = Parse.Promise.when(Parse.Cloud.run('config_get'));
    prm.then((result) => { // Get Config objects

        let keys = _.keys(result);
        keys.forEach((key) => { req.jam.config[key] = result[key]; });

        core.template.theme = `${appdir}/view/themes/${req.jam.config.theme}`;

    }, (err) => { // Not able to get the configs

        log(__filename);
        log(err.message);
        req.jam.config['installed'] = false;
        prm.reject();

    }).then(() => { // Get the current user from session token

        return (req.jam.sessionToken) ? Parse.Cloud.run('user_session_get', {token: req.jam.sessionToken}) : undefined;

    }).then((user) => { // Set the currentuser value: Parse.User || null

        req.jam['currentuser'] = user;

    }, (err) => { // No current user: Keep going
        log(__filename, ':82');
        log(err.message);

    }).then(() => { // Get helpers and plugins

        // Core helpers & plugins
        req.jam['helpers'] = core.plugins(appdir + '/_core/helper', req);
        req.jam['plugins'] = core.plugins(appdir + '/_core/plugin', req);

        // User helpers & plugins
        req.jam['helpers'] = req.jam.helpers.concat(core.plugins(appdir + '/helper', req));
        req.jam['plugins'] = req.jam.plugins.concat(core.plugins(appdir + '/plugin', req));

    }).always(() => {

        // register plugin `use` hooks
        let before = [];
        if (req.jam.is.admin === true) {
            _.keys(req.jam.plugin).forEach((name) => {
                let plugin = req.jam.plugin[name];
                if (plugin.hasOwnProperty('use')) {
                    before.push(plugin.use);
                }
            });
        }

        if (before.length > 0) {
            let cnt     = before.length;
            let comp    = 0;

            before.forEach((fnc) => {
                let prom = new Promise(function (resolve) {
                    fnc(req, res, resolve);
                });

                prom.finally(() => {
                    comp += 1;
                    if (comp === cnt) {
                        next();
                    }
                });
            });

        } else {
            next();
        }
    });
};
