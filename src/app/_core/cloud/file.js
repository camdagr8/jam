
Parse.Cloud.define('file_get', (request, response) => {
    let usr = request.user || jam.currentuser;

    if (!usr) {
        response.error('invalid user permissions');
        return;
    }

    request.user = usr;
    response.success({message: 'OK', user: request.user.toJSON()});
});

Parse.Cloud.beforeSave(Parse.File, (request, response) => {
    if (!request.user) {
        response.error('invalid user permissions');
    } else {
        reponse.success();
    }
});
