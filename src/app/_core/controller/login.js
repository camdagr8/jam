
exports.all = (req, res, next) => {
	if (req.jam['currentuser']) {
		res.redirect('/admin');
	} else {
		next();
	}
};


exports.get = (req, res) => {
	res.render(appdir + '/_core/view/admin/login', req);
};


exports.post = (req, res) => {

	Parse.User.logIn(req.body.username, req.body.password).then((user) => {
		res.cookie(core.skey, user.getSessionToken());
		res.redirect('/admin');
	}, (err) => {
		res.cookie('e', err.message);
		res.redirect('/login');
	});
};
