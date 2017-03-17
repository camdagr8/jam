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

	Parse.Cloud.run('config_get').then((result) => { // Get Config objects

		let url = req.url.split('/');
			url.shift();

		jam = result;
		jam['baseurl'] 		= req.protocol + '://' + req.get('host');
		jam['blocks'] 		= [];
		jam['currentuser'] 	= null;
		jam['helpers'] 		= [];
		jam['pages'] 		= [];
		jam['plugin'] 		= {};
		jam['plugins'] 		= [];
		jam['sidebar'] 		= [];
		jam['url'] 			= url;
		jam['users'] 		= [];
		jam['widgets'] 		= [];


	}, (err) => { // Not able to get the configs

		res.status(400).send(err.message);

	}).then(() => { // Get the current user from session token

		let stoken = (req.cookies.hasOwnProperty(core.skey)) ? req.cookies[core.skey] : null;
		return (stoken) ? Parse.Cloud.run('user_session_get', {token: stoken}) : null;

	}).then((user) => { // Set the currentuser value: Parse.User || null

		jam.currentuser = user;

	}, (err) => { // No current user: Keep going

		log(err);

	}).then(() => {

		return Parse.Cloud.run('content_get_pages');

	}).then((pages) => {

		jam['pages'] = pages;

	}, (err) => {

		log(err);

	}).then(() => {

		// Core helpers & plugins
		jam['helpers'] 	= core.plugins(appdir + '/_core/helper', true);
		jam['plugins'] 	= core.plugins(appdir + '/_core/plugin');

		// User helpers & plugins
		jam['helpers'] 	= jam.helpers.concat(core.plugins(appdir + '/helper', true));
		jam['plugins'] 	= jam.plugins.concat(core.plugins(appdir + '/plugin'));


	}).then(() => { // Done!

		next();

	});
};
