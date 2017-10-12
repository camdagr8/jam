const request = require('request');

exports.use = (req, res) => {
    if (req.params.hasOwnProperty('file')) {

        Parse.Cloud.run('file_get', {name: req.params.file, ovr: true}).then((result) => {
            if (result.length > 0) {
                let url = result[0].get('file').url();
                req.pipe(request(url)).pipe(res);
            } else {
                req.jam['rec']['title'] = '404 Error';
                res.status(404).render(core.template.theme + '/templates/404', req);
            }
        }).catch(() => {
            req.jam['rec']['title'] = '404 Error';
            res.status(404).render(core.template.theme + '/templates/404', req);
        });

    } else {
        req.jam['rec']['title'] = '404 Error';
        res.status(404).render(core.template.theme + '/templates/404', req);
    }
};
