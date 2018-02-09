Template.manageTeam.onCreated(function() {
  const self = this;
  self.showModal = new ReactiveVar(false);
  self.editorType = new ReactiveVar();
  self.companyTeam = new ReactiveVar();
  self.dealTeam = new ReactiveVar();
  let levelOptions = ['Lead', 'Member'];
  self.levelOptions = new ReactiveVar(levelOptions);

  self.autorun(function(){
    const hubInfo = Session.get('hubInfo');
    self.editorType.set(hubInfo.userType);
    if(hubInfo.userType === 'SEEKER') {
      levelOptions.unshift('Owner');
      self.levelOptions.set(levelOptions);
    }

    const show = !!Session.get('openManageTeam');
    if(show) {  
      $('#manageTeamModal').show();
      Session.set('openManageTeam', false);

      const hubContext = Session.get('hubContext');
      console.log(hubContext);
      self.companyTeam.set(Team.findOne({_id: hubContext.companyTeamId}));
      self.dealTeam.set(Team.findOne({_id: hubContext.dealTeamId}));
    }
  });
});

Template.manageTeam.onRendered(function() {
  const self = this;

  window.onclick = function(event) {
    if (event.target === $('#manageTeamModal')) {
      $('#manageTeamModal').hide();
    }
  };
});

Template.manageTeam.events({
  'click .close'(event, template) {
    $('#manageTeamModal').hide();
  },
  'click .invite'(event, template){
    const userId = event.target.id;
    const row = $(`#${userId}.row`)[0];
    const level = $(row).find('#level option:selected').val();
    const dealTeam = template.dealTeam.get();

    Meteor.call('inviteUser', userId, level, dealTeam._id, function(error, result){
      $(row).remove();
    });
  },
  'click .approve'(event, template) {
    const assignmentId = event.target.id;
    const row = $(`#${assignmentId}.row`)[0];

    Meteor.call('approveUser', assignmentId, function(error, result){
      $(row).remove();
    });
  },
  'click .edit'(event, template) {
    const userId = event.target.id;
    const level = $(event.target).data('value');
    const hubContext = Session.get('hubContext');
    let teamId = '';

    if(hubContext.type === 'COMPANY') {
      teamId = hubContext.companyTeamId;
    } else {
      teamId = template.dealTeam.get()._id;
    }

    Meteor.call('changeUserLevel', userId, level, teamId, function(error, result){

    });
  },
  'click .remove'(event, template) {
    const userId = event.target.id;
    const row = $(`#${userId}.row`)[0];
    const hubContext = Session.get('hubContext');
    let teamId = '';

    if(hubContext.type === 'COMPANY') {
      teamId = hubContext.companyTeamId;
    } else {
      teamId = template.dealTeam.get()._id;
    }
    
    Meteor.call('requestRemoveUser', userId, teamId, function(error, result){
      $(row).remove();
    });
  }
});

Template.manageTeam.helpers({
  editorType() {
    return Template.instance().editorType.get();
  },
  pendingInvites() {
    const dealTeam = Template.instance().dealTeam.get();
  
    if(dealTeam){
      const pendingUsers = Assignments.find({'task.teamId': dealTeam._id, completed: false}).map(function(assignment){
        const {userId, teamId, level, status} = assignment.task;
        const profile = HUBProfiles.findOne({userId});
        return {
          assignmentId: assignment._id,
          userId,
          displayName: profile.displayName,
          level,
          status
        }
      })
      return pendingUsers;
    }else {
      return [];
    }
  },
  levelOptions() {
    return Template.instance().levelOptions.get();
  },
  teamUsersList() {
    const hubContext = Session.get('hubContext');
    let team = {};

    if(hubContext) {
      if (hubContext.type === 'COMPANY') {
        team = Template.instance().companyTeam.get();
      } else {
        team = Template.instance().dealTeam.get();
      }
    }
    
    if(!_.isEmpty(team)) {
      const ownersList = team.ownerUserIds.map(function(userId){
        const profile = HUBProfiles.findOne({userId});
        return { displayName: profile.displayName, userId, level: 'Owner' };
      });
      const leadsList = team.leadUserIds.map(function(userId){
        const profile = HUBProfiles.findOne({userId});
        return { displayName: profile.displayName, userId, level: 'Lead' };
      });
      const membersList = team.memberUserIds.map(function(userId){
        const profile = HUBProfiles.findOne({userId});
        return { displayName: profile.displayName, userId, level: 'Member' };
      });
  
      return {ownersList, leadsList, membersList};
    } else {
      return {ownersList:[], leadsList:[], membersList:[]}
    }
  },
  nonMembersList() {
    const companyTeam = Template.instance().companyTeam.get();
    const dealTeam = Template.instance().dealTeam.get();

    if(!companyTeam || !dealTeam) {
      return [];
    }
    const companyUserIds = _.union(companyTeam.ownerUserIds, companyTeam.leadUserIds, companyTeam.memberUserIds);
    const dealUserIds = _.union(dealTeam.ownerUserIds, dealTeam.leadUserIds, dealTeam.memberUserIds);
    const pendingUserIds = Assignments.find({'task.teamId': dealTeam._id, 'task.status': 'PENDING'}).map(function(assignment){
      return assignment.task.userId;
    });
    const nonMemberIds = _.difference(companyUserIds, dealUserIds, pendingUserIds);

    return HUBProfiles.find({userId: {$in: nonMemberIds}});
  }
});