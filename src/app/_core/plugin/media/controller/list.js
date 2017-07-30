
exports.all = (req, res) => {

    let darr        = __dirname.split('/'); darr.pop();
    jam.content     = darr.join('/') + '/view/list.ejs';

    res.render(core.template.admin, jam);
};
