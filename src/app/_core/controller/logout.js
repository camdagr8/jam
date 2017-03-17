
exports.all = (req, res) => {
	res.clearCookie(core.skey);
	res.redirect('/');
};
