const fs = require('fs');
const dir = appdir + '/cloud';
const coredir = appdir + '/_core/cloud';

// 0.1 - Read core Parse Cloud modules
fs.readdirSync(coredir).forEach((file) => {
	if (file === 'cloud.js') { return; }
	require(coredir+'/'+file);
});


// 1.0 - Read user Parse Cloud modules
fs.readdirSync(dir).forEach((file) => {
	if (file === 'cloud.js') { return; }
	require(dir+'/'+file);
});
