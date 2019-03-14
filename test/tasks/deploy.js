'use strict';

var chai = require('chai');
var del = require('del');
var fs = require('fs-extra');
var GogoShellHelper = require('gogo-shell-helper');
var Gulp = require('gulp').Gulp;
var os = require('os');
var path = require('path');
var sinon = require('sinon');

var gulp = new Gulp();

chai.use(require('chai-fs'));

var assert = chai.assert;

var tempPath = path.join(os.tmpdir(), 'liferay-plugin-tasks', 'deploy-task', 'test-plugin-layouttpl');

var deployPath = path.join(tempPath, '../appserver/deploy');

var helper;
var initCwd = process.cwd();
var registerTasks;
var runSequence;

beforeAll(function(done) {
	fs.copy(path.join(__dirname, '../fixtures/plugins/test-plugin-layouttpl'), tempPath, function(err) {
		if (err) {
			throw err;
		}

		process.chdir(tempPath);

		registerTasks = require('../../index').registerTasks;

		registerTasks({
			gulp: gulp,
			gogoShellConfig: {
				host: '0.0.0.0',
				port: 1337
			}
		});

		runSequence = require('run-sequence').use(gulp);

		var store = gulp.storage;

		store.set('deployPath', deployPath);

		fs.mkdirsSync(deployPath);

		helper = GogoShellHelper.start({
			commands: [
				{
					command: 'install webbundle',
					response: 'Bundle ID: 123'
				},
				{
					command: 'lb -u',
					response: '501|Active     |    1|webbundle:file:/portal/osgi/war/april-13-theme.war?Web-ContextPath=/april-13-theme'
				}
			]
		});

		done();
	});
});

afterAll(function(done) {
	del([path.join(tempPath, '**')], {
		force: true
	}).then(function() {
		process.chdir(initCwd);

		done();
	});
});

afterEach(function() {
	del.sync(path.join(deployPath, '**'), {
		force: true
	});
});

test(
    'deploy task should deploy war file to specified appserver',
    function(done) {
        runSequence('deploy', function() {
            assert.isFile(path.join(deployPath, 'test-plugin-layouttpl.war'));

            expect(gulp.storage.get('deployed')).toBe(true);

            done();
        });
    }
);

test(
    'plugin:deploy-gogo should attempt to deploy via gogo shell',
    function(done) {
        runSequence('deploy:gogo', function() {
            done();
        });
    }
);

test('plugin:deploy-gogo should log error', function(done) {
	helper.setCommands([
		{
			command: 'install webbundle'
		},
		{
			command: 'start'
		}
	]);

	var gutil = require('gulp-util');

	var log = gutil.log;

	gutil.log = sinon.spy();

	runSequence('deploy:gogo', function() {
		expect(gutil.log.getCall(0).args[0].indexOf('Something went wrong') > -1).toBe(true);

		gutil.log = log;

		done();
	});
});

test(
    'plugin:deploy-gogo should log error due to disconnection',
    function(done) {
        helper.close(function() {
            var gutil = require('gulp-util');

            var log = gutil.log;

            gutil.log = sinon.spy();

            runSequence('plugin:war', 'plugin:deploy-gogo', function() {
                expect(gutil.log.getCall(0).args[0].indexOf('ECONNREFUSED') > -1).toBe(true);

                gutil.log = log;

                done();
            });
        });
    }
);
