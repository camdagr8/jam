/**
 * Route middle-ware
 */
const fs = require('fs-extra');

/**
 * 0.0 - Pre-defined routes needed for the admin interface.
 */
let routes = [
    {
        "method"        : "all",
        "route"         : ["/uninstall"],
        "controller"    : "/_core/_install/uninstaller.js"
    },
    {
        "route"         : ["/admin", "/dashboard"],
        "controller"    : "/_core/controller/dashboard.js"
    },
    {
        "route"         : ["/signin", "/login"],
        "controller"    : "/_core/controller/login.js"
    },
    {
        "route"         : ["/signout", "/logout"],
        "controller"    : "/_core/controller/logout.js"
    },
    {
        "route"         : ["/admin/purge/:type"],
        "controller"    : "/_core/controller/purge.js"
    },
    {
        "route"         : ["/cdn/:file"],
        "controller"    : "/_core/controller/cdn.js"
    }
];

/**
 * 1.0 - User defined routes
 * Note: All pre-defined routes terminate and do NOT call the next()
 * function to ensure that they are not overwritten.
 */
const user_routes = require(appdir + '/model/routes.json');

// 1.1 - Append user routes to the reserved routes
user_routes.forEach((r) => {
    routes.push(r);
});


/*
 * ----------------------------------------------------------------------------
 * END middle-ware
 * ----------------------------------------------------------------------------
 */


/**
 *
 * routes(req, res, next)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Applies the `routes` array to the app.
 */
module.exports = (req, res, next) => {
    if (req.path === '/install' && req.method === 'POST') {
        res.json({status: 'OK'});
        return;
    }

    // Get plugin routes and add them to the routes array
    let rdirs = [
        appdir + '/_core/plugin',
        appdir + '/plugin'
    ];
    core.find_file(rdirs, 'routes.json').forEach((file) => {
        let plugin_dir = file.split('/routes.json').shift().split(appdir).pop();

        require(file).forEach((item) => {
            // swap the [plugin_dir] str with the plugin_dir value
            if (item.hasOwnProperty('controller')) {
                item.controller = item.controller.replace(/\[plugin_dir]/gi, plugin_dir);
            }

            routes.push(item);
        });
    });

    // Add the cms route '*'
    routes.push({
        route         : ['*'],
        controller    : '/_core/controller/cms.js'
    });

    // Type of http request methods to handle
    let methods = ['use', 'all', 'get', 'post', 'put', 'delete'];

    routes.forEach((item) => {
        let c = item.controller;
        c     = (c.substr(0, 1) !== '/') ? '/' + c : c;
        c     = appdir + c;

        let cntr = require(c);

        if (item.hasOwnProperty('method') && item.hasOwnProperty('func')) {
            app[item.method](item.route, cntr[item.func]);
        } else {
            methods.forEach((method) => {
                if (typeof cntr[method] === 'function') {
                    app[method](item.route, cntr[method]);
                }
            });
        }
    });

    next();
};
