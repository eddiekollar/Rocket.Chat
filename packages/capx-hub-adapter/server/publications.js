
import { publishComposite } from 'meteor/reywood:publish-composite';
import {check} from 'meteor/check';
// import { HUB, HUBProfiles } from '../lib/collections';

Meteor.publish('profile.get', function() {
  console.log('getting profile...');
  return HUBProfiles.find({'rocketChat._id': this.userId});
});

Meteor.publishComposite('hub.get', function() {
  const profile = HUBProfiles.findOne({'rocketChat._id': this.userId});
  const companyId = (profile && profile.companyId) ? profile.companyId : '';

  return {
    find(){
      return HUB.find({companyId});
    },
    children: [
      {
        find(hub) {
          return Team.find({type: 'COMPANY', companyId});
        },
        children: [
          {
            find(team) {
              const userIds = _.union(team.ownerUserIds, team.leadUserIds, team.memberUserIds);
              return HUBProfiles.find({userId: {$in: userIds}});
            }
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