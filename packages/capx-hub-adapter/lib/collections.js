
let hubMongoDriver;

if(Meteor.isServer) {
  import { MongoInternals } from 'meteor/mongo';
  const HUB_MONGO_URL = process.env.HUB_MONGO_URL || 'mongodb://127.0.0.1:3031/meteor';

  hubMongoDriver = new MongoInternals.RemoteCollectionDriver(HUB_MONGO_URL);
}

HUB = new Mongo.Collection('HUB',  { _driver: hubMongoDriver });
HUBUsers = new Mongo.Collection('users',  { _driver: hubMongoDriver, _suppressSameNameError: true });
HUBProfiles = new Mongo.Collection('HUBProfiles',  { _driver: hubMongoDriver });
DealRoom = new Mongo.Collection('DealRoom',  { _driver: hubMongoDriver });
DataRoom = new Mongo.Collection('DataRoom',  { _driver: hubMongoDriver });
DataRoomFiles = new Mongo.Collection('DataRoomFiles', { _driver: hubMongoDriver });
ChatGroup = new Mongo.Collection('ChatGroup',  { _driver: hubMongoDriver });
Team = new Mongo.Collection('Team',  { _driver: hubMongoDriver });
Permissions = new Mongo.Collection('y_Permissions',  { _driver: hubMongoDriver });
Approvals = new Mongo.Collection('Approvals',  { _driver: hubMongoDriver });
Assignments = new Mongo.Collection('Assignments',  { _driver: hubMongoDriver });

if(Meteor.isClient) {
  Files = new FilesCollection({
    collectionName: 'Files'
  });
}