const moment         = require('moment');
const permissions    = require('../perms.json');

const purge = (req, res) => {
    let nonce     = req.body.nonce;
    let output    = {data: null, nonce: null};

    Parse.Cloud.run('nonce_get', {id: nonce}).then(() => {
        delete req.body.nonce;
        return Parse.Cloud.run('content_purge', {type: 'post'}, {sessionToken: stoken});
    }).then((result) => {
        output.data = result;
        return Parse.Cloud.run('nonce_create');
    }).then((nonce) => {
        output.nonce = nonce;
    }).catch((err) => {
        output['error'] = err.message;
    }).always(() => {
        res.json(output);
    });

};

const status_color = (status) => {
    let color = 'gray-light';

    switch (status) {
        case 'publish':
            color = 'success';
            break;

        case 'publish-later':
            color = 'info';
            break;

        case 'draft':
            color = 'warning';
            break;

        case 'delete':
            color = 'danger';
            break;

    }

    return color;
};

exports.use = (req, res, next) => {
    /**
     * Permissions
     */
    if (!core.perm_check(permissions.list, jam.currentuser)) {
        jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', jam);
        return;
    }

    // Get nonce
    Parse.Cloud.run('nonce_create').then((result) => {
        // Get widgets
        core.add_widgets('post-list');

        // Set nonce value
        jam.nonce = result;

        next();

    }, (err) => {
        log(__filename, err);
        jam['err'] = {code: 400, message: 'Bad Request'};
        res.status(jam.err.code).render(core.template.theme + '/templates/404', jam);
    });

};

exports.delete = purge;

exports.all = (req, res) => {
    jam['posts'] = {
        list          : [],
        pagination    : {},
        query         : {}
    };

    jam['can_edit'] = core.perm_check(permissions.edit_others, jam.currentuser);

    let filtered    = 0;
    let params      = {};
    let darr       = __dirname.split('/'); darr.pop();
    jam.content    = darr.join('/') + '/view/list.ejs';

    _.keys(req.params).forEach((k) => {
        if (!_.isEmpty(req.params[k])) {
            params[k] = req.params[k];
        }
    });

    let page = params['page'] || 1;
    const opt = {
        limit      : 20,
        page       : Number(page),
        order      : 'descending',
        include    : ['creator']
    };

    if (params.hasOwnProperty('status')) {
        opt['status'] = (typeof params.status === 'string') ? [params.status] : params.status;
        filtered += 1;
    }

    if (req.query['user']) {
        opt['user'] = req.query.user;
        filtered += 1;
    }

    if (req.query['find']) {
        opt['find'] = req.query.find;
        filtered += 1;
    }

    if (req.query['sortby']) {
        opt['orderBy'] = req.query.sortby;
    }

    if (req.query['sort']) {
        opt['order'] = req.query.sort;
    }

    Parse.Cloud.run('content_get_posts', opt, {sessionToken: stoken}).then((results) => {
        jam.posts['pagination'] = results.pagination;

        let output = [];

        results.list.forEach((item) => {
            let d                   = moment(item.createdAt);
            item['date']            = d.format('MMM DD YYYY');
            item['author']          = item.creator.toJSON();
            item['op']              = Boolean(item.author.objectId === jam.currentuser.id);
            item['time']            = d.format('LT');
            item['status_color']    = status_color(item.status);
            item['meta']            = (item.hasOwnProperty('meta')) ? item.meta : {};

            output.push(item);
        });


        jam.posts['query']    = opt;
        jam.posts['list']     = output;
        jam.posts['filtered'] = filtered;

    }).catch((err) => {
        log(__filename, err.message);
    }).always(() => {
        res.render(core.template.admin, jam);
    });
};
