const moment     = require('moment');
const Promise    = require('promise');

let item         = {};

exports.use = (req, res, next) => {
    req.jam['rec'] = {};
    req.baseUrl = (req.baseUrl === '') ? '/' : req.baseUrl;

    Parse.Cloud.run('content_get', {route: req.baseUrl}).then((result) => {

        item            = result.toJSON();
        item['meta']    = item['meta'] || {};
        item['body']    = item['body'] || '';
        item['body']    = core.hbsParse(item['body'], req.jam) || item['body'];
        req.jam['rec']  = item;

        if (item.status === 'delete' && core.is_role(50, req.jam.currentuser) === false) {
            req.jam['rec']['title'] = '404 Error';
            res.status(404).render(core.template.theme + '/templates/404', req);
            return;
        }

        if (item.status === 'draft') {
            if (core.is_role(50, req.jam.currentuser) === false) {
                req.jam['rec']['title'] = '404 Error';
                res.status(404).render(core.template.theme + '/templates/404', req);
                return;
            } else {
                req.jam['rec']['title'] = 'draft | ' + req.jam['rec']['title'];
            }
        }

        // Publish later
        if (item.status === 'publish-later') {
            if (item.hasOwnProperty('publishAt')) {
                let now     = moment();
                let when    = moment(item.publishAt['iso']);
                let diff    = when.diff(now, 'minutes');

                if (diff > 0 && core.is_role(50, req.jam.currentuser) === false) {
                    req.jam['rec']['title'] = '404 Error';
                    res.status(404).render(core.template.theme + '/templates/404', req);
                    return;
                }
            }
        }

        // Unpublish Later
        if (item.hasOwnProperty('unpublishAt')) {
            let now     = moment();
            let when    = moment(item.unpublishAt['iso']);
            let diff    = when.diff(now, 'minutes');

            if (diff < 1 && core.is_role(50, req.jam.currentuser) === false) {
                req.jam['rec']['title'] = '404 Error';
                res.status(404).render(core.template.theme + '/templates/404', req);
                return;
            }
        }

        // register widget.ejs
        core.add_widgets(req.jam.rec.type, req);

        // register plugin `use` hooks
        let before = [];
        if (req.jam.is.admin !== true) {
            _.keys(req.jam.plugin).forEach((name) => {
                let plugin = req.jam.plugin[name];
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

        req.jam['rec']['title'] = '404 Error';
        res.status(404).render(core.template.theme + '/templates/404', req);

    });
};

// 1.0 - ALL | Get the route
exports.all = (req, res) => {
    let tmp = req.jam.rec['template'] || 'index';
    tmp = core.template.theme + '/templates/' + tmp;
    res.render(tmp, req);
};
