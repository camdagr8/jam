// Includes
const hbs        = require('handlebars');
const slugify    = require('slugify');
const Promise    = require('promise');
const moment     = require('moment');
const fs         = require('fs');
const rr         = require('readdir-recursive');


/**
 * core.query(params)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since version 0.1.0
 *
 * @description The base query object that will be used by most queries.
 *
 * @returns {Parse.Query} 	Returns a Parse.Query object.
 *
 * @params params 			{Object} 		The query parameters.
 *  @property table 		{String} 		The table to query.
 * 	@property skip 			{Integer} 		The query's start index. Default 0.
 * 	@property limit 		{Integer} 		The total number of objects to return. Default 100. Max 1000.
 * 	@property order 		{String} 		Sorts the results order: ascending|descending. Default "descending".
 * 	@property orderBy 		{String} 		The key to order the results by. Default "createdAt".
 * 	@property timestamp 	{String|Date} 	Restricts the query to the supplied date value. Defaults to the current timestamp of the request.
 */
const query = (params) => {

	// 0.1 - Set up some defaults
	let table 	= (typeof params['table'] === 'string') 	? params['table'] 			: null;
	let skip 	= (typeof params['skip'] !== 'undefined') 	? Number(params['skip']) 	: 0;
	let limit 	= (typeof params['limit'] !== 'undefined') 	? Number(params['limit']) 	: 100;
		limit 	= (limit > 1000) ? 1000 : limit;

	// 0.2 - Exit if no table specified
	if (table === null) { return null; }

	// 1.0 - The Parse.Query constructor
	let qry = new Parse.Query(table);
		qry.limit(limit);
		qry.skip(skip);

	// 2.0 - Set the order
	let orders 	= ['ascending', 'descending'];
	let orderBy = (typeof params['orderBy'] === 'string') 	? params['orderBy'] 	: 'createdAt';
	let order 	= (typeof params['order'] === 'string') 	? params['order'] 		: 'descending';
		order 	= order.toLowerCase();
		order 	= (orders.indexOf(order) > -1) ? order : 'descending';

	qry[order](orderBy);

	/**
	 * 3.0 - Use a timestamp so that we can get larger datasets w/o running
	 * into the max object query of 100000
	 */
	if (params['timestamp']) {
		let d = moment(params['timestamp']).toDate();

		if (order === 'descending') {
			qry.lessThan('createdAt', d);
		} else {
			qry.greaterThan('createdAt', d);
		}
	}

	// 4.0 - Return the qry object
	return qry;
};

/**
 *
 * perm_check
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Checks a list of permissions against a user's permissions
 * @param perms {Array|String} The list of permissions to check
 * @param user {Object} The user to check
 *
 * @returns {Boolean} True|False: the user does/doesn't have the proper permissions
 */
const perm_check = (perms, user) => {

    perms = (_.isArray(perms)) ? perms : [perms];

    for (let i = 0; i < perms.length; i++) {
        let perm = perms[i];
        let valid = is_role(perm, user);
        if (valid === true) { return true; }
    }

    return false;
};

/**
 *
 * add_widgets(sections, req)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Addes widgets from the plugins array for the specified sections.
 * @param sections {Array} List of section partial names. ie: page-editor or dashboard
 */
const add_widgets = (sections, req) => {

	sections = (_.isArray(sections)) ? sections : [sections];
	sections.push('all');
	sections = _.uniq(sections);

	let user = req.jam.currentuser;

	req.jam.plugins.forEach((plugin) => {
		let p = plugin.name.split('-').join('_');
		let m = req.jam.plugin[p];

		// Access control ---------------------------------------------------- X
		let access = true;
		if (m.hasOwnProperty('perms')) {
			access = perm_check(m.perms, user);
		}

		if (access !== true) { return; }

		// Exit if no widget.ejs file ---------------------------------------- X
		if (!plugin.hasOwnProperty('widget')) { return; }

		// Exit if the module doesn't have a zone ---------------------------- X
		let z = (m.hasOwnProperty('zone')) ? m.zone : null;
		if (!z || z === null) { return; }

		// If the mod.js file does not specify sections set it to `all`.
		if (!m.hasOwnProperty('sections')) {
			m['sections'] = ['all'];
		}

		// Exit if no intersecting sections ---------------------------------- X
		if (_.intersection(sections, m.sections).length < 1) { return; }

        req.jam[z] = (req.jam.hasOwnProperty(z)) ? req.jam[z] : [];
        req.jam[z].push(plugin.widget);
        req.jam[z] = _.uniq(req.jam[z]);
	});
};

