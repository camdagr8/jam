
/**
 *
 * Installer middleware
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Determines if the site has been configured before displaying any views.
 * All traffic will divert to the /install route and display the install configs.
 */


/**
 *
 * install_get
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Renders the install.ejs file
 */
const install_get = (req, res) => {
    jam.title = "Jam Install";
    res.render(appdir + '/_core/view/admin/install', jam);
};


const install_post = (req, res, next) => {

    if (!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
        res.status(500).json({error: 101, message: 'invalid '});
        return;
    }

    // Create the user
    let admin = new Parse.User();
    admin.set('email', req.body.username);
    admin.set('username', req.body.username);
    admin.set('password', req.body.password);

    // Admin ACL & Role
    let adminACL = new Parse.ACL();
    adminACL.setPublicReadAccess(true);

    let adminRole = new Parse.Role('Administrator', adminACL);
    adminRole.set('level', 1000);

    // Sign up the admin user
    admin.signUp().then((user) => { // Admin Role create

        adminRole.getUsers().add(user);

        return adminRole.save();

    }, (err) => {
        res.status(500).json(err);

    }).then(() => { // Moderator ACL & Role

        let modACL = new Parse.ACL();
        modACL.setPublicReadAccess(true);

        let modRole = new Parse.Role('Moderator', modACL);
        modRole.set('level', 100);
        modRole.getRoles().add([adminRole]);

        return modRole.save();
    }, (err) => {

        res.status(500).json(err);

    }).then((role) => { // Publisher ACL & Role

        let pubACL = new Parse.ACL();
        pubACL.setPublicReadAccess(true);

        let pubRole = new Parse.Role('Publisher', pubACL);
        pubRole.set('level', 50);
        pubRole.getRoles().add([adminRole, role]);

        return pubRole.save();
    }, (err) => {

        res.status(500).json(err);

    }).then(() => { // Load the default Config objects

        let items = require(appdir + '/_core/model/Config.json');

        let objs = [];

        items.forEach((item) => {
            let obj  = new Parse.Object('Config');
            let keys = _.keys(item);

            if (req.body.hasOwnProperty(item.key)) {
                item.value[item.key] = req.body[item.key];
            }

            keys.forEach((key) => {
                obj.set(key, item[key]);
            });

            objs.push(obj);
        });

        return Parse.Object.saveAll(objs);

    }, (err) => {

        res.status(500).json(err);

    }).then(() => { // Load the default Content objects

        let items = require(appdir + '/_core/model/Content.json');

        let objs = [];

        items.forEach((item) => {
            let obj  = new Parse.Object('Content');
            let keys = _.keys(item);

            keys.forEach((key) => {
                obj.set(key, item[key]);
            });

            objs.push(obj);
        });

        return Parse.Object.saveAll(objs);

    }, (err) => {

        res.status(500).json(err);

    }).then(() => {
        next();
    });

};


/**
 * Exports
 */
module.exports = (req, res, next) => {
    if (jam['installed'] === true) {
        next();
    } else {
        if (req.method === 'POST') {
            log('INSTALL POST');
            install_post(req, res, next);
            //res.json(req.body);
        } else {
            // Check if the install config has been set
            if (jam['installed'] === true) {
                next();
            } else {
                log('INSTALL GET');
                install_get(req, res);
            }
        }
    }
};
