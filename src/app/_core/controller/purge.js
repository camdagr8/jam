/*const purge = {
    pages: (req, res) => {
        Parse.Cloud.run('content_purge', {type: 'pages'}).always(() => {
            let ref = req.get('Referrer');
            res.redirect(ref);
        });
    },
    posts: (req, res) => {
        Parse.Cloud.run('content_purge', {type: 'posts'}).always(() => {
            let ref = req.get('Referrer');
            res.redirect(ref);
        });
    },
    all:   (req, res) => {
        Parse.Cloud.run('content_purge').always(() => {
            let ref = req.get('Referrer');
            res.redirect(ref);
        });
    }
};*/

exports.post = (req, res) => {
    let type = req.params.type;
    if (purge.hasOwnProperty(type)) {
        Parse.Cloud.run('content_purge', {type: type}).always(() => {
            let ref = req.get('Referrer');
            res.redirect(ref);
        });
    } else {
        Parse.Cloud.run('content_purge').always(() => {
            let ref = req.get('Referrer');
            res.redirect(ref);
        });
    }
};
