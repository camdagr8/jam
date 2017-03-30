const recent = (count = 5) => {
	return jam.users.slice(0, count);
};


module.exports = {
	id: 'sidebar-users',

	index: 2,

	perms: ['administrator'],

	sections: ['all'],

	zone: 'sidebar',

	recent: recent()
};
