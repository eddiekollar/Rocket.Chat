function broadcastMessage({dealRoomId}) {
  return swal({
    title: t('Send Message To All Providers'),
    type: 'input',
    showCancelButton: true,
    closeOnConfirm: false,
    closeOnCancel: true,
    confirmButtonText: t('Send'),
    cancelButtonText: t('Cancel'),
    html: true
  }, function(inputValue) {
    if (inputValue === false) {
      return false;
    }

    inputValue = inputValue.trim();
    
    if (inputValue === '') {
      swal.showInputError(TAPi18n.__('Please write a message'));
      return false;
    }
    
    const chatMessages = new ChatMessages();
    chatMessages.init(this);
    const dealRoom = DealRoom.findOne({_id: dealRoomId});

    ChatGroup.find({_id: {$in: dealRoom.chatGroups}}).forEach(function(chatGroup){
      const rid = chatGroup.rocketGroup._id;
      chatMessages.send(rid, {value: inputValue});
    });

    swal({
      title: 'Message Sent',
      type: 'success',
      timer: 1000,
      showConfirmButton: false
    });
  });
}

Template.dealRoomList.onCreated(function() {
  const self = this;
  self.hubProfile = new ReactiveVar();
  self.currentDealRoomId = new ReactiveVar('');
  Session.set('openBroadcast', false);

  this.autorun(function() {
    const hubInfo = Session.get('hubInfo');
    if(hubInfo && !_.isEmpty(hubInfo)) {
      const profile = HUBProfiles.findOne({userId: hubInfo.userId});
      self.hubProfile.set(profile);

      if(hubInfo.userType === 'PROVIDER') {
        const dealRoom = DealRoom.findOne({'dealSummary._id': hubInfo.dealSummaryId});
        const dealRoomId = (dealRoom) ? dealRoom._id : '';
        console.log({hubInfo}, {dealRoom})
        self.currentDealRoomId.set(dealRoomId);
      }
    }

    if(Session.get('openBroadcast')){
      broadcastMessage(Session.get('hubContext'));
      Session.set('openBroadcast', false);
    }
  });
});

function getCpUserTeam(hubUserId, cpTeamIds) {
  return Team.findOne({_id: {$in: cpTeamIds}, $or: [{ownerUserIds: {$in: [hubUserId]}}, {leadUserIds: {$in: [hubUserId]}}, {memberUserIds: {$in: [hubUserId]}}]});
}

function getUserTeamFromDealRoom(dealRoomId) {
  const hubInfo = Session.get('hubInfo');
  const dealRoom = DealRoom.findOne({_id: dealRoomId});
  let teamId = '';

  if(dealRoom) {
    if(hubInfo.userType === 'SEEKER') {
      teamId = dealRoom.csTeamId;
    } else if(hubInfo.userType === 'PROVIDER') {
      const cpTeam = getCpUserTeam(hubInfo.userId, dealRoom.cpTeamIds);
      teamId = cpTeam._id;
    }
  }
  
  return teamId;
};

function getUserTeamFromChat(hubUserId, group) {
  return Team.findOne({_id: {$in: group.teamIds}, $or: [{ownerUserIds: {$in: [hubUserId]}}, {leadUserIds: {$in: [hubUserId]}}, {memberUserIds: {$in: [hubUserId]}}]});
};

function getOtherTeam(hubProfile, group) {
  return Team.findOne({_id: {$in: group.teamIds}, companyId: {$ne: hubProfile.companyId}});
};

function getChannelLabel(group) {
  let label = '';
  const hubProfile = Template.instance().hubProfile.get();
  
  if(hubProfile) {
    otherTeam = getOtherTeam(hubProfile, group);
    label = (otherTeam && otherTeam.displayName) ? otherTeam.displayName : '';
  }
  
  return label;
};

Template.dealRoomList.helpers({
  currentDealRoomId() {
    return Template.instance().currentDealRoomId.get();
  },
  currentDealRoom() {
    const _id = Template.instance().currentDealRoomId.get();
    return DealRoom.findOne({_id});
  },
  userType(type) {
    const hubInfo = Session.get('hubInfo');
    return (hubInfo && hubInfo.userType === type);
  },
  dealRooms() {
    if(Template.instance().hubProfile.get()) {
      return DealRoom.find();
    }
  },
  getChannels(chatGroupIds) {
    const channels = ChatGroup.find({_id: {$in: chatGroupIds}}).map(function(group) {
      const name = getChannelLabel(group);
      return {_id: group.rocketGroup._id, name};
    });
    return channels;
  },
  getRoom(dealRoomId) {
    const hubProfile = Template.instance().hubProfile.get();
    const hubInfo = Session.get('hubInfo');

    if(hubInfo) {
      const chatGroup = ChatGroup.findOne({'rocketGroup._id': this._id});
      const team = getUserTeamFromChat(hubInfo.userId, chatGroup);
      const otherTeam = getOtherTeam(hubProfile, chatGroup);
      
      const sub = ChatSubscription.findOne({rid: this._id});
      sub.label = this.name;

      let csTeamId = '';
      let cpTeamId = '';

      if(hubInfo.userType === 'SEEKER') {
        csTeamId = team._id;
        cpTeamId = otherTeam._id;
      } else {
        cpTeamId = team._id;
        csTeamId = otherTeam._id;
      }

      sub.hubRoomInfo = {
        type: 'DEAL_ROOM',
        dealRoomId,
        csTeamId,
        cpTeamId
      };
      return sub;
    } else {
      return {};
    }
  },
  getUsers() {
    const hubProfile = Template.instance().hubProfile.get();
    const group = ChatGroup.findOne({'rocketGroup._id': this._id});
    const otherTeam = getOtherTeam(hubProfile, group);

    const {ownerUserIds, leadUserIds, memberUserIds} = otherTeam;
    const userIds = _.union(ownerUserIds, leadUserIds, memberUserIds);

    const users = HUBProfiles.find({userId: {$in: userIds}}).map(function(profile){
      return {name: profile.displayName, _id: profile.userId}
    });

    return users;
  }
});

