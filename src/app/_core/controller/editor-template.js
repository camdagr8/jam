/**
 * Imports
 */
const _ = require('underscore');

// Register widgets
exports.use = (req, res, next) => {
	jam['rec'] = {};
	next();
};

exports.get = (req, res) => {
	jam['content'] = './sections/editor-template';

	// Get nonce
	Parse.Cloud.run('nonce_create').then((result) => {

		jam['nonce'] = result;
		res.render(appdir + '/_core/view/admin/admin', jam);

	}, (err) => {

		jam['err'] = {code: 400, message: 'Bad Request'};
		res.status(jam.err.code).render('themes/' + jam.theme + '/templates/404', jam);

	});
};

exports.post = (req, res) => {
    req.body['objectId'] = 'test';
    res.json({data: req.body});
};
