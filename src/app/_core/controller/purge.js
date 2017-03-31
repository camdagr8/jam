const purge = {
    pages: (req, res) => {
        Parse.Cloud.run('content_purge').always(() => {
            let ref = req.get('Referrer');
            res.redirect(ref);
        });
    },
    all:   (req, res) => {
        let ref = req.get('Referrer');
        res.redirect(ref);
    }
};

exports.post = (req, res) => {
    let type = req.params.type;
    if (purge.hasOwnProperty(type)) {
        purge[type](req, res);
    } else {
        purge.all(req, res);
    }
};
