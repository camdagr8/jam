/**
 * Imports
 */
const lipsum = require('handlebars-lipsum');



/**
 * Exports
 */
module.exports = {
	id: 'lipsum',

	wysiwyg: '{{lipsum index=0 chars=300}}',

	helper: (opt) => {
		let index = opt.hash.index || 0;
		let chars = opt.hash.chars || 300;

		return lipsum(index, chars);
	}
}
