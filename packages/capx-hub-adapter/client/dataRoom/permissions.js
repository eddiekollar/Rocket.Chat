Template.dataRoomPermissions.onCreated(function() {
  const self = this;
  self.roomObject = new ReactiveVar();
  self.dataRoom = new ReactiveVar();

  self.dealRooms = new ReactiveVar();
  self.dealRoomIds = new ReactiveVar([]);

  self.teams = new ReactiveVar()
  self.teamIds = new ReactiveVar([]);

  self.userIds = new ReactiveVar([]);

  self.autorun(function() {
    const editInfo = Session.get('editPermissions');
    const hubInfo = Session.get('hubInfo');
    let access = {};
    
    if(hubInfo && !_.isEmpty(hubInfo)) {
      const dataRoom = DataRoom.findOne();
      self.dataRoom.set(dataRoom);
    
      if(editInfo) {
        if(editInfo.fileId) {
          const file = DataRoomFiles.findOne({_id: editInfo.fileId});
          access = file.access;
          self.roomObject.set({type:'file', file});
        } else if(editInfo.dirId) {
          const dir = _.findWhere(dataRoom.childDirs, {_id: editInfo.dirId});
          access = dir.access;
          self.roomObject.set({type:'dir', dir});
        }
        let roomSelector = {};
        if(access.dealRoomIds.length > 0) {
          roomSelector = {_id: {$in: access.dealRoomIds}};
          self.dealRoomIds.set(access.dealRoomIds);
        }
        const dealRooms = DealRoom.find(roomSelector, {sort: {'dealSummary.type': -1}}).fetch();
        self.dealRooms.set(dealRooms);
      }
    }

  });
})

Template.dataRoomPermissions.helpers({
  dealRoomsOpen() {
    const dataRoom = Template.instance().dataRoom.get();
    return (dataRoom && dataRoom.status === 'DEAL_ROOMS_OPEN');
  },
  dealRoomsList() {
    const dealRooms = DealRoom.find({},{sort: {'dealSummary.type': -1}}).map(function(dealRoom){
      const name = `${HUBAdapter.formatteShortHanddAmount(dealRoom.dealSummary.amount)} ${dealRoom.dealSummary.type}`;
      return {_id: dealRoom._id, name};
    });
    return dealRooms;
  },
  teamsList() {
    const dealRooms = Template.instance().dealRooms.get();
    let teamIds = dealRooms.map(function(dealRoom) {
      return dealRoom.cpTeamIds;
    });
    teamIds = _.unique(_.flatten(teamIds));
    Template.instance().teamIds.set(teamIds);
    return Team.find({_id: {$in: teamIds}});
  },
  usersList() {
    const dealRooms = Template.instance().dealRooms.get();
    let teamIds = dealRooms.map(function(dealRoom){
      return dealRoom.cpTeamIds;
    });
    teamIds = _.flatten(teamIds);
    const teams = Team.find({_id: {$in: teamIds}});
    let userIds = teams.map(function(team) {
      return _.union(team.ownerUserIds, team.leadUserIds, team.memeberUserIds);
    });
    userIds = _.unique(_.flatten(userIds));
    return HUBProfiles.find({userId: {$in: userIds}});
  }
});

Template.dataRoomPermissions.events({
  'click input[type=checkbox]'(event, template){
    const checkbox = event.target;
    const type = $(checkbox).data('type');
    const selected = checkbox.checked
    const _id = checkbox.id;

    const ids = template[type].get();
    if(selected){
      ids.push(_id);
      template[type].set(ids);
    }else{
      template[type].set(_.without(ids, _id));
    }
  },
  'click .selectBox'(event, template) {
    const checkboxes = $(event.target).parent().next();
    $(checkboxes).toggle();
  },
  'click #all-users'(event, template) {
    $(event.target).toggleClass( "all-users" );
  },
  'click .close'(event, template) {
    $('#permissionModal').hide();
  },
  'click .cancel-permissions'(event, template) {
    $('#permissionModal').hide();
  },
  'click .save-permissions'(event, template) {

  },
});