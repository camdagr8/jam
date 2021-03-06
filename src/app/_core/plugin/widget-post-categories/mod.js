module.exports = {
    id          : 'widget-post-categories',

    index       : 1000000,

    perms       : ['all'],

    sections    : ['post-editor'],

    type        : 'widget',

    zone        : 'widgets',

    use         : (req, res, next) => {

        req.jam['categories'] = {
            list          : [],
            selected      : [],
            pagination    : {}
        };

        let id;
        let limit = 10;

        if (req.url.indexOf('/admin/post/') > -1) {
            id = req.url.split('/post/').pop();
            id = (id !== '/admin/post') ? id : undefined;
        }

        if (id) {

            // Get the rec
            let qry = new Parse.Query('Content');
            qry.get(id).then((rec) => {

                rec = rec.toJSON();
                rec['category'] = (rec.hasOwnProperty('category')) ? rec.category : [];

                req.jam['rec'] = rec;

                return Parse.Cloud.run('category_list', {containedIn: rec.category, limit: rec.category.length});

            }).then((cats) => {

                req.jam.categories.selected = cats.list;
                return Parse.Cloud.run('category_list', {limit: limit});

            }).then((cats) => {

                req.jam.categories.list          = cats.list;
                req.jam.categories.pagination    = cats.pagination;

            }).catch((err) => {

                log(__filename);
                log(err.message);

            }).always(next);

        } else {

            Parse.Cloud.run('category_list', {limit: limit}).then((cats) => {

                req.jam.categories.selected      = [];
                req.jam.categories.list          = cats.list;
                req.jam.categories.pagination    = cats.pagination;

            }).catch((err) => {

                log(__filename);
                log(err.message);

            }).always(next);

        }

    }
};
