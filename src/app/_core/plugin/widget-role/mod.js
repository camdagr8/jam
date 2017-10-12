
module.exports = {
    id: 'widget-role',

    index: 0,

    perms: ['administrator'],

    roles: [],

    sections: ['user-editor'],

    type: 'widget',

    use: (req, res, next) => {
        req.jam['roles'] = [];

        let qry = new Parse.Query(Parse.Role);
        qry.limit(1000);
        qry.find().then((results) => {
            results.forEach((item) => { req.jam.roles.push(item.toJSON()); });
            req.jam.roles = _.sortBy(req.jam.roles, 'level');
            next();
        }, (err) => {
            log(__filename);
            log(err);
            next();
        });
    },

    zone: 'widgets'
};
