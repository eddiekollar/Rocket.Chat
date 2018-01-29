Template.hubRoomTitle.onCreated(function() {
  const rid = this.data._id;
  const rocketChatId = Meteor.userId();
  this.chatGroup = new ReactiveVar(ChatGroup.findOne({'rocketGroup._id': rid}));
  this.hubProfile = new ReactiveVar(HUBProfiles.findOne({'rocketChat._id': rocketChatId}));
});

Template.hubRoomTitle.helpers({
  otherPartyName() {
    const chatGroup = Template.instance().chatGroup.get();
    const hubProfile = Template.instance().hubProfile.get();
    const hubInfo = Session.get('hubInfo');
    const hubRoomInfo = Session.get('hubRoomInfo');
    let displayName = '';

    if(hubRoomInfo && hubProfile && chatGroup && chatGroup.type) {
      if(chatGroup.type === 'DIRECT_MESSAGES') {
        const otherUserId = _.without(chatGroup.userIds, hubProfile.userId)[0];
        console.log(chatGroup.userIds, hubProfile.userId, otherUserId)
        const otherProfile = HUBProfiles.findOne({userId: otherUserId});
        displayName = ` ${otherProfile.displayName}`;
      } else if(chatGroup.type === 'DEAL_ROOM_CHAT') {
        let otherTeamId = '';
        
        if(hubInfo.userType === 'SEEKER') {
          otherTeamId = hubRoomInfo.cpTeamId;
        } else {
          otherTeamId = hubRoomInfo.csTeamId;
        }

        const otherTeam = Team.findOne({_id: otherTeamId});
        displayName = ` ${otherTeam.displayName}`;
      }
    }

    return displayName;
  },
  roomIcon() {
    const chatGroup = Template.instance().chatGroup.get();
    let icon = '';

    if(chatGroup && chatGroup.type) {
      if(chatGroup.type === 'COMPANY_CHAT' || chatGroup.type === 'DEAL_ROOM_CHAT' || chatGroup.type === 'SUB_GROUP'){
        icon = 'team';
      } else if(chatGroup.type === 'DIRECT_MESSAGES') {
        icon = 'user';
      }
    }
    return icon;
  },
  roomName(){
    const chatGroup = Template.instance().chatGroup.get();
    const displayName = (chatGroup && chatGroup.displayName) ? chatGroup.displayName : 'Chat Room';
    return displayName;
  }
})