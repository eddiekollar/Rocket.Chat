function removeCpTeam({dealRoomId, dealTeamId}) {
  return swal({
    title: t('Are_you_sure'),
    text: t('This team will be removed from the deal room'),
    type: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: t('Yes Delete'),
    cancelButtonText: t('Cancel'),
    closeOnConfirm: false,
    html: false
  }, function() {
    return Meteor.call('removeCpTeamFromDeal', dealTeamId, dealRoomId, function(err, result) {
      if (err) {
        return handleError(err);
      }

      if(result) {
        swal({
          title: t('Removed'),
          text: t('Team Has Been Delete'),
          type: 'success',
          timer: 2000,
          showConfirmButton: false
        });  
      } else {
        swal({
          title: t('Error Removing Team'),
          type: 'error',
          timer: 1000
        });
      }
      return true;
    });
  });
}

function canManage(permissions) {
  const manageCsTeam = _.findWhere(permissions, {action: 'ManageCsTeam'});
  const manageCpTeam = _.findWhere(permissions, {action: 'ManageCpTeam'});

  return ((manageCsTeam && manageCsTeam.permitted) || (manageCpTeam && manageCpTeam.permitted)); 
}

Template.hubListItemMenu.onCreated(function(){
  Session.set('openRemoveCpTeam', false);
  const self = this;
  const hubRoomInfo = self.data.hubRoomInfo;
  self.assignments = new ReactiveVar([]);
  self.hubProfile = new ReactiveVar();
  self.permissions = new ReactiveVar([]);
  self.itemType = (hubRoomInfo && hubRoomInfo.type) ? hubRoomInfo.type : '';
  
  self.autorun(function() {
    const hubInfo = Session.get('hubInfo');
    if(hubInfo && !_.isEmpty(hubInfo)) {
      const profile = HUBProfiles.findOne({userId: hubInfo.userId});
      self.hubProfile.set(profile);

      if(hubRoomInfo) {
        let actions = [];
        let teamId = '';
        if(hubInfo.userType === 'SEEKER') {
          teamId = hubRoomInfo.csTeamId;
          if(hubRoomInfo.type === 'COMPANY') {
            actions = ['ManageCsTeam'];
          } else {
            actions = ['ManageCpTeam', 'RemoveCpTeam'];
          }
          self.assignments.set(Assignments.find({assignedTeamId: hubRoomInfo.csTeamId, 'task.teamId': hubRoomInfo.cpTeamId, completed: false}).fetch());
        }else if(hubInfo.userType === 'PROVIDER' && hubRoomInfo.type === 'COMPANY') {
          teamId = hubRoomInfo.cpTeamId;
          actions = ['ManageCpTeam'];
          self.assignments.set(Assignments.find({'task.teamId': hubRoomInfo.cpTeamId}).fetch());
        }
        
        Meteor.call('permissions.check', actions, teamId, function(error, result) {
          if(error) {
            console.error({error});
          }else{
            self.permissions.set(result);
          }
        });
      }
    }

    if(Session.get('openRemoveCpTeam')){
      removeCpTeam(Session.get('hubContext'));
      Session.set('openRemoveCpTeam', false);
    }
  });
});

Template.hubListItemMenu.helpers({
  canManageUsers() {
    return canManage(Template.instance().permissions.get());
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
    e.preventDefault();
    let items = [];
    const manageItem = {
      icon: 'team',
      name: t('Manage Team'),
      type: 'deal-room-manage-team',
      id: 'manage'
    };

    const removeTeam = {
      icon: 'cross',
      name: t('Remove Team'),
      type: 'deal-room-remove-cpteam',
      id: 'remove-cpteam'
    };

    if(canManage(template.permissions.get())) {
      items.push(manageItem);
    }

    const removeCpTeam = _.findWhere(template.permissions.get(), {action: 'RemoveCpTeam'});

    if(removeCpTeam && removeCpTeam.permitted) {
      items.push(removeTeam);
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
        
      }
    };

    popover.open(config);

    const {type, dealRoomId, csTeamId, cpTeamId} = Template.instance().data.hubRoomInfo;
    const cpTeam = Team.findOne({_id: cpTeamId});
    const csTeam = Team.findOne({_id: csTeamId});
    const companyTeamId = (cpTeam && cpTeam._id) ? cpTeam._id : (csTeam && csTeam._id) ? csTeam._id : '';

    const hubContext = {
      type: Template.instance().itemType,
      dealRoomId,
      dealTeamId: cpTeamId,
      csTeamId,
      companyTeamId
    };
    
    Session.set('hubContext', hubContext);
  }
});