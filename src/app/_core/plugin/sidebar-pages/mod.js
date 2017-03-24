const recent = (count = 5) => {
	let output = [];

	let p = jam.pages.slice(0, count);

	p.forEach((item) => {
		item = item.toJSON();
		item['edit_url'] = jam.baseurl + '/admin/page/' + item.objectId;
		output.push(item);
	});

	return output;
};


module.exports = {
	id: 'sidebar-pages',

	index: 0,

	perms: ['administrator', 'publisher', 'moderator'],

	sections: ['all'],

	zone: 'sidebar',

	recent: recent()
};
