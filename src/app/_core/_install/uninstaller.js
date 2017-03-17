/**
 *
 * install_delete
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Clears the databases so that the site can be reinstalled
 */
exports.all = (req, res) => {

	let qry = new Parse.Query(Parse.User);
	qry.find().then(function (users) {
		return Parse.Object.destroyAll(users, {useMasterKey: true});
	}).then(function () {
		let qry = new Parse.Query(Parse.Role);
		qry.limit(1000);
		return qry.find();
	}).then(function (roles) {
		return Parse.Object.destroyAll(roles, {useMasterKey: true});
	}).then(function () {
		let qry = new Parse.Query('Config');
		qry.limit(1000);
		return qry.find();
	}).then(function (configs) {
		return Parse.Object.destroyAll(configs, {useMasterKey: true});
	}).then(function () {
		let qry = new Parse.Query('Content');
		qry.limit(1000);
		return qry.find();
	}).then(function (content) {
		return Parse.Object.destroyAll(content, {useMasterKey: true});
	}).then(function () {
		res.redirect('/');
	});
};
