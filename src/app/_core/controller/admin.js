/**
 * TODO:
 * ---------------------------------------------------------------------------
 * Middle-ware to secure /admin routes (checks for parse user and perms).
 * ---------------------------------------------------------------------------
 */
exports.use = (req, res, next) => {
	if (!jam.currentuser) {
		res.redirect('/login');
	} else {
		// Get widget
		core.add_widgets('all');

		Parse.Cloud.run('users_get').then((users) => {
			jam.users = users;
			next();
		}, (err) => {
			next();
		});
	}
};



/**
 * /admin & /dashboard handler
 */
exports.all = (req, res) => {
	jam.content = './sections/dashboard';
	res.render(core.template.admin, jam);
};
