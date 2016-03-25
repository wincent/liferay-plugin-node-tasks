'use strict';

var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');

gulp.task('pre-test', function () {
	return gulp.src(['index.js', 'lib/*.js'])
		.pipe(istanbul())
		.pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
	return gulp.src(['test/index.js', 'test/lib/*.js'])
		.pipe(mocha({
			timeout: 4000
		}))
		.pipe(istanbul.writeReports());
});