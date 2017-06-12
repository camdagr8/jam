
exports.get = (req, res) => {
    Parse.Cloud.run('category_get', {objectId: req.params.id}).then((result) => {
        res.json(result);
    }).catch((err) => {
        res.status(500).json({error: err.message});
    });
};

exports.delete = (req, res) => {
    Parse.Cloud.run('category_delete', {objectId: req.params.id}).then((result) => {
        res.json(result);
    }).catch((err) => {
        res.status(500).json({error: err.message});
    });
};

exports.post = (req, res) => {
    Parse.Cloud.run('category_save', req.body).then((result) => {
        res.json(result);
    }).catch((err) => {
        res.status(500).json({error: err.message});
    });
};

exports.put = (req, res) => {
    let params            = req.body;
    params['objectId']    = req.params.id;

    Parse.Cloud.run('category_save', params).then((result) => {
        res.json(result);
    }).catch((err) => {
        res.status(500).json({error: err.message});
    });
};
