Package.describe({
  name: 'capx-hub-adapter',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  numeral: '2.0.6'
});

Package.onUse(function(api) {
  api.versionsFrom('1.5.2.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('underscore');
  api.use('check');
  api.use('templating');
  api.use('kadira:flow-router', 'client');
  api.use('reywood:publish-composite','server');

  api.addFiles('client/dealRoomList.html', 'client');
  api.addFiles('client/dealRoomList.js', 'client');
  api.addFiles('lib/collections.js');
  api.addFiles('lib/functions.js');
  api.addFiles('server/publications.js','server');

  api.export('HUB');
  api.export('HUBProfiles');
  api.export('DealRoom');
  api.export('ChatGroup');
  api.export('Team');
  api.export('HUBAdapter');
  // api.mainModule('capx-hub-adapter.js');
});

// Package.onTest(function(api) {
//   api.use('ecmascript');
//   api.use('tinytest');
//   api.use('capx-hub-adapter');
//   api.mainModule('capx-hub-adapter-tests.js');
// });
