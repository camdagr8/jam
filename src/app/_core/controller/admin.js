/**
 * ---------------------------------------------------------------------------
 * Middle-ware to secure /admin routes (checks for parse user and perms).
 * ---------------------------------------------------------------------------
 */
module.exports = (req, res, next) => {
	if (!req.jam.currentuser) {
		res.redirect('/login');
	} else {
		// Get widgets
		core.add_widgets('all', req);

		Parse.Cloud.run('users_get').then((users) => {

            req.jam.users = users;

        }, (err) => { // Get Content/Pages error
            log(__filename);
            log(err.message);

        }).then(() => { // Get template files

            return core.scan(`${appdir}/view/themes/${req.jam.theme}/templates/`);

        }).then((files) => { // Get template files success
            let path = `${appdir}/view/themes/${req.jam.theme}/templates/`;

            files.forEach((file) => {

                let obj = {
                    file: file,
                    name: core.ext_remove(file),
                    path: path + file
                };

                req.jam['template_files'].push(obj);
            });

        }, (err) => { // Get template files error
            log(__filename);
            log(err.message);

        }).then(() => { // Get templates array

            return Parse.Cloud.run('template_get');

        }).then((templates) => {

            req.jam['templates'] = templates;

        }, (err) => {
            log(__filename);
            log(err.message);

        }).then(() => {

            next();

        });
	}
};
