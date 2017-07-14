module.exports = {
    id: 'settings',

    index: 2000000,

    perms: ['administrator'],

    sections: ['all'],

    zone: 'sidebar',

    use: (req, res, next) => {
        if (jam.is.admin) {
            next();
        } else {
            next();
        }
    }
};
