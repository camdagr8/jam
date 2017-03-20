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
		log(1);
		return Parse.Object.destroyAll(users, {useMasterKey: true});
	}).then(function () {
        log(2);
        let qry = new Parse.Query(Parse.Role);
        qry.limit(1000);
        return qry.find();
    }, (err) => {
	    log(2.1);
        log(err);
	}).then(function (roles) {
	    log(3);
		return Parse.Object.destroyAll(roles, {useMasterKey: true});
	}, (err) => {
	    log(3.1);
	    log(err);
    }).then(function () {
	    log(4);
		let qry = new Parse.Query('Config');
		qry.limit(1000);
		return qry.find();
	}).then(function (configs) {
	    log(5);
		return Parse.Object.destroyAll(configs, {useMasterKey: true});
	}).then(function () {
	    log(6);
		let qry = new Parse.Query('Content');
		qry.limit(1000);
		return qry.find();
	}).then(function (content) {
	    log(7);
		return Parse.Object.destroyAll(content, {useMasterKey: true});
	}).then(function () {
	    log(8);
		res.redirect('/install');
	});
};
