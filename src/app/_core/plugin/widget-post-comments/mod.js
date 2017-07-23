module.exports = {
    id          : 'widget-post-comments',

    index       : 1000000,

    perms       : ['all'],

    sections    : ['post-editor'],

    type        : 'widget',

    zone        : 'widgets',

    use         : (req, res, next) => {

        jam['comments'] = {
            list          : [],
            pagination    : {},
            waiting       : 0
        };

        let id     = req.url.split('/admin/post/').pop();
        id         = (id !== '/admin/post') ? id : undefined;

        if (req.url.indexOf('/admin/post/') >= 0 && id) {

            let opt    = {post: id, status: ['publish', 'wait']};

            Parse.Cloud.run('comment_list', opt).then((results) => {
                jam.comments.pagination = results.pagination;
                jam.comments.list       = results.list;

                opt['status'] = 'wait';
                opt['limit']  = 0;

                // Get waiting comments
                return Parse.Cloud.run('comment_list', opt);

            }).then((results) => {

                jam.comments.waiting = results.pagination.count;

            }).catch((err) => {

                log(__filename, err.message);

            }).always(next);

        } else {
            next();
        }
    }
};
