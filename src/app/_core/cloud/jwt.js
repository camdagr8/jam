/**
 * -----------------------------------------------------------------------------
 * Imports & Settings
 * -----------------------------------------------------------------------------
 */
const jwt = require('jsonwebtoken');

/**
 * -----------------------------------------------------------------------------
 * Functions
 * -----------------------------------------------------------------------------
 */

const jwt_sign = (request, response) => {
    let payload    = request.params['payload'];
    let secret     = request.params['secret'] || env.APP_ID;
    let options    = request.params['options'] || {};
    let sig        = jwt.sign(payload, secret, options);
    let output     = {signature: sig};

    response.success(output);
};

const jwt_verify = (request, response) => {

    let token  = request.params['token'];
    let secret = request.params['secret'] || env.APP_ID;

    let valid = jwt.verify(token, secret);

    if (valid) {
        response.success(valid);
    } else {
        response.error('invalid token');
    }
};


/**
 * -----------------------------------------------------------------------------
 * Cloud Definitions
 * -----------------------------------------------------------------------------
 */

Parse.Cloud.define('jwt_sign', jwt_sign);
Parse.Cloud.define('jwt_verify', jwt_verify);


