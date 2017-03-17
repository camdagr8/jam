/**
 * Imports
 */
const _ = require('underscore');
const moment = require('moment');

// Register widgets
exports.use = (req, res, next) => {
	jam['rec'] = {};


	// Get page data if :id specified in url
	if (req.params['id']) {
		jam.rec = _.findWhere(jam.template, {objectId: req.params.id});
	}


	// Get template files
	jam['templates'] = [];
	core.scan(`${appdir}/view/themes/${jam.theme}/templates/`).then((files) => {
		files.forEach((file) => { jam.templates.push(core.ext_remove(file)); });
		next();
	}, (err) => {
		next();
	});

};

exports.get = (req, res) => {
	jam.content = './sections/editor-template';

	// Get nonce
	Parse.Cloud.run('nonce_create').then((result) => {

		jam.nonce = result;
		res.render(appdir + '/_core/view/admin/admin', jam);

	}, (err) => {

		log(err);
		res.render(appdir + '/_core/view/admin/admin', jam);

	});
};
