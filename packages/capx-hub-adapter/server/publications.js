
import { publishComposite } from 'meteor/reywood:publish-composite';
import {check} from 'meteor/check';

Meteor.publish('profile.get', function() {
  return HUBProfiles.find({'rocketChat._id': this.userId});
});

Meteor.publishComposite('hub.get', function(hubId) {
  check(hubId, String);

  const profile = HUBProfiles.findOne({'rocketChat._id': this.userId});
  const companyId = (profile && profile.companyId) ? profile.companyId : '';

  return {
    find(){
      return HUB.find({_id: hubId, companyId});
    },
    children: [
      {
        find(hub) {
          return Team.find({type: 'COMPANY', companyId});
        },
        children: [
          {
            find(team) {
              return Assignments.find({'assignedTeamId': team._id, completed: false});
            }
          },
          {
            find(team) {
              const userIds = _.union(team.ownerUserIds, team.leadUserIds, team.memberUserIds);
              return HUBProfiles.find({userId: {$in: userIds}});
            }
          },
          {
            find(team) {
              return ChatGroup.find({teamIds: {$in: [team._id]}});
            },
            children: [
              {
                find(group) {
                  return ChatGroup.find({parentId: group._id});
                }
              }
            ]
          }
        ]
      },
      {
        find(hub) {
          return DealRoom.find({hubId: hub._id});
        },
        children: [
          {
            find(dealRoom) {
              return ChatGroup.find({_id: {$in: dealRoom.chatGroups}});
            },
            children: [
              {
                find(group) {
                  return ChatGroup.find({parentId: group._id});
                }
              },
              {
                find(group) {
                  return Team.find({_id: {$in: group.teamIds}});
                },
                children: [
                  {
                    find(team) {
                      const userIds = _.union(team.ownerUserIds, team.leadUserIds, team.memberUserIds);
                      return HUBProfiles.find({userId: {$in: userIds}});
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
});

Meteor.publishComposite('dataRoom.get', function(hubId) {
  check(hubId, String);
  
  const profile = HUBProfiles.findOne({'rocketChat._id': this.userId});
  const companyId = (profile && profile.companyId) ? profile.companyId : '';

  return {
    find() {
      return HUB.find({_id: hubId, companyId});
    },
    children: [
      {
        find(hub) {
          return DataRoom.find({_id: hub.dataRoomId});
        },
        children: [
          {
            find(dataRoom) {
              let dirIds = _.pluck(dataRoom.childDirs, '_id');
              dirIds.push(dataRoom._id);
              return DataRoomFiles.find({parentDirId: {$in: dirIds}, dataRoomId: dataRoom._id});
            },
            children: [
              {
                find(dataRoomFile) {
                  return Files.find({_id: dataRoomFile.fileId}).cursor;
                }
              }
            ]
          }
        ]
      }
    ]
  }
});

Meteor.publishComposite('dealRooms.get', function() {
  const profile = HUBProfiles.findOne({'rocketChat._id': this.userId});
  const companyId = (profile && profile.companyId) ? profile.companyId : '';

  const teamCursor = Team.find({$or: [{ownerUserIds: {$in: [profile.userId]}}, {leadUserIds: {$in: [profile.userId]}}, {memberUserIds: {$in: [profile.userId]}}]});
  const teamIds = teamCursor.map(function(team) { return team._id});

  return {
    find() {
      return Team.find({_id: {$in: teamIds}});
    },
    children: [
      {
        find(team) {
          const userIds = _.union(team.ownerUserIds, team.leadUserIds, team.memberUserIds);
          return HUBProfiles.find({userId: {$in: userIds}});
        }
      },
      {
        find(team) {
          return DealRoom.find({cpTeamIds: {$in: [team._id]}});
        }
      },
      {
        find(team) {
          return ChatGroup.find({teamIds: {$in: [team._id]}});
        },
        children: [
          {
            find(group) {
              return Team.find({_id: {$in: group.teamIds}});
            }
          },
          {
            find(group) {
              return HUBProfiles.find({userId: {$in: group.userIds}});
            }
          },
          {
            find(group) {
              return ChatGroup.find({parentId: group._id})
            }
          }
        ]
      }
    ]
  }
});

function hasObjAccess(objAccess, userId, teamId, dealRoomId) {
  let hasAccess = false;
  if(objAccess) {
    const {allUsers, dealRoomIds, teamIds, userIds} = objAccess;

    const isDealRoomPermitted = dealRoomIds.indexOf(dealRoomId) > -1;
    const teamPermitted = teamIds.indexOf(teamId) > -1;
    const isUserLevelPermitted = userIds.indexOf(userId) >-1;

    hasAccess = (allUsers || isDealRoomPermitted && teamPermitted || isUserLevelPermitted);
  }

  return hasAccess;
}

function getAccessDirsIds(userId, teamId, dealRoomId, rootDirId, currentDirId, dirs) {
  let dirIds = [];
  let remainindDirs = [];

  if(rootDirId === currentDirId) {
    dirIds = _.pluck(dirs, '_id');
    remainingDirs = dirs;
  }else {
    const currentDir = _.findWhere(dirs, {_id: currentDirId});
    const hasAccess = hasObjAccess(currentDir.access, userId, teamId, dealRoomId);
    if(hasAccess) {
      dirIds = _.pluck(_.findWhere(dirs, {parentDirId: currentDir}), '_id');
      remainingDirs = dirs;
    }
  }

  return dirIds;
}

function getAllDirIds({userId, teamId, dealRoomId, rootDirId, currentDirId, dirs}) {
  const dirIds = getAccessDirsIds(userId, teamId, dealRoomId, rootDirId, currentDirId, dirs);
  if(dirIds.length > -1) {
    const childDirIds = _.map(dirIds, function(id){
      return getAllDirIds({userId, teamId, dealRoomId, rootDirId, currentDirId: id, dirs});
    });
    return _.unique(_.union(dirIds, childDirIds));
  }else{
    return [];
  }
}

Meteor.publishComposite('dataRoom.byDealRoom.cp', function(dealRoomId, teamId) {
  check(dealRoomId, String);
  check(teamId, String);
  
  const profile = HUBProfiles.findOne({'rocketChat._id': this.userId});
  const team = Team.findOne({_id: teamId});

  if(profile && team){
    const {ownerUserIds, leadUserIds, memberUserIds} = team;
    const {userId} = profile;
    
    const isTeamMember = ((ownerUserIds.indexOf(userId) > -1) || (leadUserIds.indexOf(userId) > -1) || (memberUserIds.indexOf(userId) > -1));
    const dealRoom = DealRoom.findOne({_id: dealRoomId, cpTeamIds: {$in: [teamId]}});

    if(dealRoom && isTeamMember){
      return {
        find() {
          return HUB.find({_id: dealRoom.hubId});
        },
        children: [
        {
          find(hub) {
            return DataRoom.find({_id: hub.dataRoomId});
          },
          children: [
            {
              find(dataRoom) {
                const data = {
                  userId: this.userId,
                  teamId,
                  dealRoomId: dealRoom._id,
                  rootDirId: dataRoom._id,
                  currentDirId: dataRoom._id,
                  dirs: dataRoom.childDirs
                };
                const dirIds = getAllDirIds(data);
                let accessibleFileIds = DataRoomFiles.find({dataRoomId: dataRoom._id, parentDirId: {$in: dirIds}}).map(function(file) {
                  const hasAccess = hasObjAccess(file.access, this.userId, teamId, dealRoom._id);
                  if(hasAccess) {
                    return file._id;
                  } else {
                    return '';
                  }
                });
                accessibleFileIds = _.filter(accessibleFileIds, function(id) { return id !== ''; });
                return DataRoomFiles.find({_id: {$in: accessibleFileIds}});
              }
            }
          ]
        }]
      };
    }else{
      throw Meteor.Error('Not Authorized');
    }
  }else{
    throw Meteor.Error('Not Found');
  }
})

Meteor.publishComposite('dataRoom.getAll', function(hubId) { 
  check(hubId, String);
  const user = Meteor.users.findOne({_id: this.userId});

  if(user) {
    return {
      find() {
        return HUB.find({_id: hubId});
      },
      children: [
        {
          find(hub) {
            return DataRoom.find({_id: hub.dataRoomId});
          },
          children: [
            {
              find(dataRoom) {
                let dirIds = _.pluck(dataRoom.childDirs, '_id');
                dirIds.push(dataRoom._id);
                return DataRoomFiles.find({parentDirId: {$in: dirIds}, dataRoomId: dataRoom._id});
              }
            }
          ]
        }
      ]
    }
  }
  else {
    throw Meteor.Error('Not authorized');
  }
});

Meteor.publishComposite('assignments', function() { 
  const profile = HUBProfiles.findOne({'rocketChat._id': this.userId});
  const hubUser= HUBUsers.findOne({_id: profile.userId});
  
  const role = hubUser.roles[0];
  
  const teamCursor = Team.find({$or: [{ownerUserIds: {$in: [profile.userId]}}, {leadUserIds: {$in: [profile.userId]}}, {memberUserIds: {$in: [profile.userId]}}]});
  const teamIds = teamCursor.map(function(team) { return team._id});
  
  if(role === 'SEEKER') {
    return { 
      find() {
        return Assignments.find({assignedTeamId: {$in: teamIds}, completed: false}); 
      },children: [
        {
          find(assignment) {
            return HUBProfiles.find({userId: assignment.task.userId});
          }
        }
      ]
    }
  } if(role === 'PROVIDER') { 
    return {
      find() {
        return Assignments.find({'task.teamId': {$in: teamIds}, completed: false});
      }
    }
  } else{
    return {
      find(){
        this.read();
      }
    }
  }
});