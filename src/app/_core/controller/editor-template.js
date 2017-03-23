/**
 * -----------------------------------------------------------------------------
 * Imports
 * -----------------------------------------------------------------------------
 */
const _ = require('underscore');

/**
 * -----------------------------------------------------------------------------
 * Functions
 * -----------------------------------------------------------------------------
 */
const template_save = (req, res) => {
    let nonce = req.body.nonce;
    let output = {data: null, nonce: null};

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {

        delete req.body.nonce;
        return Parse.Cloud.run('template_post', req.body);

    }, (err) => {

        res.json({error: err});

    }).then((result) => {

        output.data = result.toJSON();
        return Parse.Cloud.run('nonce_create');

    }, (err) => {

        res.json({error: err});

    }).then((nonce) => {

        output.nonce = nonce;
        res.json(output);

    }, (err) => {
        res.json({error: err});
    });
};


/**
 * -----------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------
 */
exports.use = (req, res, next) => {
    jam['rec'] = {};

    // Get template rec if :id specified in url
    if (req.params['id']) {
        Parse.Cloud.run('template_get', {objectId: req.params.id}).then((result) => {
            jam['rec'] = (result) ? result.toJSON() : jam.rec;
            next();
        }, () => {
            res.render('themes/' + jam.theme + '/templates/404');
        });
    } else {
        next();
    }
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

exports.post    = template_save;
exports.put     = template_save;
