module.exports = {
    id: 'widget-post-categories',

    index: 1000000,

    perms: ['all'],

    sections: ['post-editor'],

    type: 'widget',

    zone: 'widgets',

    use: (req, res, next) => {
        jam['categories'] = {
            categories    : [],
            pagination    : {}
        };

        if (req.params.hasOwnProperty("id")) {
            log('got ID');
        }

        Parse.Cloud.run('category_list').then((result) => {
            jam['categories'] = result;
        }).catch((err) => {
            log(err.message);
        }).always(next);

    }
};
