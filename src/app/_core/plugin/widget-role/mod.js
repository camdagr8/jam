
module.exports = {
    id: 'widget-role',

    index: 0,

    perms: ['administrator'],



    roles: [],

    sections: ['user-editor'],

    type: 'widget',

    use: (req, res, next) => {
        jam['roles'] = [];

        let qry = new Parse.Query(Parse.Role);
        qry.limit(1000);
        qry.find().then((results) => {
            results.forEach((item) => { jam.roles.push(item.toJSON()); });
            jam.roles = _.sortBy(jam.roles, 'level');
            next();
        }, (err) => {
            log(err);
            next();
        });
    },

    zone: 'widgets'
};
