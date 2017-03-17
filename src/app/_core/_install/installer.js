const _ = require('underscore');

/**
 *
 * Installer middleware
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Determines if the site has been configured before displaying any views.
 * All traffic will divert to the /install route and display the install configs.
 */


/**
 *
 * install_get
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Renders the install.ejs file
 */
const install_get = (req, res) => {
	jam.title = "Jam Install";
	res.render(appdir + '/_core/view/admin/install', jam);
};


const install_post = (req, res, next) => {

	if (!req.body.hasOwnProperty('email') || !req.body.hasOwnProperty('password')) {
		res.redirect('/install');
		return;
	}

	// Create the user
	let admin = new Parse.User();
		admin.set('email', req.body.email);
		admin.set('username', req.body.email);
		admin.set('password', req.body.password);

	// Admin ACL & Role
	var adminACL = new Parse.ACL();
		adminACL.setPublicReadAccess(true);

	var adminRole = new Parse.Role('Administrator', adminACL);
		adminRole.set('level', 1000);

	// Sign up the admin user
	admin.signUp().then((user) => { // Admin Role create

		adminRole.getUsers().add(user);

		return adminRole.save();

	}).then((role) => { // Moderator ACL & Role

		let modACL = new Parse.ACL();
			modACL.setPublicReadAccess(true);

		let modRole = new Parse.Role('Moderator', modACL);
			modRole.set('level', 100);
			modRole.getRoles().add([adminRole]);

		return modRole.save();

	}).then((role) => { // Publisher ACL & Role

		let pubACL = new Parse.ACL();
			pubACL.setPublicReadAccess(true);

		let pubRole = new Parse.Role('Publisher', pubACL);
			pubRole.set('level', 50);
			pubRole.getRoles().add([adminRole, role]);

		return pubRole.save();

	}).then(() => { // Load the default Config objects

		let items = require(appdir + '/_core/model/Config.json');

		let objs = [];

		items.forEach((item) => {
			let obj = new Parse.Object('Config');
			let keys = _.keys(item);

			if (req.body.hasOwnProperty(item.key)) {
				item.value[item.key] = req.body[item.key];
			}

			keys.forEach((key) => { obj.set(key, item[key]); });

			objs.push(obj);
		});

		return Parse.Object.saveAll(objs);

	}).then(() => { // Load the default Content objects

		let items = require(appdir + '/_core/model/Content.json');

		let objs = [];

		items.forEach((item) => {
			let obj = new Parse.Object('Content');
			let keys = _.keys(item);

			keys.forEach((key) => {
				obj.set(key, item[key]);
			});

			objs.push(obj);
		});

		return Parse.Object.saveAll(objs);

	}).then((config) => {

		//res.json(config);
		res.redirect('/');

	});

};



/**
 * Exports
 */
module.exports = (req, res, next) => {

	if (req.path === '/install' && req.method === 'POST') {
		install_post(req, res, next);
		return;
	}

	// Check if the install config has been set
	if (jam.hasOwnProperty('installed')) {
		if (jam.installed === true) {
			next();
		} else {
			install_get(req, res);
		}
	} else {
		install_get(req, res);
	}

}
