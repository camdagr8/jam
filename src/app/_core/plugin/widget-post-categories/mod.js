module.exports = {
    id          : 'widget-post-categories',

    index       : 1000000,

    perms       : ['all'],

    sections    : ['post-editor'],

    type        : 'widget',

    zone        : 'widgets',

    use         : (req, res, next) => {

        jam['categories'] = {
            list          : [],
            selected      : [],
            pagination    : {}
        };

        let id;
        let limit = 2;

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

                jam['rec'] = rec;

                return Parse.Cloud.run('category_list', {containedIn: rec.category, limit: rec.category.length});

            }).then((cats) => {

                jam.categories.selected = cats.list;
                return Parse.Cloud.run('category_list', {limit: limit});

            }).then((cats) => {

                jam.categories.list          = cats.list;
                jam.categories.pagination    = cats.pagination;

            }).catch((err) => {

                log(__filename);
                log(err.message);

            }).always(next);

        } else {

            Parse.Cloud.run('category_list', {limit: limit}).then((cats) => {

                jam.categories.selected      = [];
                jam.categories.list          = cats.list;
                jam.categories.pagination    = cats.pagination;

            }).catch((err) => {

                log(__filename);
                log(err.message);

            }).always(next);

        }

    }
};