/**
 *
 * core.plugins(mod_path, req)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Function that reads the supplied directory and creates an object array of the results.
 * @param mod_path {String} The plugin directory to scan.
 * @returns {Array} List of module objects.
 */
const plugins = (mod_path, req) => {
    if (!fs.existsSync(mod_path)) {
        return [];
    }

	let output 	= [];
	let mods 	= fs.readdirSync(mod_path);

	if (!req.jam.hasOwnProperty('plugin')) { req.jam.plugin = {}; }

	mods.forEach((dir) => {

		if (dir.substr(0, 1) === '.') { return; }
		if (dir.substr(0, 1) === '_') { return; }

		let name 	= slugify(dir);
		let obj 	= {name: name, index: 1000000};
		let path 	= mod_path + '/' + dir;
		let files 	= fs.readdirSync(path);

		if (files.length < 1) { return; }

		files.forEach((file) => {
			if (file.substr(0, 1) === '.') { return; }
			let f = ext_remove(file);
			obj[f] = path+'/'+file;
		});


		if (obj.hasOwnProperty('mod')) {

			let m          = require(obj.mod);
			obj.name       = (m.hasOwnProperty('id')) ? m.id : obj.name;
			let i          = (m.hasOwnProperty('index')) ? m.index : obj.index;
			obj.index      = (typeof i !== 'number') ? obj.index : i;
			let p          = obj.name.split('-').join('_');
			obj['func']    = p;

			if (!req.jam.plugin.hasOwnProperty(p)) {
                req.jam.plugin[p] = m;
                output.push(obj);
			}

		} else {
			output.push(obj);
		}

	});

	output = _.sortBy(output, 'index');

	return output;
};

/**
 *
 * core.hbsParse(source, data, jam)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Executes a Handlebars compile on the `source` string and applies the `data` object as the context.
 *
 * @param source {String} The source string/HTML.
 * @param data {Object} The contextual data to apply to the partial or helper.
 *
 * @return {String} Parsed version of the `source` value with `data` applied.
 */
const hbsParse = (source, data, jam) => {
	// 0.1 - Trim the whitespace from the source.
	source = source.replace(/^(\s*(\r?\n|\r))+|(\s*(\r?\n|\r))+$/g, '');

	jam = jam || data;

	// 1.0 - Get the Handlebars helpers and partials from jam.helpers array.
	jam.helpers.forEach((mod) => {

		let m = (mod.hasOwnProperty('mod')) ? require(mod.mod) : {};

		// 1.1 - If there is a view.hbs file -> register a partial {{> mod.name  }}
		if (mod.hasOwnProperty('partial')) {

			// 1.1.0 - Get the mod id and fall back to mod.name if not specified in mod.js
			let n = (m.hasOwnProperty('id')) ? m.id : mod.name;

			// 1.1.1 - Read file contents view.hbs
			let tmp = fs.readFileSync(mod.partial, 'utf8');

			// 1.1.2 - Trim the whitespace from the tmp
			tmp = tmp.replace(/^(\s*(\r?\n|\r))+|(\s*(\r?\n|\r))+$/g, '');

			// 1.1.3 - Register the partial
			hbs.registerPartial(n, tmp);
		}

		// 1.2 - If there is a m.helper() function defined -> register a helper {{mod.name}}
		if (m.hasOwnProperty('helper')) {
			hbs.registerHelper(mod.name, m.helper);
		}

	});

	// 2.0 - Compile the handlebars template
	let template = hbs.compile(source);

	// 3.0 - Apply the data and return new string
	return template(data);
};

