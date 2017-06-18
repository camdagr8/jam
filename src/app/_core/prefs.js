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
    //log('prefs');

    let url = req.url.split('/');
    url.shift();

    jam['baseurl']           = req.protocol + '://' + req.get('host');
    jam['theme']             = 'default';
    jam['blocks']            = [];
    jam['currentuser']       = null;
    jam['helpers']           = [];
    jam['is']                = {};
    jam['req']               = req;

    jam['meta_types']        = [
        {name: 'HTML',          value: 'HTML'},
        {name: 'Plain Text',    value: 'TEXT', checked: true},
        {name: 'Number',        value: 'NUMBER'},
        {name: 'Object',        value: 'OBJECT'},
        {name: 'Array',         value: 'ARRAY'},
        {name: 'Checkbox',      value: 'CHECKBOX'},
        {name: 'Radio',         value: 'RADIO'},
        {name: 'Upload',        value: 'UPLOAD'}
    ];
    jam['pages']             = [];
    jam['plugin']            = {};
    jam['plugins']           = [];
    jam['posts']             = [];
    jam['sidebar']           = [];
    jam['url']               = url;
    jam['users']             = [];
    jam['widgets']           = [];
    jam['template_files']    = [];
    jam['templates']         = [];
    jam['dashboards']        = [];

    // jam.is.admin boolean
    let base_urls = ['admin', 'dashboard'];
    jam['is']['admin']  = (base_urls.indexOf(url[0]) > -1);

    // Sort metabox types
    jam['meta_types'] = _.sortBy(jam.meta_types, 'name');

    // Start the process
    let prm = Parse.Promise.when(Parse.Cloud.run('config_get'));
    prm.then((result) => { // Get Config objects

        let keys = _.keys(result);
        keys.forEach((key) => { jam[key] = result[key]; });

        core.template.theme = `${appdir}/view/themes/${jam.theme}`;

    }, (err) => { // Not able to get the configs

        log(__filename);
        log(err.message);
        jam['installed'] = false;
        prm.reject();

    }).then(() => { // Get the current user from session token

        let stoken = (req.cookies.hasOwnProperty(core.skey)) ? req.cookies[core.skey] : null;
        return (stoken) ? Parse.Cloud.run('user_session_get', {token: stoken}) : null;

    }).then((user) => { // Set the currentuser value: Parse.User || null

        jam['currentuser'] = user;

    }, (err) => { // No current user: Keep going
        log(__filename);
        log(err.message);

    }).then(() => { // Get helpers and plugins

        // Core helpers & plugins
        jam['helpers'] = core.plugins(appdir + '/_core/helper', true);
        jam['plugins'] = core.plugins(appdir + '/_core/plugin');

        // User helpers & plugins
        jam['helpers'] = jam.helpers.concat(core.plugins(appdir + '/helper', true));
        jam['plugins'] = jam.plugins.concat(core.plugins(appdir + '/plugin'));

    }).always(() => {

        // register plugin `use` hooks
        let before = [];
        if (jam.is.admin === true) {
            _.keys(jam.plugin).forEach((name) => {
                let plugin = jam.plugin[name];
                if (plugin.hasOwnProperty('use')) {
                    before.push(plugin.use);
                }
            });
        }

        if (before.length > 0) {
            let cnt = before.length;
            let comp = 0;

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
