const recent = (count = 5) => {
	let output = [];

	let p = jam.users.slice(0, count);

	p.forEach((item) => {
		item = item.toJSON();
		item['edit_url'] = jam.baseurl + '/admin/user/' + item.objectId;
		output.push(item);
	});

	return output;
};


module.exports = {
	id: 'sidebar-users',

	index: 2,

	perms: ['administrator'],

	sections: ['all'],

	zone: 'sidebar',

	recent: recent()
};
