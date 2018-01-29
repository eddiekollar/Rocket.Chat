Template.fileRow.onCreated(function() {
  console.log(this);
  const self = this;
  self.type = this.data.type || 'new';
  self.dataRoom = new ReactiveVar();

  self.dealRooms = new ReactiveVar();
  self.dealRoomIds = new ReactiveVar([]);

  self.teams = new ReactiveVar()
  self.teamIds = new ReactiveVar([]);

  self.userIds = new ReactiveVar([]);

  self.autorun(function() {
    const hubInfo = Session.get('hubInfo');
    if(hubInfo && !_.isEmpty(hubInfo)) {
      self.dataRoom.set(DataRoom.findOne());
    }
    const dealRoomIds = self.dealRoomIds.get();
    let roomSelector = {};
    if(dealRoomIds.length > 0) {
      roomSelector = {_id: {$in: dealRoomIds}};
    }
    const dealRooms = DealRoom.find(roomSelector, {sort: {'dealSummary.type': -1}}).fetch();
    self.dealRooms.set(dealRooms);
    
    // let cpTeamIds = dealRooms.map(function(dealRoom) {
    //   return dealRoom.cpTeamIds;
    // });
    // cpTeamIds = _.unique(_.flatten(cpTeamIds));

    // let teamIds = self.teamIds.get();
    // const intersection = _.intersection(cpTeamIds, teamIds);
    // if(intersection.length > 0) {
    //   teamIds = intersection;
    // } else {
    //   teamIds = cpTeamIds;
    // }
    // self.teamIds.set(teamIds);

  });
});

Template.fileRow.helpers({
  type() {
    return Template.instance().type;
  },
  dealRoomsOpen() {
    const dataRoom = Template.instance().dataRoom.get();
    console.log(dataRoom);
    return (dataRoom && dataRoom.status === 'DEAL_ROOMS_OPEN');
  },
  dirsList() {
    let list = [];
    const dataRoom = Template.instance().dataRoom.get();
    if(dataRoom) {
      list.push({_id: dataRoom._id, name: 'Top Level'});
      dataRoom.childDirs.forEach(function(dir) {
        list.push({_id: dir._id, name: dir.name});
      });
    }
    return list;
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

Template.fileRow.events({
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
  'click .remove-row'(event, template) {
    const _id = event.target.id;
    $(`#${_id}.row`).remove();
    const uploadList = Session.get('uploadList');
    Session.set('uploadList', _.filter(uploadList, function(l) { l._id !== _id }));
  },
});