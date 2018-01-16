function getUserTeam(hubProfile, group) {
  return Team.findOne({_id: {$in: group.teamIds}, $or: [{ownerUserIds: {$in: [hubProfile.userId]}}, {leaderUserIds: {$in: [hubProfile.userId]}}, {memberUserIds: {$in: [hubProfile.userId]}}]});
}

function getOtherTeam(hubProfile, group) {
  return Team.findOne({_id: {$in: group.teamIds}, companyId: {$ne: hubProfile.companyId}});
}

function getChannelLabel(group) {
  let label = '';
  const hubProfile = Template.instance().hubProfile.get();
  
  if(hubProfile) {
    otherTeam = getOtherTeam(hubProfile, group);
    label = (otherTeam && otherTeam.displayName) ? otherTeam.displayName : '';
  }
  
  return label;
}

Template.dealRoomList.helpers({
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
    const profile = Template.instance().hubProfile.get();
    if(profile) {
      const chatGroup = ChatGroup.findOne({'rocketGroup._id': this._id});
      const team = getUserTeam(profile, chatGroup);
      
      const sub = ChatSubscription.findOne({rid: this._id});
      sub.label = this.name;
      sub.hubRoomInfo = {
        type: 'DEAL_ROOM',
        dealRoomId,
        teamId: team._id
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
  'click .username'(event, template) {
    const parentChatId = event.target.dataset.parentchatid;
    const parentGroup = ChatGroup.findOne({'rocketGroup._id': parentChatId});
    const parentGroupId = parentGroup._id;
    const hubInfo = Session.get('hubInfo');

    if(hubInfo) {
      const userIds = [hubInfo.userId, this._id];
      let chatSubGroup = ChatGroup.findOne({parentId: parentGroupId, userIds: { "$size" : userIds.length, "$all": userIds }});

      const hubRoomInfo = {
        type: 'COMPANY',
        dealRoomId: ''
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
  },
  'click .sidebar-deal_room__menu'(e, instance) {
    const canEdit = () => {
      //!! Check permission

      return true;
    };
    e.preventDefault();
    const editItem = {
      icon: 'team',
      name: t('Edit Users'),
      type: 'deal-room-edit',
      id: 'edit'
    };
    let items = [{
      icon: 'message',
      name: t('Broadcast Message'),
      type: 'deal-room-broadcast',
      id: 'broadcast'
    }];
    if(canEdit()) {
      items.unshift(editItem);
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
  }
});

Template.dealRoomList.onCreated(function() {
  const self = this;
  self.hubProfile = new ReactiveVar();

  this.autorun(function() {
    const hubInfo = Session.get('hubInfo');
    if(hubInfo && !_.isEmpty(hubInfo)) {
      const profile = HUBProfiles.findOne({userId: hubInfo.userId});
      self.hubProfile.set(profile);
    }
  });
});