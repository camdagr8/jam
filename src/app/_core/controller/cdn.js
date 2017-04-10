const request = require('request');

exports.use = (req, res) => {
    if (req.params.hasOwnProperty('file')) {

        Parse.Cloud.run('file_get', {name: req.params.file, ovr: true}).then((result) => {
            if (result.length > 0) {
                let url = result[0].get('file').url();
                req.pipe(request(url)).pipe(res);
            } else {
                jam['rec']['title'] = '404 Error';
                res.status(404).render(core.template.theme + '/404', jam);
            }
        }).catch(() => {
            jam['rec']['title'] = '404 Error';
            res.status(404).render(core.template.theme + '/404', jam);
        });

    } else {
        jam['rec']['title'] = '404 Error';
        res.status(404).render(core.template.theme + '/404', jam);
    }
};
