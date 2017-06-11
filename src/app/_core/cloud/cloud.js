const fs         = require('fs');
const dir        = appdir + '/cloud';
const coredir    = appdir + '/_core/cloud';

// 0.1 - Read core Parse Cloud modules

fs.readdirSync(coredir).forEach((file) => {
	if (file === 'cloud.js') { return; }
	require(coredir+'/'+file);
});

// 0.2 - Read core plugin directory and find cloud.js files
core.find_file(appdir + '/_core/plugin', 'cloud.js').forEach((file) => { require(file); });

// 1.0 - Read user Parse Cloud modules
fs.readdirSync(dir).forEach((file) => {
	require(dir+'/'+file);
});

// 1.2 - Read user plugin directory and find cloud.js files
core.find_file(appdir + '/plugin', 'cloud.js').forEach((file) => { require(file); });
