/**
 * Route middle-ware
 */

/**
 * 0.0 - Pre-defined routes needed for the admin interface.
 */
const routes = [
	{
		"method" 		: "all",
		"route" 		: ["/uninstall"],
		"controller" 	: "/_core/_install/uninstaller.js"
	},
	{
		"method" 		: "use",
		"route" 		: ["/admin", "/dashboard"],
		"controller" 	: "/_core/controller/admin.js"
	},
	{
		"route" 		: ["/admin/page/:id", "/admin/page"],
		"controller" 	: "/_core/controller/editor-page.js"
	},
	{
		"route" 		: ["/admin/template/:id", "/admin/template"],
		"controller" 	: "/_core/controller/editor-template.js"
	},
    {
        "route"         : ["/admin/templates"],
        "controller"    : "/_core/controller/list-templates.js"
    },
    {
        "route"         : ["/admin/pages"],
        "controller"    : "/_core/controller/list-pages.js"
    },
    {
        "route"         : ["/admin/users"],
        "controller"    : "/_core/controller/list-users.js"
    },
	{
		"route" 		: ["/signin", "/login"],
		"controller" 	: "/_core/controller/login.js"
	},
	{
		"route" 		: ["/signout", "/logout"],
		"controller" 	: "/_core/controller/logout.js"
	},
	{
		"method" 		: "all",
		"route" 		: ["/admin", "/dashboard"],
		"controller" 	: "/_core/controller/admin.js"
	}
];

/**
 * 1.0 - User defined routes
 * Note: All pre-defined routes terminate and do NOT call the next()
 * function to ensure that they are not overwritten.
 */
const user_routes = require(appdir + '/model/routes.json');

// 1.1 - Append user routes to the reserved routes
user_routes.forEach((r) => { routes.push(r); });


/**
 * 2.0 - Catch all route
 * Note: this MUST be the last route.
 */
const default_route = {
	route 		: ['*'],
	controller 	: '/_core/controller/cms.js'
};
// 2.1 - Append the catch all route.
routes.push(default_route);




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

	// Type of http request methods to handle
	let methods = ['use', 'all', 'get', 'post', 'put', 'delete'];

	routes.forEach((item) => {
		let c = item.controller;
			c = (c.substr(0, 1) !== '/') ? '/'+c : c;
			c = appdir + c;

		let cntr = require(c);

		if (typeof item['method'] === 'string' && typeof item['func'] === 'string') {
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
