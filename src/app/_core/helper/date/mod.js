/**
 * Imports
 */
const moment = require('moment');



/**
 * Exports
 */
module.exports = {
	id: 'date',

	wysiwyg: '{{date format="mm/dd/YYYY"}}',

	helper: (opt) => {
		let format 	= (!opt.hash.hasOwnProperty('format')) 	? 'L' 			: opt.hash.format;
		let date 	= (!opt.hash.hasOwnProperty('date')) 	? new Date() 	: new Date(opt.hash.date);
		return moment(date).format(format);
	}
};
