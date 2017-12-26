
let hubMongoDriver;

if(Meteor.isServer) {
  import { MongoInternals } from 'meteor/mongo';

  const HUB_MONGO_URL = 'mongodb://127.0.0.1:3031/meteor';
  hubMongoDriver = new MongoInternals.RemoteCollectionDriver(HUB_MONGO_URL);
}

HUB = new Mongo.Collection('HUB',  { _driver: hubMongoDriver });
HUBProfiles = new Mongo.Collection('HUBProfiles',  { _driver: hubMongoDriver });
DealRoom = new Mongo.Collection('DealRoom',  { _driver: hubMongoDriver });
ChatGroup = new Mongo.Collection('ChatGroup',  { _driver: hubMongoDriver });
Team = new Mongo.Collection('Team',  { _driver: hubMongoDriver });