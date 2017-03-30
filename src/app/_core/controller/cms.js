const moment    = require('moment');

jam['rec']      = {};
let item        = {};
let tmp         = 'themes/' + jam.theme + '/templates/404';

exports.use = (req, res, next) => {

    req.baseUrl = (req.baseUrl === '') ? '/' : req.baseUrl;

    Parse.Cloud.run('content_get', {route: req.baseUrl}).then((result) => {

        item            = result.toJSON();
        item['meta']    = item['meta'] || {};
        item['body']    = item['body'] || '';
        item['body']    = core.hbsParse(item['body'], jam) || item['body'];
        jam['rec']      = item;

        if (item.status === 'delete') {
            jam['rec']['title'] = '404 Error';
            res.status(404).render(tmp, jam);
            return;
        }

        if (item.status === 'draft' && core.is_role(50) === false) {
            jam['rec']['title'] = '404 Error';
            res.status(404).render(tmp, jam);
            return;
        } else {
            jam['rec']['title'] = 'draft | ' + jam['rec']['title'];
        }

        // Publish later
        if (item.status === 'publish-later') {
            if (item.hasOwnProperty('publishAt')) {
                let now     = moment();
                let when    = moment(item.publishAt['iso']);
                let diff    = when.diff(now, 'minutes');

                if (diff > 0) {
                    jam['rec']['title'] = '404 Error';
                    res.status(404).render(tmp, jam);
                    return;
                }
            }
        }

        // Unpublish Later
        if (item.hasOwnProperty('unpublishAt')) {
            let now     = moment();
            let when    = moment(item.unpublishAt['iso']);
            let diff    = when.diff(now, 'minutes');

            if (diff < 1) {
                jam['rec']['title'] = '404 Error';
                res.status(404).render(tmp, jam);
                return;
            }
        }

        next();

    }).catch(() => {

        jam['rec']['title'] = '404 Error';
        res.status(404).render(tmp, jam);

    });
};

// 1.0 - ALL | Get the route
exports.all = (req, res) => {

    let output    = (req.query.hasOwnProperty('output')) ? req.query.output : 'html';

    if (output === 'json') {
        res.json(jam);
    }

    if (output === 'html') {
        tmp = item['template'] || 'index';
        tmp = core.template.theme + '/' + tmp;
        res.render(tmp, jam);
    }
};

