Session.setDefault('HUB', {});
Session.setDefault('HUBProfile', {});

Tracker.autorun(function() {
  const hubInfo = Session.get('hubInfo');
  const rocketChatId = Meteor.userId();

  if(hubInfo && !_.isEmpty(hubInfo) && rocketChatId) {
    if(hubInfo.userType === 'SEEKER') {
      const hubId = hubInfo.hubId;

      Meteor.subscribe('hub.get', hubId,function() {
        const profile = HUBProfiles.findOne({'rocketChat._id': rocketChatId});
        const hub = HUB.findOne({_id: hubId});
        Session.set('HUB', hub);
        Session.set('HUBProfile', profile);
      });
    } else if(hubInfo.userType === 'PROVIDER') {
      Meteor.subscribe('dealRooms.get', function() {
        const profile = HUBProfiles.findOne({'rocketChat._id': rocketChatId});
        Session.set('HUBProfile', profile);
      });
    }
  }
});