
const recent = (count = 5) => {
	let p = jam.pages.slice(0, count);
	p = _.sortBy(p, 'updatedAt');
	return p;
};


module.exports = {
	id: 'sidebar-pages',

	index: 0,

	perms: ['administrator', 'publisher', 'moderator'],

	sections: ['all'],

	zone: 'sidebar',

	recent: recent()
};
