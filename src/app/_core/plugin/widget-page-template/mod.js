const _ = require('underscore');


app.use((req, res, next) => {
	jam['template'] = (_.isArray(jam['template'])) ? jam['template'] : [];
	next();
});


/**
 * -----------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------
 */
module.exports = {
	id: 'page-template',

	index: 0,

	perms: ['all'],

	sections: ['page-editor'],

	zone: 'widgets'
};
