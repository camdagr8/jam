const moment         = require('moment');
const permissions    = require('../perms.json');

const status_color = (status) => {
    let color = 'gray';

    switch (status) {
        case 'publish':
            color = 'success';
            break;

        case 'wait':
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
    if (!core.perm_check(permissions.list, req.jam.currentuser)) {
        req.jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', req);
        return;
    }

    // Get nonce
    Parse.Cloud.run('nonce_create').then((result) => {
        // Get widgets
        core.add_widgets('comment-list', req);

        // Set nonce value
        req.jam.nonce = result;

        // Customize wysiwyg
        if (req.jam.plugin.hasOwnProperty('wysiwyg')) {
            req.jam.plugin.wysiwyg['field'] = 'body';
            req.jam.plugin.wysiwyg['placeholder'] = 'Comment';
        }

        next();

    }, (err) => {
        log(__filename, err);
        req.jam['err'] = {code: 400, message: 'Bad Request'};
        res.status(req.jam.err.code).render(core.template.theme + '/templates/404', req);
    });
};

exports.all = (req, res) => {
    req.jam['comments']    = {
        list          : [],
        pagination    : {},
        query         : {}
    };

    req.jam['can_moderate'] = core.perm_check(permissions.edit_others, req.jam.currentuser);

    let filtered    = 0;
    let params      = {};
    let darr        = __dirname.split('/'); darr.pop();
    req.jam.content     = darr.join('/') + '/view/list.ejs';

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
        include    : ['author', 'post']
    };

    if (params.hasOwnProperty('status')) {
        switch (params.status) {
            case 'waiting':
                params.status = 'wait';
                break;

            case 'deleted':
                params.status = 'delete';
                break;
        }

        opt['status'] = (typeof params.status === 'string') ? [params.status] : params.status;
        filtered += 1;

    } else {
        opt['status'] = ['publish', 'wait'];
    }

    if (params.hasOwnProperty('id')) {
        if (String(params.id).toLowerCase() !== 'all') {
            opt['post'] = params.id;
            filtered += 1;
        }
    }

    if (req.query['user']) {
        opt['author'] = req.query.user;
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

    if (req.query['flagged']) {
        opt['flagged'] = Boolean(req.query.flagged === 'true');
        filtered += 1;
    }

    Parse.Cloud.run('comment_list', opt).then((results) => {

        req.jam.comments['pagination'] = results.pagination;

        let output = [];
        results.list.forEach((item) => {

            let d                = moment(item.createdAt);
            item['date']         = d.format('MMM DD YYYY');
            item['post']         = item.post.toJSON();
            item['author']       = item.author.toJSON();
            item['op']           = Boolean(item.post.creator.objectId === item.author.objectId);
            item['time']         = d.format('LT');
            item['status_color'] = status_color(item.status);

            output.push(item);
        });

        req.jam.comments['query']    = opt;
        req.jam.comments['list']     = output;
        req.jam.comments['filtered'] = filtered;

    }).catch((err) => {
        log(__filename, err.message);
    }).always(() => {
        res.render(core.template.admin, req);
    });
};
