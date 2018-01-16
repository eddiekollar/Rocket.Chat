import S from 'string';

const ROOT_URL = process.env.ROOT_URL;

//!! Set HUB port to 3030 for local developments
let hub_URL = 'http://localhost:3030/api/v1';

if (ROOT_URL.indexOf('localhost') < 0 && ROOT_URL.indexOf('staging') > -1) {
  hub_URL = 'http://staging.hub.capx.io/api/v1';
} else if (ROOT_URL.indexOf('localhost') < 0) {
  //!! production
  hub_URL = 'http://hub.capx.io/api/v1';
}

function callPOST(endpoint, data) {
  return new Promise((resolve, reject) => {
    const URL = `${hub_URL}/${endpoint}`;

    HTTP.post(URL, {data}, (error, result) => {
      if (!error) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  });
}

function callGET(endpoint) {
  return new Promise((resolve, reject) => {
    const URL = `${hub_URL}/${endpoint}`;

    HTTP.get(URL, (error, result) => {
      if (!error) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  });
}

Meteor.methods({
  'hub_permission.data_room_access'() {
    const user = Meteor.user();
    
    return true;
  },
  'inviteUser'(userId, level, teamId){
    check(userId, String);
    check(level, String);
    check(teamId, String);

    const user = Meteor.user();
    const profile = HUBProfile.findOne({'rocketChat._id': user._id});

    return callPOST(`user/${profile.userId}/action`,{name: 'invite-user', inviterId: profile.userId, userId, level, teamId})
      .then(function(result){

      }).catch(function(error){
        console.error(error);
      });
  },
  'requestRemoveUser'(userId, teamId){
    check(userId, String);
    check(teamId, String);

    const user = Meteor.user();
    const profile = HUBProfile.findOne({'rocketChat._id': user._id});

    return callPOST(`user/${profile.userId}/action`,{name: 'remove-user', requesterId: profile.userId, userId, teamId})
      .then(function(result){

      }).catch(function(error){

      });
  },
  'removeCPFromDeal'(teamId, dealRoomId) {
    check(teamId, String);
    check(dealRoomId, String);

    const user = Meteor.user();
    const profile = HUBProfile.findOne({'rocketChat._id': user._id});

    return callPOST(`user/${profile.userId}/action`,{name: 'remove-cpteam-deal', requesterId: profile.userId, teamId, dealRoomId})
      .then(function(result){

      }).catch(function(error){

      });
  },
  'changeUserLevel'(targetUserId, level, teamId){
    check(targetUserId, String);
    check(level, String);
    check(teamId, String);
 
    const user = Meteor.user();
    const profile = HUBProfile.findOne({'rocketChat._id': user._id});

    return callPOST(`user/${profile.userId}/action`,{name: 'change-user-level', requesterId: profile.userId, userId, level, teamId})
      .then(function(result){

      }).catch(function(error){

      });
  },
  'createChatSubGroup'(chatGroupId, userIds) {
    return callPOST(`chatgroup/${chatGroupId}/subgroup`,{userIds})
      .then(function(result){
        console.log(result);
        return result.data.chatGroup;
      }).catch(function(error){
        console.error(`Error calling POST chatgroup/${chatGroupId}/subgroup: `, error);
        throw Meteor.Error(error);
      });
  },
   'createDir'(name, parentDirId, dataRoomId) {
    const slug = S(name).slugify().s;
    const _id = Random.id();
    const access = {
      allUsers: true,
      dealRoomIds: [],
      teamIds: [],
      userIds: []
    };
  
    return DataRoom.update({_id: dataRoomId}, {$push: {childDirs: {_id, name, parentDirId, slug, access}}}, function (error, num) {
      console.log(error, num);
    });
  },
  'file.add'(newFile) {
    check(newFile, Object);
    const newFileId = DataRoomFiles.insert(newFile);

    return newFileId;
  }
});