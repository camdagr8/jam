const permissions    = require('../perms.json');
const moment         = require('moment');


exports.use = (req, res, next) => {
    /**
     * Permissions
     */
    if (!core.perm_check(permissions.list)) {
        jam['err'] = {code: '403', message: 'Forbidden'};
        res.render(core.template.theme + '/templates/404', jam);
        return;
    }

    // Get nonce
    Parse.Cloud.run('nonce_create').then((result) => {
        // Get widgets
        core.add_widgets('media-list');

        // Set nonce value
        jam.nonce = result;

        next();

    }, (err) => {
        log(__filename, err);
        jam['err'] = {code: 400, message: 'Bad Request'};
        res.status(jam.err.code).render(core.template.theme + '/templates/404', jam);
    });
};

exports.all = (req, res) => {
    jam['files']    = {
        list          : [],
        pagination    : {},
        query         : {}
    };

    jam['can_moderate']    = core.perm_check(permissions.edit_others, jam.currentuser);
    jam['can_upload']      = core.perm_check(permissions.upload, jam.currentuser);

    let filtered    = 0;
    let params      = {};
    let darr        = __dirname.split('/'); darr.pop();
    jam.content     = darr.join('/') + '/view/list.ejs';

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
        include    : ['file']
    };

    if (req.query['find']) {
        opt['find'] = req.query.find;
        filtered += 1;
    }

    if (req.query['type']) {
        opt['type'] = req.query.type;
        filtered += 1;
    }

    if (req.query['sortby']) {
        opt['orderBy'] = req.query.sortby;
    }

    if (req.query['sort']) {
        opt['order'] = req.query.sort;
    }

    Parse.Cloud.run('file_list', opt).then((results) => {

        let output                 = [];
        jam.files['pagination']    = results.pagination;

        results.list.forEach((item) => {
            let d               = moment(item.createdAt);
            item['date']        = d.format('MMM DD YYYY');
            item['time']        = d.format('LT');
            item['template']    = darr.join('/') + '/view/card-' + item.type + '.ejs';
            item['file']        = item.file.toJSON();

            output.push(item);
        });

        jam.files['query']         = opt;
        jam.files['list']          = output;
        jam.files['filtered']      = filtered;

    }).catch((err) => {
        log(__filename, err.message);
    }).always(() => {
        res.render(core.template.admin, jam);
    });
};
