const permissions    = require('./perms.json');

module.exports = {
    id: 'comments',

    index: 2,

    perms: permissions.list,

    sections: ['all'],

    type: 'widget',

    zone: 'sidebar'
};
