module.exports = {
    id: 'widget-post-categories',

    index: 1000000,

    perms: ['all'],

    sections: ['post-editor'],

    type: 'widget',

    zone: 'widgets',

    use: (req, res, next) => {

        jam['categories'] = {
            list          : [],
            pagination    : {}
        };

        let id;

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

                return Parse.Cloud.run('category_list', {containedIn: jam.rec.category, limit: 1000});

            }).then((cats) => {

                jam.categories.list = jam.categories.list.concat(cats.list);
                return Parse.Cloud.run('category_list', {notContainedIn: jam.rec.category});

            }).then((cats) => {

                jam.categories.list = jam.categories.list.concat(cats.list);

            }).catch((err) => {

                log(__filename);
                log(err.message);

            }).always(next);

        } else {

            Parse.Cloud.run('category_list').then((result) => {
                jam['categories'] = result;
            }).catch((err) => {
                log(__filename);
                log(err.message);
            }).always(next);

        }

    }
};
