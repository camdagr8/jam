

const template_get = (request, response, skip = 0, output = []) => {

    let limit  = 1000;
    let qry    = core.query({table: 'Template', skip: skip, limit: limit});

    qry.equalTo('status', 'active');
    qry.find().then((results) => {
        output.concat(results);

        if (results.length === limit) {
            skip += limit;
            template_get(request, response, skip, output);
        } else {
            response.success(output);
        }

    }, (err) => {
        response.error(err.message);
    });
};


Parse.Cloud.define('template_get', template_get);
