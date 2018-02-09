Template.fileRow.onCreated(function() {
  const self = this;
  self.type = this.data.type || 'new';

  self.dealRoomIds = new ReactiveVar([]);
  self.teamIds = new ReactiveVar([]);
  self.userIds = new ReactiveVar([]);

  self.objectId = new ReactiveVar('');
  self.objectType = new ReactiveVar();
});

Template.fileRow.onRendered(function() {
  const self = this;
  self.autorun(function() {
    if (self.type === 'edit') {
      const editPermissions = Session.get('editPermissions');
      if (editPermissions) {
        let access = {
          dealRoomIds: [],
          teamIds: [],
          userIds: []
        };
        const {id, objectType} = editPermissions;
        self.objectId.set(id);
        self.objectType.set(objectType);

        if (objectType === 'file') {
          const file = DataRoomFiles.findOne({_id: id});
          if(file) {
            access = file.access;
          }
        } else if (objectType === 'dir') {
          const dataRoom = Session.get('dataRoom');
          const dir = _.findWhere(dataRoom.childDirs, {_id: id});
          if(dir) {
            access = dir.access;
          }
        }

        const { allUsers, dealRoomIds, teamIds, userIds } = access;
        
        if(allUsers) {
          const row = $(`#${id}.row`)[0];
          $(row).find('button[data-type=allusers]').addClass('all-users');
        }

        self.dealRoomIds.set(dealRoomIds);
        self.teamIds.set(teamIds);
        self.userIds.set(userIds);
      } 
    }
  });
});

Template.fileRow.helpers({
  getId() {
    if(Template.instance().type === 'new') {
      return Template.instance().data._id;
    } else {
      const editPermissions = Session.get('editPermissions');
      return editPermissions.id;
    }
  },
  type() {
    return Template.instance().type;
  },
  dealRoomsOpen() {
    const dataRoom = Session.get('dataRoom');

    return (dataRoom && dataRoom.status === 'DEAL_ROOMS_OPEN');
  },
  dirsList() {
    let list = [];
    const dataRoom = Session.get('dataRoom')
    if(dataRoom) {
      list.push({_id: dataRoom._id, name: 'Top Level'});
      dataRoom.childDirs.forEach(function(dir) {
        list.push({_id: dir._id, name: dir.name});
      });
    }
    return list;
  },
  dealRoomsList() {
    const hubInfo = Session.get('hubInfo');
    
    if(!_.isEmpty(hubInfo)) {
      const dealRooms = DealRoom.find({hubId: hubInfo.hubId},{sort: {'dealSummary.type': -1}}).map(function(dealRoom){
        const name = `${HUBAdapter.formatteShortHanddAmount(dealRoom.dealSummary.amount)} ${dealRoom.dealSummary.type}`;
        let checked = true;
        if (Template.instance().type === 'edit') {
          checked = (Template.instance().dealRoomIds.get().indexOf(dealRoom._id) > -1);
        }
        return {_id: dealRoom._id, name, checked};
      });

      if (Template.instance().type === 'new') {
        let dealRoomIds = dealRooms.map(function(dealRoom) {
          return dealRoom._id;
        });
        dealRoomIds = _.unique(_.flatten(dealRoomIds));
        Template.instance().dealRoomIds.set(dealRoomIds);
      }

      return dealRooms;
    } else {
      return [];
    }
  },
  teamsList() {
    const dealRoomIds = Template.instance().dealRoomIds.get();
    const dealRooms = DealRoom.find({_id: {$in: dealRoomIds}});
    let teamIds = dealRooms.map(function(dealRoom) {
      return dealRoom.cpTeamIds;
    });
    teamIds = _.unique(_.flatten(teamIds));

    if (Template.instance().type === 'new') {
      Template.instance().teamIds.set(teamIds);
    }

    const teams = Team.find({_id: {$in: teamIds}}).map(function(team){
      let checked = true;
      const { _id, displayName } = team;
      
      if (Template.instance().type === 'edit') {
        checked = (Template.instance().teamIds.get().indexOf(_id) > -1);
      }

      return {_id, displayName, checked};
    })

    return teams;
  },
  usersList() {
    let search = {};
    const ids = Template.instance().teamIds.get();
    if(ids.length > 0) {
      search = {_id: {$in: ids}};
    }

    const teams = Team.find(search);
    let userIds = teams.map(function(team) {
      return _.union(team.ownerUserIds, team.leadUserIds, team.memeberUserIds);
    });
    userIds = _.unique(_.flatten(userIds));

    const users = HUBProfiles.find({userId: {$in: userIds}}).map(function(user) {
      let checked = true;
      const { userId, displayName } = user;
      
      if (Template.instance().type === 'edit') {
        checked = (Template.instance().userIds.get().indexOf(userId) > -1);
      }

      return {userId, displayName, checked};
    });

    return users;
  }
});

Template.fileRow.events({
  'click input[type=checkbox]'(event, template){
    const checkbox = event.target;
    const type = $(checkbox).data('type');
    const selected = checkbox.checked
    const _id = checkbox.id;

    const ids = template[type].get();

    let rowId = '';
    if(template.type === 'new') {
      rowId = template.data._id;
    } else {
      const editPermissions = Session.get('editPermissions');
      rowId = editPermissions.id;
    }

    const row = $(`#${rowId}.row`)[0];

    if(selected){
      $(row).find('button[data-type=allusers]').removeClass('all-users');
      
      ids.push(_id);
      template[type].set(ids);
    }else{
      template[type].set(_.without(ids, _id));

      const lengths = template.dealRoomIds.get().length + template.teamIds.get().length + template.userIds.get().length;
      if(lengths === 0) {
        $(row).find('button[data-type=allusers]').addClass('all-users');
      }
    }
  },
  'click .selectBox'(event, template) {
    const checkboxes = $(event.target).parent().next();
    $(checkboxes).toggle();
  },
  'click button[data-type=allusers]'(event, template) {
    if($(event.target).attr('class').indexOf('all-users') > -1) {
      // $('#checkboxes[data-type=dealRoomIds]').each(function() { 
      //   $(this).prop('checked', true);
      // });

      // $('#checkboxes[data-type=teamIds]').each(function() {
      //   $(this).prop('checked', true);
      // });

      // $('#checkboxes[data-type=userIds]').each(function(userElem) {
      //   $(this).prop('checked', true);
      // });
    }

    $(event.target).toggleClass('all-users');
  },
  'click .remove-row'(event, template) {
    const _id = event.target.id;
    $(`#${_id}.row`).remove();
    const uploadList = Session.get('uploadList');
    Session.set('uploadList', _.filter(uploadList, function(l) { l._id !== _id }));
  },
});