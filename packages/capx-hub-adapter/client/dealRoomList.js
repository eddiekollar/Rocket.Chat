function getChannelLabel(group) {
  let label = '';
  const hubProfile = Session.get('HUBProfile');
  if(hubProfile) {
    const otherTeam = Team.findOne({_id: {$in: group.teamIds}, companyId: {$ne: hubProfile.companyId}});
    label = (otherTeam && otherTeam.displayName) ? otherTeam.displayName : '';
  }
  
  return label;
}

Template.dealRoomList.helpers({
  dealRooms() {
    return DealRoom.find();
  },
  getChannels(chatGroupIds) {
    const channels = ChatGroup.find({_id: {$in: chatGroupIds}}).map(function(group) {
      const name = getChannelLabel(group);
      return {_id: group.rocketGroup._id, name};
    })

    return channels;
  },
  getRoom(rid) {
    const sub = ChatSubscription.findOne({rid});
    return sub;
  },
});

Template.dealRoomList.events({
    'click .sidebar-item__menu'(e) {
    const canEdit = () => {
      //!! Check permission

      return true;
    };
    e.preventDefault();
    const editItem = {
      icon: 'team',
      name: t('Edit Users'),
      type: 'sidebar-item',
      id: 'edit'
    };
    let items = [{
      icon: 'message',
      name: t('Broadcast Message'),
      type: 'sidebar-item',
      id: 'broadcast'
    }];
    if(canEdit()) {
      items.shift(editItem);
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
        template: this.t,
        rid: this.rid,
        name: this.name
      }
    };

    popover.open(config);
  }
})