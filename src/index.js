//------------------------------------------------------------------------------
// node.js application init
//------------------------------------------------------------------------------

// Global vars
global.basedir 			= __dirname; // ref to this directory as root
global.env 				= (process.env.NODE_ENV) ? process.env : require(basedir + '/env.json');
global.appdir 			= basedir + env.APP_MOUNT; // ref to the /app dir
global.jam 				= {}; // global namespace used to store misc. data
global.core 			= require(appdir + '/_core/core.js');
global._               = require('underscore');


// Node modules
const express 			= require('express');
const bodyParser 		= require('body-parser');
const beautify 			= require('js-beautify').js_beautify;
const cookieParser 	= require('cookie-parser');
const cookieSession 	= require('cookie-session');
const cors 				= require('cors');
const ParseDashboard 	= require('parse-dashboard');
const ParseServer 		= require('parse-server').ParseServer;
const routes 			= require(appdir + '/_core/routes.js');
const installer 		= require(appdir + '/_core/_install/installer.js');
const prefs 			= require(appdir + '/_core/prefs.js');
const moment 			= require('moment');



global.log = (...args) => {
	let a = [];

	args.forEach((arg) => {
		if (typeof arg !== 'string' && typeof arg !== 'number') {
			a.push(beautify(JSON.stringify(arg)));
		} else {
			a.push(arg);
		}
	});

	console.log('['+moment().format('HH:mm:ss')+']', '[JAM]', a.join(' '));
};

// Parse API setup
const api = new ParseServer({
    appId				: env.APP_ID,
    appName				: env.APP_NAME,
    cloud				: appdir + '/_core/cloud/cloud.js',
    databaseURI			: env.DATABASE_URI,
    javascriptKey		: env.JAVASCRIPT_KEY,
    masterKey			: env.MASTER_KEY,
    publicServerURL 	: env.SERVER_URI + env.PARSE_MOUNT,
    serverURL			: env.SERVER_URI + env.PARSE_MOUNT,
    loggerAdapter 		: {
        module: "parse-server/lib/Adapters/Logger/WinstonLoggerAdapter",
        options: {
            logLevel: "error"
        }
    }
});


// Parse Dashboard setup
const users = (typeof env.PARSE_DASHBOARD_USERS === 'string') ? JSON.parse(env.PARSE_DASHBOARD_USERS) : env.PARSE_DASHBOARD_USERS;

const dashboard = new ParseDashboard({
	"allowInsecureHTTP"	: true,
	"trustProxy"  		: 1,
	"users"				: users,
	"apps"				: [
		{
			appId		: env.APP_ID,
			appName		: env.APP_NAME,
			masterKey	: env.MASTER_KEY,
			serverURL	: env.SERVER_URI + env.PARSE_MOUNT,

		}
	]
}, true);


// Express app setup
global.app = express();


app.set("views", appdir + env.VIEWS);
app.set("view engine", "ejs");
app.set("x-powered-by", false);

app.use(cors());
app.use(express.static(basedir + env.PUBLIC_MOUNT));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({name: '4lqaOOlW1', keys: ['Q2FtZXJvbiBSdWxlcw', 'vT3GtyZKbnoNSdWxlcw']}));
app.use(env.PARSE_MOUNT, api);
app.use(env.PARSE_DASHBOARD_MOUNT, dashboard);

// Get config variables
app.use(prefs);

// Run install scripts
app.use(installer);

// Initialize routes
app.use(routes);


// Run the server
app.listen(env.PORT, '0.0.0.0', function() {
	log('Server running on port:', env.PORT);
});
