Template.fileUpload.onCreated(function(){
  const self = this;
  self.dataRoom = new ReactiveVar();
  Session.set('uploadList', [{_id: Random.id()}]);  

  self.autorun(function() {
    const hubInfo = Session.get('hubInfo');
    if(hubInfo && !_.isEmpty(hubInfo)) {
      self.dataRoom.set(DataRoom.findOne());
    }
  });
});

Template.fileUpload.onRendered(function() {
  window.onclick = function(event) {
      if (event.target === $('#uploadModal')) {
        $('#uploadModal').hide();
      }
  };
});

Template.fileUpload.helpers({
  uploadList() {
    return Session.get('uploadList');
  }
});

Template.fileUpload.events({
  'click .close'(event, template) {
    Session.set('uploadList', [{_id: Random.id()}]);  
    $('#uploadModal').hide();
  },
  'click .add-file'(event, template) {
    const uploadList = Session.get('uploadList');
    uploadList.push({_id: Random.id()});
    Session.set('uploadList', uploadList);
  },
  'click .back'(e, template) {
    Session.set('showFileUpload', false);
		return;
	},
  'click .upload-files'(event,template) {
    const dataRoom = template.dataRoom.get();
    const uploadList = Session.get('uploadList');

    _.each(uploadList, function(item){
      const row = $(`#${item._id}.row`)[0];

      const fileName = $(row).find('#file-name').val();
      const fileUpload = $(row).find('#fileInput')[0];
      const parentDirId = $(row).find('#parentDir option:selected').val();

      const btnClass = $(row).find('#all-users').attr('class');
      const allUsers = (btnClass === 'all-users');

      let dealRoomIds = [];
      $(row).find('#checkboxes[data-type=dealRoomIds] input:checked').each(function() { 
        dealRoomIds.push($(this)[0].id);
      });

      let teamIds = [];
      $(row).find('#checkboxes[data-type=teamIds] input:checked').each(function() {
        teamIds.push($(this)[0].id);
      });
      
      let userIds = [];
      $(row).find('#checkboxes[data-type=userIds] input:checked').each(function(userElem) {
        userIds.push($(this)[0].id);
      });
      
      if (fileUpload.files && fileUpload.files[0]) {
        // We upload only one file, in case
        // multiple files were selected
        const file = fileUpload.files[0];
  
        const upload = Files.insert({
          file: fileUpload.files[0],
          streams: 'dynamic',
          chunkSize: 'dynamic',
          onProgress: function(progress) {
            //
          }
        }, false);
  
        upload.on('start', function () {
          
        });
  
        upload.on('end', function (error, fileObj) {
          // const dealRoomIds = (dealRoomId && dealRoomId !== '') ? [dealRoomId] : [];
          // const teamIds = (teamId && teamId !== '') ? [teamId] : [];
          // const userIds = (userId && userId !== '') ? [userId] : [];

          const newFile = {
            fileName: fileObj.name,
            fileId: fileObj._id,
            displayName: fileName,
            parentDirId,
            dataRoomId: dataRoom._id,
            type: fileObj.ext,
            access: {
              allUsers,
              dealRoomIds,
              teamIds,
              userIds
            }
          };
  
          Meteor.call('file.add', newFile, function (error, result) {
            $(row).remove();
          });
        });
  
        upload.start();
      }
    });

    swal({
      title: 'File Uploaded',
      text: TAPi18n.__('Thank_you_exclamation_mark '),
      type: 'success',
      timer: 1000,
      showConfirmButton: false
    });
    /*

    if(fileName === '') {
      swal({
				title: t('Error'),
				text: 'Please enter a file name',
				type: 'error',
				timer: 3000
			});
    }
    
     else{
      swal({
				title: t('Error'),
				text: 'Please select a file to upload',
				type: 'error',
				timer: 3000
			});
    }*/
  }
});

Template.fileRow.onCreated(function() {
  const self = this;
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
})