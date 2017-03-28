// 1.0 - ALL | Get the route
exports.all = (req, res) => {

	let tmp = 'themes/' + jam.theme + '/templates/404';

	Parse.Cloud.run('content_get', {route: req.path}).then((result) => {
		jam.meta = result.get('meta') || {};
		jam.body = result.get('body');
		jam.body = core.hbsParse(jam.body, jam) || jam.body;

		tmp = result.get('template');
		tmp = (tmp) ? tmp : 'index';
		tmp = core.template.theme + '/' + tmp;

		let output = (req.query.hasOwnProperty('output')) ? req.query.output : 'html';

		if (output === 'json') {
			res.json(jam);
		} else {
			res.render(tmp, jam);
		}
	}, () => {
		res.render(tmp, jam);
	});
};

