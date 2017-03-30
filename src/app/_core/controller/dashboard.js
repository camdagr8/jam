/**
 * Created by ctullos on 3/29/17.
 */
exports.all = (req, res) => {
    jam.content = './sections/dashboard';
    res.render(core.template.admin, jam);
};
