const moment = require('moment');

const recent = (count = 5) => {
    let output    = [];
    let now       = moment();
    let p         = _.clone(jam.pages);
    let w         = _.where(p, {status: 'delete'});
    p             = _.difference(p, w).slice(0, count);

    p.forEach((page) => {

        let date = moment(page.updatedAt);

        let diff = now.diff(date, 'days');
        if (diff <= 7) {
            output.push(page);
        }
    });

    return output;
};


module.exports = {
    id: 'sidebar-pages',

    index: 0,

    perms: ['administrator', 'publisher', 'moderator'],

    sections: ['all'],

    use_admin: (req, res, next) => {
        jam.plugin['sidebar_pages']['recent'] = recent(3);
        next();
    },
    
    zone: 'sidebar',

    recent: []
};
