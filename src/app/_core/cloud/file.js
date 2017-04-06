
Parse.Cloud.define('file_get', (request, response) => {
    let usr = request.user || jam.currentuser;

    if (!usr) {
        response.error('request.user is a required parameter');
        return;
    }

    let skip = request.params.hasOwnProperty('skip') ? request.params.skip : 0;
    let limit = request.params.hasOwnProperty('limit') ? request.params.limit : 1000;
    let qry = core.query({table: 'File', order: 'descending', orderBy: 'createdAt', limit: limit, skip: skip});

    if (request.params.hasOwnProperty('name')) {
        qry.equalTo('name', request.params.name);
    }

    if (request.params.hasOwnProperty('extension')) {
        let exts = request.params.extension;
        if (!_.isArray(exts)) {
            exts = [exts];
        }
        qry.containedIn('extension', exts);
    }

    if (request.params.hasOwnProperty('date')) {
        let d = new Date(request.params.date);
        qry.lessThan('createdAt', d);
    }

    qry.find().then((results) => {
        response.success(results);
    }).catch((err) => {
        response.error(err.message);
    });
});


Parse.Cloud.define('file_post', (request, response) => {
    let usr = request.user || jam.currentuser;

    if (!usr) {
        response.error('request.user is a required parameter');
        return;
    }

    let obj = new Parse.Object('File');

    Parse.Cloud.run('file_get', {name: request.params.name}).then((results) => {
        if (results.length > 0) {
            log(request.params.name + ' already exists');
            obj.set('objectId', results[0].id);
        }
    }).catch((err) => {
        response.error(err.message);
    }).then(() => {
        _.keys(request.params).forEach((key) => {
            obj.set(key, request.params[key]);
        });

        return obj.save();
    }).then((result) => {
        response.success(result);
    }).catch((err) => {
        response.error(err.message);
    });
});