/**
 *
 * is_role(permission, user)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.0
 *
 * @description Checks the user for the specified role or level
 *
 * @param permission {String|Number} The role or level to check for
 * @param user {Object} The Parse.User object to check or jam.currentuser if undefined
 *
 * @returns {Boolean}
 */
const is_role = (permission, user) => {

    if (permission === 'all' || permission === 0) { return true; }

    if (!user) { return false; }

    user = (typeof user['toJSON'] !== 'function') ? user : user.toJSON();

    if (typeof permission === 'string') {
        permission = permission.toLowerCase();
        let r = _.keys(user.roles);
        return (r.indexOf(permission) > -1);
    }

    if (typeof permission === 'number') {
        let v = _.values(user.roles);
        let l = _.pluck(v, 'level');
        let lvl = _.max(l);
        return Boolean(lvl >= permission);
        //return (l.indexOf(permission) > -1);
    }

    return false;
};

/**
 * Remove the file ext from a file path.
 */
const ext_remove = (str) => {
	str = str.split('.');
	str.pop();
	str = str.join('.');

	return str;
};

/**
 *
 * scan(path)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Scans a directory for files
 * @param path {String} The directory path to scan.
 * @returns {Promise}
 */
const scan = (path) => {
	return new Promise((fulfill, reject) => {
		fs.readdir(path, 'utf8', (err, files) => {
			if (err) {
			    reject(err);
			} else {
			    let farr = [];
			    files.forEach((file) => {
                    if (file.substr(0, 1) !== '_' && file.substr(0, 1) !== '.') {
                        farr.push(file);
                    }
                });
			    fulfill(farr);
			}
		});
	});
};

/**
 * Core templates
 */
const template = {
	admin: appdir + '/_core/view/admin/admin',
	install: appdir + '/_core/view/admin/install',
    views: null,
    theme: null
};

/**
 *
 * timestamper()
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Function that updates the timestamp.json file when content is changed in the CMS
 */
const timestamper = () => {
	let p = appdir + '/model/timestamp.json';
		p = p.replace(/dist/, 'src');

	let t = {timestamp: moment().format()};
		t = JSON.stringify(t);

	fs.writeFile(p, t, 'utf8', () => {});
};

/**
 *
 * find_file()
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 1.0.13
 *
 * @description Recursively finds the supplied file name in the directory
 * @param dir {String|Array} The directories to search
 * @param file {String|Array} The files to find
 *
 * @return {Array} List of file paths
 */
const find_file = (dirs, files) => {
    if (typeof dirs === 'string') { dirs = [dirs]; }
    if (typeof files === 'string') { files = [files]; }

    let output = [];
    dirs.forEach((dir) => {
        rr.fileSync(dir).forEach((file) => {

            let exclude    = false;
            let farr       = file.split('/');
            farr.forEach((i) => { if (i.substr(0, 2) === '__') { exclude = true; } });

            if (exclude === true) { return; }

            f = farr.pop();
            if (files.indexOf(f) > -1) { output.push(file); }
        });
    });

    return output;
};

const themes_get = () => {
    let themes = [];
    let s = fs.readdirSync(appdir + '/view/themes');
    s.forEach((dir) => {
        let path = appdir + '/view/themes/' + dir;
        if (fs.lstatSync(path).isDirectory()) {
            themes.push({name: dir, path: path});
        }
    });

    return themes;
};

const strip_tags = (str) => {
    let newStr = String(str).replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/[{].*[}]/g, '')
    .replace(/[^\s\w]/g, '')
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s+/g,' ')
    .replace(/\t/g, '')
    .trim()
    .toLowerCase()
    .split(' ');

    newStr = _.uniq(newStr);

    return newStr;
};

/**
 * Exports
 */
exports.add_widgets    = add_widgets;
exports.ext_remove     = ext_remove;
exports.hbsParse       = hbsParse;
exports.is_role        = is_role;
exports.perm_check     = perm_check;
exports.plugins        = plugins;
exports.query          = query;
exports.scan           = scan;
exports.skey           = 'bD6yXAOEX4xq';
exports.template       = template;
exports.timestamper    = timestamper;
exports.find_file      = find_file;
exports.themes         = themes_get;
exports.strip_tags     = strip_tags;
