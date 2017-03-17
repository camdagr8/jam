// Includes
var aws 	= require('aws-sdk');
var _ 		= require('underscore');

/**
 * private functions
 */
_.mixin({
	compactObject : function(o) {
		var clone = _.clone(o);
		_.each(clone, function(v, k) {
			if (!v) { clone[k] = null; }
		});
		return clone;
	}
});


var saveObj = function (obj, request, response) {
	for (var prop in request.params) {
		var v = request.params[prop];
			v = (isNaN(v) === false) ? parseInt(v) 	: v;

		if (typeof v !== 'null' && typeof v !== 'undefined') {
			obj.set(prop, v);
		}
	}

	obj.save(null, {
		success: function (result) {
			response.success(result);
		},
		error: function (obj, err) {
			response.error(err.message);
		}
	});
};

var tagCleanse = function (str) {
	var output = String(str).toLowerCase();
		output = output.replace(/[^\w\s]|_/g, "");
		output = output.replace(/\s+/g, " ");

	return output;
};

var tagGen = function (data) {
	var tags = [];
	var keys = ['name', 'ext', 'folder', 'tags'];

	for (var i = 0; i < keys.length; i++) {
		var v = data[keys[i]];

		if (typeof v === 'string') {
			var t = tagCleanse(v);
				t = t.split(' ');

			tags = _.union(tags, t);
		}
	}

	if (Array.isArray(data.tags)) {
		tags = _.union(tags, data.tags);
	}

	tags = _.uniq(tags);
	tags.sort();

	return tags;
};

var updateObj = function (request, response) {
	console.log('-------------------------------------------------------------');
	console.log('upload_put');
	console.log('-------------------------------------------------------------');

	request.params = _.compactObject(request.params);

	if (typeof request.params.objectId === 'undefined') {
		response.error('objectId is a required parameter');
		return;
	}

	var obj = new Parse.Object('Media');
		obj.set('objectId', request.params.objectId);

	for (var prop in request.params) {
		var v = request.params[prop];
			v = (isNaN(v) === false) ? parseInt(v) 	: v;

		if (typeof v !== 'null' && typeof v !== 'undefined') {
			obj.set(prop, v);
		}
	}

	obj.save(null, {
		success: function (result) {
			response.success(result);
		},
		error: function (obj, err) {
			response.error(err.message);
		}
	});
};

// upload_get
Parse.Cloud.define('upload_get', function (request, response) {
	var params 				= _.compactObject(request.params) || {};
		params['table'] 	= 'Media';
		params['orderBy'] 	= params.orderBy || 'updatedAt';
		params['order'] 	= params.order 	 || 'desdcending';


	var qry = core.query(params);

	var eq = ['folder', 'project', 'type', 'ext', 'file', 'relaated', 'download', 'url', 'objectId'];

	// equalTo()
	for (var i = 0; i < eq.length; i++) {
		var k = eq[i];
		var v = params[k];

		if (!v) { continue; }

		qry.equalTo(k, v);
	}

	// exists()
	if (Array.isArray(params['has'])) {
		for (var i = 0; i < params.has.length; i++) {
			qry.exists(params.has[i]);
		}
	}

	// doesNotExists()
	if (Array.isArray(params['empty'])) {
		for (var i = 0; i < params.has.length; i++) {
			qry.doesNotExists(params.has[i]);
		}
	}

	// contains()
	if (params['tag']) {
		qry.contains('tags', params['tag']);
	}

	// containedIn()
	if (Array.isArray(params['tags'])) {
		qry.containedIn('tags', params.tags);
	}

	var callback = {
		success: function (results) {
			response.success(results);
		},
		error: function (err) {
			response.error(err.message);
		}
	};

	// Execute query
	if (params['limit']) {
		if (Number(params['limit']) === 1) {
			qry.first(callback);
			return;
		}
	}

	qry.find(callback);

});


// upload_post
Parse.Cloud.define('upload_post', function (request, response) {

	if (request.params['objectId']) {
		updateObj(request, response);
		return;
	}

	console.log('-------------------------------------------------------------');
	console.log('upload_post');
	console.log('-------------------------------------------------------------');

	request.params = _.compactObject(request.params);

	var qry = new Parse.Query('Media');
		qry.equalTo('project', request.params.project);
		qry.equalTo('url', request.params.folder);
		qry.first({
			success: function (result) {
				var obj = (result) ? result : new Parse.Object('Media');

				request.params['version'] = (result) ? result.get('version') : 1;

				saveObj(obj, request, response);
			},
			error: function (err) {
				response.error(err.message);
			}
		});
});

// upload_put
Parse.Cloud.define('upload_put', updateObj);


// upload_signature
Parse.Cloud.define('upload_signature', function (request, response) {
	var file = request.params['file'];
		file = String(file).toLowerCase();

	request.params['file'] = file;

	var params = {
		Expires 	: 1000,
		ACL 		: 'public-read',
		Key 		: request.params['file'],
		ContentType : request.params['type'],
		Bucket 		: request.params['bucket']
	};

	var s3 = new aws.S3({signatureVersion: 'v4', region: 'us-east-2'});
		s3.getSignedUrl('putObject', params, (err, data) => {
			if (err){
				response.error(err.message);
			} else {
				var returnData = {
					signature 	: data,
					url 		: `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`
				};

				response.success(returnData);
			}
		});
});


// Media.beforeSave();
Parse.Cloud.beforeSave('Media', function (request, response) {
	var data = request.object.toJSON();

	var tags = tagGen(data) || [];
	request.object.set('tags', tags);

	// Set the related value
	if (data.file) {
		var file = data.file.split('.');
			file.pop();
			file = file.join('.');

		var related = [];
		if (data.project) { related.push(data.project); }
		if (data.folder) { related.push(data.folder); }

		related.push(file);
		related = related.join('/');
		related = related.toLowerCase();

		request.object.set('related', related);
	}

	/**
	 * If the upload is an image -> find the related
	 * file and set the objects download value.
	 */
	var exts = ['gif', 'jpeg', 'jpg', 'png'];
	if (exts.indexOf(data.ext) > -1 && !data['download']) {
		var qry = new Parse.Query('Media');
			qry.equalTo('related', related);
			qry.notContainedIn('ext', exts);
			qry.first({
				success: function (result) {
					if (result) {
						request.object.set('download', result.get('url'));
					}
					response.success();
				},
				error: function (err) {
					console.log(err.message);
					response.success();
				}
			});
	} else {
		response.success();
	}
});


// Media.afterSave();
Parse.Cloud.afterSave('Media', function (request, response) {
	var data = request.object.toJSON();

	/**
	 * If the upload is not an image -> find the related
	 * file and set the objects download value.
	 */
	var exts = ['gif', 'jpeg', 'jpg', 'png'];
	if (exts.indexOf(data.ext) < 0) {
		var qry = new Parse.Query('Media');
			qry.equalTo('related', data.related);
			qry.containedIn('ext', exts);
			qry.first({
				success: function (result) {
					if (result) {
						result.set('download', data.url);
						result.save();
					}
				},
				error: function (err) {
					console.log(err.message);
				}
			});
	}
});
