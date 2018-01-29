Template.hubListItemMenu.onCreated(function(){
  const self = this;
  const hubRoomInfo = self.data.hubRoomInfo;
  self.assignments = new ReactiveVar([]);
  self.hubProfile = new ReactiveVar();
  self.itemType = (hubRoomInfo && hubRoomInfo.type) ? hubRoomInfo.type : '';
  
  console.log(hubRoomInfo)
  
  self.autorun(function() {
    const hubInfo = Session.get('hubInfo');
    if(hubInfo && !_.isEmpty(hubInfo)) {
      const profile = HUBProfiles.findOne({userId: hubInfo.userId});
      self.hubProfile.set(profile);

    if(hubRoomInfo) {
        if(hubInfo.userType === 'SEEKER') {
          self.assignments.set(Assignments.find({assignedTeamId: hubRoomInfo.csTeamId, 'task.teamId': hubRoomInfo.cpTeamId, completed: false}).fetch());
        }else if(hubInfo.userType === 'PROVIDER') {
          self.assignments.set(Assignments.find({'task.teamId': hubRoomInfo.cpTeamId}).fetch());
        }
      }
    }
  });
});

Template.hubListItemMenu.helpers({
  canManageUsers() {
    const hubInfo = Session.get('hubInfo');
    return (!_.isEmpty(hubInfo) && hubInfo.userType === 'SEEKER') || Template.instance().itemType === 'COMPANY';
  },
  hasNotification() {
    const hubInfo = Session.get('hubInfo');
    const assignments = Template.instance().assignments;

    if (Template.instance().itemType === 'DEAL_ROOM' && !_.isEmpty(hubInfo) && hubInfo.userType === 'SEEKER') {
      return assignments.get().length > 0;
    }else{
      return false;
    }
  }
})

Template.hubListItemMenu.events({
  'click .sidebar-company__menu'(e, template) {
    const canManage = () => { return true; };
    e.preventDefault();
    let items = [];
    const manageItem = {
      icon: 'team',
      name: t('Manage Team'),
      type: 'deal-room-manage-team',
      id: 'manage'
    };

    if(canManage()) {
      items.push(manageItem);
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
    console.log(Template.instance().data);
    const {dealRoomId, csTeamId, cpTeamId} = Template.instance().data.hubRoomInfo;
    
    const cpTeam = Team.findOne({_id: cpTeamId});
    const csTeam = Team.findOne({_id: csTeamId});
    const companyTeamId = (cpTeam && cpTeam._id) ? cpTeam._id : (csTeam && csTeam._id) ? csTeam._id : '';

    const hubContext = {
      type: Template.instance().itemType,
      dealRoomId,
      dealTeamId: cpTeamId,
      companyTeamId
    };
    Session.set('hubContext', hubContext);
  }
});