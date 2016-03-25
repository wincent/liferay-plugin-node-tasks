'use strict';

var _ = require('lodash');
var gutil = require('gulp-util');
var InitPrompt = require('./lib/init_prompt');
var path = require('path');
var storage = require('gulp-storage');
var zip = require('gulp-zip');

var CWD = process.cwd();

module.exports.registerTasks = function(options) {
	options.name = options.name || path.basename(CWD);
	options.pathDist = options.pathDist || 'dist';
	options.rootDir = options.rootDir || 'docroot';

	var gulp = options.gulp;

	storage(gulp);

	var store = gulp.storage;

	store.create('LiferayPlugin', 'liferay-plugin.json');

	gulp.task('plugin:deploy', ['plugin:war'], function() {
		var deployPath = store.get('deployPath');

		var stream = gulp.src(path.join(options.pathDist, options.name + '.war'))
			.pipe(gulp.dest(deployPath));

		gutil.log('Deploying to ' + gutil.colors.cyan(deployPath));

		stream.on('end', function() {
			store.set('deployed', true);
		});

		return stream;
	});

	gulp.task('plugin:init', function(cb) {
		new InitPrompt({
			appServerPathDefault: store.get('appServerPath') || path.join(path.dirname(CWD), 'tomcat'),
			store: store
		}, cb);
	});

	gulp.task('plugin:war', function() {
		return gulp.src(path.join(options.rootDir, '**/*'))
			.pipe(zip(options.name + '.war'))
			.pipe(gulp.dest(options.pathDist));
	});

	return function() {
		_.forEach(arguments, function(ext) {
			ext(options);
		});
	};
};
