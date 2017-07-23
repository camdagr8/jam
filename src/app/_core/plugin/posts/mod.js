const permissions = require('./perms.json');
const moment = require('moment');

const recent = (count = 5) => {
    let output    = [];
    let now       = moment();
    let p         = _.clone(jam.posts);
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
        if (jam.is.admin) {
            Parse.Cloud.run('content_get_posts', {orderBy: 'updatedAt', order: 'decending', limit: 20})
            .then((results) => {
                jam.posts = results.list;
                jam.plugin['posts']['recent'] = recent(3);
                jam.plugin['posts']['pagination'] = results.pagination;
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
