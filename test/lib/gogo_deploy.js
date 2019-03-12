'use strict';

var _ = require('lodash');
var GogoShellHelper = require('gogo-shell-helper');
var path = require('path');
var sinon = require('sinon');

var GogoDeployer = require('../../lib/gogo_deploy').GogoDeployer;

var helper;
var prototype;

beforeAll(function() {
	helper = GogoShellHelper.start({
		commands: [
			{
				command: 'install webbundle',
				response: 'Bundle ID: 123'
			}
		],
		host: '0.0.0.0',
		port: 1337
	});
});

afterAll(function(done) {
	try {
		helper.close(done);
	}
	catch (err) {
		done();
	}
});

beforeEach(function() {
	prototype = _.create(GogoDeployer.prototype);
});

test('constructor should set connect config', function() {
	var gogoDeployer = new GogoDeployer({
		connectConfig: {
			port: 1234
		}
	});

	expect(gogoDeployer.connectConfig).toEqual({
		port: 1234
	});

	expect(!gogoDeployer.ready).toBe(true);

	gogoDeployer = new GogoDeployer();

	expect(!gogoDeployer.connectConfig).toBe(true);
});

test('deploy should run sequence of commands', function(done) {
	var gogoDeployer = new GogoDeployer({
		connectConfig: {
			host: '0.0.0.0',
			port: 1337
		}
	});

	gogoDeployer.deploy()
		.then(function(data) {
			expect(data.indexOf('start 123') > -1).toBe(true);

			gogoDeployer.destroy();

			done();
		});
});

test('_formatWebBundleURL should create web bundle install command', function() {
	var webBundleURL = prototype._formatWebBundleURL('/some/path/to/file.war', 'context-path');

	expect(webBundleURL).toBe('webbundle:file:///some/path/to/file.war?Web-ContextPath=/context-path');
});

test('_formatWebBundleURL should properly format windows path', function() {
	var sep = path.sep;

	path.sep = '\\';

	prototype._isWin = function() {
		return true;
	};

	var webBundleURL = prototype._formatWebBundleURL('c:\\some\\path\\to\\file.war', 'context-path');

	expect(webBundleURL).toBe('webbundle:file:/c:/some/path/to/file.war?Web-ContextPath=/context-path');

	path.sep = sep;
});

test('_formatWebBundleURL should escape whitespace', function() {
	var webBundleURL = prototype._formatWebBundleURL('/Users/person/path to/theme.war', 'context-path');

	expect(webBundleURL).toBe(
        'webbundle:file:///Users/person/path%20to/theme.war?Web-ContextPath=/context-path'
    );
});

test('_getWebBundleIdFromResponse should either return web bundle id from response data or return 0', function() {
	var webBundleId = prototype._getWebBundleIdFromResponse('Here is some data\n g!');

	expect(webBundleId).toBe(0);

	webBundleId = prototype._getWebBundleIdFromResponse('Bundle ID: 123 \n g!');

	expect(webBundleId).toBe('123');

	webBundleId = prototype._getWebBundleIdFromResponse('123\nBundle ID: 456 \n 123 g!');

	expect(webBundleId).toBe('456');
});

test('_installWebBundle should call sendCommand with formatted install command string', function() {
	prototype.sendCommand = sinon.stub().returns('promise');

	var promise = prototype._installWebBundle('/some/path/to/file.war', 'context-path');

	expect(promise).toBe('promise');

	expect(
        prototype.sendCommand.calledWith('install', 'webbundle:file:///some/path/to/file.war?Web-ContextPath=/context-path')
    ).toBe(true);
});

test('_startBundle should call sendCommand with bundle id arg', function() {
	prototype.sendCommand = sinon.stub().returns('promise');

	var promise = prototype._startBundle('123');

	expect(promise).toBe('promise');

	expect(prototype.sendCommand.calledWith('start', '123')).toBe(true);
});
