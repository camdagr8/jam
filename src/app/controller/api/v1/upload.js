// Upload router



// S3 Signature
var auth = function (request, response, next) {

	var input = {
		bucket: process.env.S3_BUCKET,
		file: request.query.file,
		type: request.query.type
	};

	if (request.query.bucket) {
		input.bucket = request.query.bucket;
	}

	var callback = {
		success: function (results) {
			response.type('application/json');
			response.json(results);
		},
		error: function (err) {
			response.status(500).json(err);
		}
	};

	// Execute Parse function
	Parse.Cloud.run('upload_signature', input, callback);
};


// Query
var get = function (request, response, next) {
	var input = request.query || {};

	var callback = {
		success: function (results) {
			response.type('application/json');
			response.json(results);
		},
		error: function (err) {
			response.status(500).json(err);
		}
	};

	// Execute Parse function
	Parse.Cloud.run('upload_get', input, callback);
};


// Save
var save = function (request, response, next) {
	var input = request.body;

	var callback = {
		success: function (results) {
			response.type('application/json');
			response.json(results);
		},
		error: function (err) {
			response.status(500).json(err);
		}
	};

	// Execute Parse function
	Parse.Cloud.run('upload_post', input, callback);
};

// Save
var update = function (request, response, next) {
	var input = request.body;

	var callback = {
		success: function (results) {
			response.type('application/json');
			response.json(results);
		},
		error: function (err) {
			response.status(500).json(err);
		}
	};

	// Execute Parse function
	Parse.Cloud.run('upload_put', input, callback);
};


// Directories
var dir_get = function (request, response, next) {

	var input = {key: 'folders'};

	var callback = {
		success: function (result) {

			response.type('application/json');
			if (result) {
				response.json(result);
			} else {
				response.json([]);
			}
		},
		error: function (err) {
			response.status(500).json(err);
		}
	};


	// Execute Parse function
	Parse.Cloud.run('config_get', input, callback);

};


// Directory
var dir_set = function (request, response, next) {
	var input = {key: 'folders', value: request.body};

	var callback = {
		success: function (results) {
			response.type('application/json');
			response.json(results);
		},
		error: function (err) {
			response.status(500).json(err);
		}
	};

	// Execute Parse function
	Parse.Cloud.run('config_set', input, callback);
};


// Exports
exports.auth 		= auth;
exports.dir_get 	= dir_get;
exports.dir_set 	= dir_set;
exports.get 		= get;
exports.post 		= save;
exports.put 		= update;
