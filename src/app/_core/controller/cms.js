const moment    = require('moment');

jam['rec']      = {};
let item        = {};

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
            res.status(404).render(core.template.theme + '/404', jam);
            return;
        }

        if (item.status === 'draft') {
            if (core.is_role(50) === false) {
                jam['rec']['title'] = '404 Error';
                res.status(404).render(core.template.theme + '/404', jam);
                return;
            } else {
                jam['rec']['title'] = 'draft | ' + jam['rec']['title'];
            }
        }

        // Publish later
        if (item.status === 'publish-later') {
            if (item.hasOwnProperty('publishAt')) {
                let now     = moment();
                let when    = moment(item.publishAt['iso']);
                let diff    = when.diff(now, 'minutes');

                if (diff > 0) {
                    jam['rec']['title'] = '404 Error';
                    res.status(404).render(core.template.theme + '/404', jam);
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
                res.status(404).render(core.template.theme + '/404', jam);
                return;
            }
        }

        next();

    }).catch(() => {

        jam['rec']['title'] = '404 Error';
        res.status(404).render(core.template.theme + '/404', jam);

    });
};

// 1.0 - ALL | Get the route
exports.all = (req, res) => {

    let output    = (req.query.hasOwnProperty('output')) ? req.query.output : 'html';

    if (output === 'json') {
        res.json(jam);
    }

    if (output === 'html') {
        let tmp = jam.rec['template'] || 'index';
        tmp = core.template.theme + '/' + tmp;
        res.render(tmp, jam);
    }
};

