/**
 *
 * Sample View Controller
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.1
 *
 * @description Sample controller to show how routes work
 */

// middle-ware
exports.use = (req, res, next) => {
    req['jam'] = (req.hasOwnProperty('jam')) ? req.jam : {};

    // Add some data to the global.jam object
    req.jam['sample'] = {
        hello: 'Humans!'
    };

    next();
};

// catch all methods [DELETE|GET|POST|PUT]
exports.all = (req, res) => {
    // Output the sample data object as JSON
    res.json(req.jam);
};
