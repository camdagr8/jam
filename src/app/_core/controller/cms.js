const moment     = require('moment');
const Promise    = require('promise');

jam['rec']       = {};
let item         = {};

exports.use = (req, res, next) => {
    req.baseUrl = (req.baseUrl === '') ? '/' : req.baseUrl;

    Parse.Cloud.run('content_get', {route: req.baseUrl}).then((result) => {

        item            = result.toJSON();
        item['meta']    = item['meta'] || {};
        item['body']    = item['body'] || '';
        item['body']    = core.hbsParse(item['body'], jam) || item['body'];
        jam['rec']      = item;

        if (item.status === 'delete' && core.is_role(50) === false) {
            jam['rec']['title'] = '404 Error';
            res.status(404).render(core.template.theme + '/templates/404', jam);
            return;
        }

        if (item.status === 'draft') {
            if (core.is_role(50) === false) {
                jam['rec']['title'] = '404 Error';
                res.status(404).render(core.template.theme + '/templates/404', jam);
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

                if (diff > 0 && core.is_role(50) === false) {
                    jam['rec']['title'] = '404 Error';
                    res.status(404).render(core.template.theme + '/templates/404', jam);
                    return;
                }
            }
        }

        // Unpublish Later
        if (item.hasOwnProperty('unpublishAt')) {
            let now     = moment();
            let when    = moment(item.unpublishAt['iso']);
            let diff    = when.diff(now, 'minutes');

            if (diff < 1 && core.is_role(50) === false) {
                jam['rec']['title'] = '404 Error';
                res.status(404).render(core.template.theme + '/templates/404', jam);
                return;
            }
        }

        // register widget.ejs
        core.add_widgets(jam.rec.type);

        // register plugin `use` hooks
        let before = [];
        if (jam.is.admin !== true) {
            _.keys(jam.plugin).forEach((name) => {
                let plugin = jam.plugin[name];
                if (plugin.hasOwnProperty('use')) {
                    before.push(plugin.use);
                }
            });
        }

        if (before.length > 0) {
            let cnt = before.length;
            let comp = 0;

            before.forEach((fnc) => {
                let prom = new Promise(function (resolve) {
                    fnc(req, res, resolve);
                });

                prom.finally(() => {
                    comp += 1;
                    if (comp === cnt) {
                        next();
                    }
                });
            });

        } else {
            next();
        }

    }).catch(() => {

        jam['rec']['title'] = '404 Error';
        res.status(404).render(core.template.theme + '/templates/404', jam);

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
        tmp = core.template.theme + '/templates/' + tmp;
        res.render(tmp, jam);
    }
};