Template.dealRoomList.events({
  'change #dealRoom'(event, template){
    const dealRoomId = $('#dealRoom option:selected').val();

    const dealTeamId = getUserTeamFromDealRoom(dealRoomId);
    const chatGroup = ChatGroup.findOne({teamIds: {$in: [dealTeamId]}});
    const hubProfile = template.hubProfile.get();
    const companyTeam = HUBAdapter.getUserCompanyTeam(hubProfile);

    const hubContext = {
      type: 'DEAL_ROOM',
      dealRoomId,
      dealTeamId,
      csTeamId: '',
      companyTeamId: companyTeam._id
    };
    template.currentDealRoomId.set(dealRoomId);
    Session.set('hubContext', hubContext);

    if(chatGroup) {
      FlowRouter.go(`/group/${chatGroup.rocketGroup.name}`);
    }
  },
  'click .username'(event, template) {
    const hubProfile = Template.instance().hubProfile.get();
    const parentChatId = event.target.dataset.parentchatid;
    const parentGroup = ChatGroup.findOne({'rocketGroup._id': parentChatId});
    
    const hubInfo = Session.get('hubInfo');
    const team = getUserTeamFromChat(hubInfo.userId, parentGroup);
    const otherTeam = getOtherTeam(hubProfile, parentGroup);
    

    if(hubInfo) {
      const userIds = [hubInfo.userId, this._id];
      let chatSubGroup = ChatGroup.findOne({parentId: parentGroup._id, userIds: { "$size" : userIds.length, "$all": userIds }});

      let csTeamId = '';
      let cpTeamId = '';

      if(hubInfo.userType === 'SEEKER') {
        csTeamId = team._id;
        cpTeamId = otherTeam._id;
      } else {
        cpTeamId = team._id;
        csTeamId = otherTeam._id;
      }

      const hubRoomInfo = {
        type: 'COMPANY',
        dealRoomId: '',
        cpTeamId,
        csTeamId
      };

      if(chatSubGroup) {
        Session.set('hubRoomInfo', hubRoomInfo);
        FlowRouter.go(`/group/${chatSubGroup.rocketGroup.name}`);
      }else {
        Meteor.call('createChatSubGroup', parentGroup._id, userIds, function(error, result){
          if(!error) {
            chatSubGroup = result;
            Session.set('hubRoomInfo', hubRoomInfo);
            FlowRouter.go(`/group/${chatSubGroup.rocketGroup.name}`);
          }
        });
      }
    }
  },
  'click .sidebar-deal_room__menu'(e, template) {
    const hubInfo = Session.get('hubInfo');

    const canManage = () => { return true; };
    const canBroadcast = function() {
      return hubInfo.userType === 'SEEKER';
    };
    e.preventDefault();
    let items = [];
    const manageItem = {
      icon: 'team',
      name: t('Manage Team'),
      type: 'deal-room-manage-team',
      id: 'manage'
    };
    const broadcastItem = {
      icon: 'message',
      name: t('Broadcast Message'),
      type: 'deal-room-broadcast',
      id: 'broadcast'
    };
    if(canManage()) {
      items.push(manageItem);
    }
    if(canBroadcast()) {
      items.push(broadcastItem);
    }
    const config = {
      popoverClass: 'sidebar-item',
      columns: [
        {
          groups: [
            {
              items
            }
          ]
        }
      ],
      mousePosition: {
        x: e.clientX,
        y: e.clientY
      },
      data: {
        chatGroups: this.chatGroups,
        csTeamId: this.csTeamId
      }
    };

    popover.open(config);
    const dealRoomId = $(e.target).parent().attr('id');
    const dealTeamId = getUserTeamFromDealRoom(dealRoomId);
    const hubProfile = Template.instance().hubProfile.get();
    const companyTeam = HUBAdapter.getUserCompanyTeam(hubProfile);

    const hubContext = {
      type: 'DEAL_ROOM',
      dealRoomId,
      dealTeamId,
      csTeamId: '',
      companyTeamId: companyTeam._id
    };
    Session.set('hubContext', hubContext);
  }
});