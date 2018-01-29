Template.companyRoom.onCreated(function() {
  const self = this;
  self.companyTeam = new ReactiveVar({});
  self.chatGroup = new ReactiveVar({});

  this.autorun(function() {
    const hubInfo = Session.get('hubInfo');
    const profile = HUBProfiles.findOne({userId: hubInfo.userId});
    
    if(!_.isEmpty(profile)) {
      const companyTeam = Team.findOne({type: 'COMPANY', companyId: profile.companyId});
      
      if(companyTeam) {
        const companyChat = ChatGroup.findOne({teamIds: {$in: [companyTeam._id]}});
        self.companyTeam.set(companyTeam);
        self.chatGroup.set(companyChat);

        FlowRouter.go(`/group/${companyChat.rocketGroup.name}`);
      }
    }
  });
});

Template.companyRoom.events({
  'click .username'(event, template) {

    const parentGroup = template.chatGroup.get();
    const parentGroupId = parentGroup._id;
    const hubInfo = Session.get('hubInfo');
    const companyTeam = Template.instance().companyTeam.get();

    if(hubInfo && companyTeam) {
      const userIds = [hubInfo.userId, this._id];
      let chatSubGroup = ChatGroup.findOne({parentId: parentGroupId, userIds: { "$size" : userIds.length, "$all": userIds }});
      let csTeamId = '';
      let cpTeamId= '';

      if(hubInfo.userType === 'SEEKER') {
        csTeamId = companyTeam._id;
      } else {
        cpTeamId = companyTeam._id;
      }

      const hubRoomInfo = {
        type: 'COMPANY',
        dealRoomId: '',
        csTeamId,
        cpTeamId
      };

      if(chatSubGroup) {
        Session.set('hubRoomInfo', hubRoomInfo);
        FlowRouter.go(`/group/${chatSubGroup.rocketGroup.name}`);
      }else {
        Meteor.call('createChatSubGroup', parentGroupId, userIds, function(error, result){
          if(!error) {
            chatSubGroup = result;
            Session.set('hubRoomInfo', hubRoomInfo);
            FlowRouter.go(`/group/${chatSubGroup.rocketGroup.name}`);
          }
        });
      }
    }
  }
});

Template.companyRoom.helpers({
  teamMembers() {
    const hubInfo = Session.get('hubInfo');
    let users = [];

    if(!_.isEmpty(hubInfo)) {
      const {ownerUserIds, leadUserIds, memberUserIds} = Template.instance().companyTeam.get();
      const teamUserIds = _.filter(_.union(ownerUserIds, leadUserIds, memberUserIds), function(id) { return id !== hubInfo.userId} );
      
      users = HUBProfiles.find({userId: {$in: teamUserIds}}).map(function(profile){
        return {name: profile.displayName, _id: profile.userId}
      });
    } 
    
    return users;
  },
  getRoom() {
    const companyTeam = Template.instance().companyTeam.get();
    const hubInfo = Session.get('hubInfo');

    if(hubInfo && !_.isEmpty(companyTeam)) {
      const group = ChatGroup.findOne({teamIds: {$in: [companyTeam._id]}});
      const rid = group.rocketGroup._id;
      const sub = ChatSubscription.findOne({rid});
      let csTeamId = '';
      let cpTeamId= '';

      if(hubInfo.userType === 'SEEKER') {
        csTeamId = companyTeam._id;
      } else {
        cpTeamId = companyTeam._id;
      }

      sub.label = 'Company Chat Room';
      sub.hubRoomInfo = {
        type: 'COMPANY',
        dealRoomId: '',
        csTeamId,
        cpTeamId
      };
      return sub;
    } else {
      return {};
    }
  }
})