const permissions = require('./perms.json');
const moment = require('moment');

const recent = (req, count = 5) => {
    let output    = [];
    let now       = moment();
    let p         = _.clone(req.jam.posts);
    let w         = _.where(p, {status: 'delete'});
    p             = _.difference(p, w).slice(0, count);

    p.forEach((post) => {

        let date = moment(post.updatedAt);

        let diff = now.diff(date, 'days');
        if (diff <= 7) {
            output.push(post);
        }
    });

    return output;
};

module.exports = {
    id: 'posts',

    index: 1,

    perms: permissions.list,

    sections: ['all'],

    use: (req, res, next) => {
        if (req.jam.is.admin) {
            Parse.Cloud.run('content_get_posts', {orderBy: 'updatedAt', order: 'decending', limit: 20})
            .then((results) => {
                req.jam.posts = results.list;
                req.jam.plugin['posts']['recent'] = recent(req, 3);
                req.jam.plugin['posts']['pagination'] = results.pagination;
            })
            .always(next);
        } else {
            next();
        }
    },

    type: 'plugin',

    zone: 'sidebar',

    recent: []
};
