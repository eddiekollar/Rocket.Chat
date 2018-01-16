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
  numeral: '2.0.6',
  'vanilla-modal': '1.6.5',
  'simple-popup-modal': '1.1.0',
  'aws-sdk': '2.157.0',
  'string': '3.3.3'
});

Package.onUse(function(api) {
  api.versionsFrom('1.5.2.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('underscore');
  api.use('check');
  api.use(['http',
           'templating',
           'tracker',
           'reactive-var',
           'rocketchat:lib',
           'session',
           'random']);
  api.use('kadira:flow-router', 'client');         
  api.use('ostrio:files');
  api.use('reywood:publish-composite','server');

  api.addFiles('client/dataController.js','client');
  api.addFiles('client/hub-styles.css','client');
  api.addFiles('client/chatRoomTabBar.js', 'client');
  api.addFiles('client/fileUpload.html', 'client');
  api.addFiles('client/fileUpload.js', 'client');
  api.addFiles('client/dataRoom.html', 'client');
  api.addFiles('client/dataRoom.js', 'client');
  api.addFiles('client/dataRoom/permissions.html', 'client');
  api.addFiles('client/dataRoom/permissions.js', 'client');
  api.addFiles('client/hubUserInfo.html', 'client');
  api.addFiles('client/hubUserInfo.js', 'client');
  api.addFiles('client/teamMembersList.html', 'client');
  api.addFiles('client/teamMembersList.js', 'client');
  api.addFiles('client/dealRoomList.html', 'client');
  api.addFiles('client/dealRoomList.js', 'client');
  api.addFiles('client/companyRoom.html', 'client');
  api.addFiles('client/companyRoom.js', 'client');
  api.addFiles('client/chatRoom/hubRoomTitle.html', 'client');
  api.addFiles('client/chatRoom/hubRoomTitle.js', 'client');
  api.addFiles('client/hubNav.html', 'client');
  api.addFiles('client/hubNav.js', 'client');
  api.addFiles('client/iframe_listener.js', 'client');
  api.addFiles('lib/collections.js');
  api.addFiles('lib/functions.js');
  api.addFiles('server/filesCollection.js', 'server');
  api.addFiles('server/publications.js','server');
  api.addFiles('server/methods.js','server');

  api.export('HUB');
  api.export('HUBProfiles');
  api.export('DataRoom');
  api.export('DataRoomFiles');
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
