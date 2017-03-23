// Includes
const _ 		= require('underscore');
const hbs 		= require('handlebars');
const slugify 	= require('slugify');
const Promise 	= require('promise');
const moment 	= require('moment');
const fs 		= require('fs');





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

const perm_check = (perms) => {
	// level 0 check
	if (perms === 0) {
		return true;
	}

	// 'all' check
	if (_.isArray(perms)) {
		if (perms.indexOf('all') > -1) {
			return true;
		}
	} else {
		if (perms === 'all') {
			return true;
		}
	}

	// user check
	if (!jam.currentuser) {
		return false;
	}

	// roles check
	let roles = jam.currentuser.get('roles');
	if (!roles) {
		return false;
	}

	// is admin?
	if (roles.hasOwnProperty('administrator')) {
		return true;
	}

	// level
	if (typeof perms === 'number') {
		let l = _.max(_.values(roles), 'level');
		return (l.level >= perms);
	}


	if (!_.isArray(perms)) { perms = [perms]; }
	let i = _.intersection(perms, _.keys(roles));
	return (i.length > 0);
};

/**
 *
 * add_widgets(sections)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Addes widgets from the plugins array for the specified sections.
 * @param sections {Array} List of section partial names. ie: page-editor or dashboard
 */
const add_widgets = (sections) => {

	sections = (_.isArray(sections)) ? sections : [sections];
	sections.push('all');
	sections = _.uniq(sections);

	jam.plugins.forEach((plugin) => {
		let p = plugin.name.split('-').join('_');
		let m = jam.plugin[p];

		// Access control ---------------------------------------------------- X
		let access = true;
		if (m.hasOwnProperty('perms')) {
			access = perm_check(m.perms);
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


		jam[z] = (jam.hasOwnProperty(z)) ? jam[z] : [];
		jam[z].push(plugin.widget);
		jam[z] = _.uniq(jam[z]);
	});
};


/**
 *
 * core.helpers(helpers_path)
 *
 * @author Cam Tullos cam@tullos.ninja
 * @since 0.1.0
 *
 * @description Function that reads the helpers directory and creates an object array of the results.
 * @param mod_path {String} The helpers directory to scan.
 * @returns {Array} List of module objects.
 */
const plugins = (mod_path) => {
    if (!fs.existsSync(mod_path)) {
        return [];
    }

	let output 	= [];
	let mods 	= fs.readdirSync(mod_path);

	if (!jam.hasOwnProperty('plugin')) { jam.plugin = {}; }

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

			if (!jam.plugin.hasOwnProperty(p)) {
				jam.plugin[p] = m;
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
 * core.hbsParse(source, data)
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
const hbsParse = (source, data) => {
	// 0.1 - Trim the whitespace from the source.
	source = source.replace(/^(\s*(\r?\n|\r))+|(\s*(\r?\n|\r))+$/g, '');

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
                    if (file.substr(0, 1) !== '_') {
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
	install: appdir + '/_core/view/admin/install'
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
 * Exports
 */
exports.add_widgets 	= add_widgets;
exports.ext_remove 		= ext_remove;
exports.hbsParse 		= hbsParse;
exports.perm_check 		= perm_check;
exports.plugins 		= plugins;
exports.query 			= query;
exports.scan 			= scan;
exports.skey 			= 'bD6yXAOEX4xq';
exports.template 		= template;
exports.timestamper 	= timestamper;
