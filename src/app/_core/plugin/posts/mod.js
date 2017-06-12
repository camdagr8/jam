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

    perms: ['administrator', 'publisher', 'moderator'],

    sections: ['all'],

    use: (req, res, next) => {
        if (jam.is.admin) {
            jam.plugin['posts']['recent'] = recent(3);
        }
        next();
    },

    type: 'plugin',

    zone: 'sidebar',

    recent: []
};
