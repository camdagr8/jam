'use strict';

/**
 * -----------------------------------------------------------------------------
 * Dependencies
 * -----------------------------------------------------------------------------
 */
const beautify       = require('js-beautify').js_beautify;
const browserSync    = require('browser-sync');
const csso           = require('gulp-csso');
const concat         = require('gulp-concat');
const del            = require('del');
const gulp           = require('gulp');
const gulpif         = require('gulp-if');
const gutil          = require('gulp-util');
const install        = require('gulp-install');
const nodemon        = require('gulp-nodemon');
const prefix         = require('gulp-autoprefixer');
const runSequence    = require('run-sequence');
const sass           = require('gulp-sass');
const slugify        = require('slugify');
const source         = require('vinyl-source-stream');
const sourcemaps     = require('gulp-sourcemaps');
const webpack        = require('webpack');
const _              = require('underscore');


/**
 * -----------------------------------------------------------------------------
 * Configuration
 * -----------------------------------------------------------------------------
 */

const config               = require(__dirname + '/gulp.config.json');
config.dev                 = gutil.env.dev;

const env                  = require(__dirname + '/src/env.json');
env['PORT']                = env['PORT'] || config.port.proxy;
env['PORT']                = Number(env.PORT);

if (gutil.env.port) {
    env.PORT = Number(gutil.env.port);
}

config.port['proxy']          = env.PORT;
config.port['browsersync']    = env.PORT + 90;
config.scripts['vendor']      = {
    core    : ["src/public/src/js/_core/vendor/**/*.js"],
    app     : ["src/public/src/js/_app/vendor/**/*.js"],
};

/**
 * -----------------------------------------------------------------------------
 * Tasks
 * -----------------------------------------------------------------------------
 */


// clean
gulp.task('clean', (done) => {
	del.sync([config.dest]);
	done();
});


// styles
gulp.task('styles', () => {
	return gulp.src(config.styles.src)
		.pipe(gulpif(config.dev, sourcemaps.init()))
		.pipe(sass({includePaths: './node_modules'}).on('error', sass.logError))
		.pipe(prefix(config.browsers))
		.pipe(gulpif(!config.dev, csso()))
		.pipe(gulpif(config.dev, sourcemaps.write()))
		.pipe(gulp.dest(config.styles.dest))
		.pipe(gulpif(config.dev, browserSync.stream()));
});


// scripts
const webpackConfig = require('./webpack.config')(config);
gulp.task('scripts', (done) => {
	webpack(webpackConfig, (err, stats) => {
		if (err) {
			gutil.log(gutil.colors.red(err()));
		}
		const result = stats.toJson();
		if (result.errors.length) {
			result.errors.forEach((error) => {
				gutil.log(gutil.colors.red(error));
			});
		}
		done();
	});
});


// vendor
gulp.task('vendor:core', () => {
    return gulp.src(config.scripts.vendor.core)
    .pipe(concat('vendor-core.js'))
    .pipe(gulp.dest(config.scripts.dest));
});

gulp.task('vendor', ['vendor:core'], () => {
    return gulp.src(config.scripts.vendor.app)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(config.scripts.dest));
});


// assemble
gulp.task('assemble', ['styles', 'vendor', 'scripts'], () => {
	return gulp.src(config.build.src)
	.pipe(gulp.dest(config.dest));
});


// nodemon -> start server and reload on change
gulp.task('nodemon', (done) => {
	if (!config.dev) { done(); return; }

	let callbackCalled = false;
	nodemon({
		watch     : config.dest,
		script    : './'+config.dest+'/index.js',
		ext       : 'js ejs json jsx html css scss'
	}).on('start', function () {
		if (!callbackCalled) {
			callbackCalled = true;
			setTimeout(done, 1000);
		}
	}).on('restart', function () {
		browserSync.reload();
	});
});


// serve -> browserSync & watch start
gulp.task('serve', (done) => {
	browserSync({
        notify            : false,
        timestamps        : true,
        reloadDelay       : 2000,
        reloadDebounce    : 2000,
        logPrefix         : '00:00:00',
        port              : config.port.browsersync,
        ui                : {port: config.port.browsersync + 1},
        proxy             : 'localhost:' + config.port.proxy,
        startPath         : "/"
	});

	gulp.task('styles:watch', ['styles']);
	gulp.watch([config.styles.watch], ['styles:watch']);

	gulp.task('scripts:watch', ['scripts'], browserSync.reload);
	gulp.watch([config.scripts.watch], ['scripts:watch']);

    gulp.task('vendor:watch', ['vendor'], browserSync.reload);
    gulp.watch([config.scripts.watch], ['vendor:watch']);

	gulp.watch(config.build.watch, watcher);

	done();
});


/**
 * -----------------------------------------------------------------------------
 * Watch handler
 * -----------------------------------------------------------------------------
 */
const watcher = (e) => {

	let p = e.path.split(__dirname + '/' + config.src).join('');
	let s = config.src + p;

	if (e.type === 'deleted') {
		let d = __dirname + '/' + config.dest + p;

		del.sync([d]);

	} else {

		p = config.dest + p;

		let a = p.split('/');
		a.pop();

		p = a.join('/');

		gulp.src(s).pipe(gulp.dest(p));
	}
};


// default
gulp.task('default', (done) => {

	if (config.dev) {
		runSequence(['clean'], ['assemble'], ['nodemon'], () => {
			gulp.start('serve');
			done();
		});
	} else {
		runSequence(['clean'], ['assemble'], () => {
			done();
		});
	}
});
