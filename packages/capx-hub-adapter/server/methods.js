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

function removeDescendants(dirId, dirs, removeDirIds) {
  removeDirIds.push(dirId);
  const removeDirs = _.where(dirs, {parentDirId: dirId});
  if (removeDirs.length > 0) {
    const ids = removeDirs.map(function(dir){
      return removeDescendants(dir._id, dirs, removeDirIds);
    });
    return _.union(removeDirIds, _.flatten(ids));
  } else {
    return removeDirIds;
  }
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

    console.log('inviteUser', userId, level, teamId);

    const user = Meteor.user();
    const profile = HUBProfiles.findOne({'rocketChat._id': user._id});

    return callPOST(`user/${profile.userId}/action`,{name: 'invite-user', inviterId: profile.userId, userId, level, teamId})
      .then(function(result){
        console.log(result);
      }).catch(function(error){
        console.error(error);
      });
  },
  'approveUser'(assignmentId){
    check(assignmentId, String);

    const user = Meteor.user();
    const profile = HUBProfiles.findOne({'rocketChat._id': user._id});

    return callPOST(`user/${profile.userId}/action`,{name: 'approve-user', userId: user._id, assignmentId})
      .then(function(result){
        console.log(result);
      }).catch(function(error){
        console.error(error);
      });
  },
  'requestRemoveUser'(userId, teamId){
    check(userId, String);
    check(teamId, String);

    const user = Meteor.user();
    const profile = HUBProfiles.findOne({'rocketChat._id': user._id});

    return callPOST(`user/${profile.userId}/action`,{name: 'remove-user', requesterId: profile.userId, userId, teamId})
      .then(function(result){

      }).catch(function(error){
        console.error(error);
      });
  },
  'removeCPFromDeal'(teamId, dealRoomId) {
    check(teamId, String);
    check(dealRoomId, String);

    const user = Meteor.user();
    const profile = HUBProfiles.findOne({'rocketChat._id': user._id});

    return callPOST(`user/${profile.userId}/action`,{name: 'remove-cpteam-deal', requesterId: profile.userId, teamId, dealRoomId})
      .then(function(result){

      }).catch(function(error){
        console.error(error);
      });
  },
  'changeUserLevel'(targetUserId, level, teamId){
    check(targetUserId, String);
    check(level, String);
    check(teamId, String);
 
    const user = Meteor.user();
    const profile = HUBProfiles.findOne({'rocketChat._id': user._id});

    return callPOST(`user/${profile.userId}/action`,{name: 'change-user-level', requesterId: profile.userId, userId, level, teamId})
      .then(function(result){

      }).catch(function(error){
        console.error(`Error calling POST user/${profile.userId}/action: `, error);
        throw Meteor.Error(error);
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
  'dir.create'(name, parentDirId, dataRoomId) {
    check(name, String);
    check(parentDirId, String);
    check(dataRoomId, String);

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
  'dir.delete'(dataRoomId, dirId){
    check(dataRoomId, String);
    check(dirId, String);

    const dataRoom = DataRoom.findOne({_id: dataRoomId});
    let dirs = dataRoom.childDirs;

    const dir = _.findWhere(dirs, {_id: dirId});
    const dirIds = removeDescendants(dirId,  _.without(dirs, dir), [])

    DataRoomFiles.find({parentDirId: {$in: dirIds}}).forEach(function (file) {
      Files.remove({_id: file.fileId}, function(error) {
        if(error) {
          console.error(error)
        }
        DataRoom.remove({_id: file._id});
      })
    });

    dirs = _.filter(dirs, d => dirIds.indexOf(d._id) < 0);
    DataRoom.update({_id: dataRoomId},{$set: {childDirs: dirs}});
    return true;
  },
  'file.add'(newFile) {
    check(newFile, Object);
    const newFileId = DataRoomFiles.insert(newFile);

    return newFileId;
  },
  'file.delete'(fileId) {
    check(fileId, String);

    Files.remove({_id: fileId}, function(error) {
      if(error) {
        return false;
      }
      DataRoomFiles.remove({fileId});
      return true;
    })
  }
});