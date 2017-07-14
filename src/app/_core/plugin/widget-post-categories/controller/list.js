
exports.all = (req, res) => {
    let page        = (req.params.hasOwnProperty('page')) ? req.params.page : 1;
    let opts        = req.query;
    opts['page']    = page;

    Parse.Cloud.run('category_list', opts).then((results) => {
        res.json(results);
    }).catch((err) => {
        res.status(500).json(err);
    });
};
