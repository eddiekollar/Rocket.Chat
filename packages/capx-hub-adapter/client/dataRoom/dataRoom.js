Template.dataRoom.onCreated(function() {
  const self = this;
  self.dataRoom = new ReactiveVar();
  self.permissions = new ReactiveVar([]);

  this.autorun(function() {
    const hubInfo = Session.get('hubInfo');
    const hubRoomInfo = Session.get('hubRoomInfo');
    
    if(!_.isEmpty(hubInfo)) {
      if(hubInfo.userType === 'SEEKER') {
        const hubId = hubInfo.hubId;
        self.subscribe('dataRoom.get', hubId, function() {
          const hub = HUB.findOne({_id: hubId});
          self.dataRoom.set(DataRoom.findOne({_id: hub.dataRoomId}));
          self.permissions.set(['ViewDoc','AddFolder','AddDoc','ChangePermission','RemoveFile','DownloadDoc', 'RemoveFolder']);
        });
      } else if(hubInfo.userType === 'PROVIDER' && !_.isEmpty(hubRoomInfo)) {
        const {dealRoomId, cpTeamId} = hubRoomInfo;
        self.subscribe('dataRoom.byDealRoom.cp', dealRoomId, cpTeamId, function(){
          const dealRoom = DealRoom.findOne({_id: dealRoomId});
          const hub = HUB.findOne({_id: dealRoom.hubId});
          self.dataRoom.set(DataRoom.findOne({_id: hub.dataRoomId}));

          self.permissions.set(['ViewDoc']);
        });
      }
    }
  });

});

Template.dataRoom.helpers({
  permissions() {
    return Template.instance().permissions;
  },
  dataRoom() {
    return Template.instance().dataRoom;
  },
  hasPermission(capability) {
    const permissions = Template.instance().permissions.get();
    return permissions.indexOf(capability) > -1;
  },
  getDirs() {
    const dataRoom = Template.instance().dataRoom.get();
    let childDirs = [];
    if(dataRoom && dataRoom.childDirs) {
      childDirs = _.where(dataRoom.childDirs, {parentDirId: dataRoom._id});
    }

    return childDirs;
  },
  files() {
    const dataRoom = Template.instance().dataRoom.get();
    const parentDirId = (dataRoom) ? dataRoom._id : '';
    return DataRoomFiles.find({parentDirId});
  }
});

function createDropDown(dataRoom) {
  let dropDown = 'Parent Folder: <select id="dir">';

  dropDown += `<option value="${dataRoom._id}">Top Level</option>`;
  dataRoom.childDirs.forEach(function(dir) {
    dropDown += `<option value="${dir._id}">${dir.name}</option>`;
  });

  dropDown +=  '</select>';
  return dropDown;
};

function deleteDir(dataRoomId, dirId) {
  return swal({
    title: t('Are_you_sure'),
    text: t('This folder and it\'s contents will be deleted'),
    type: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#DD6B55',
    confirmButtonText: t('Yes Delete'),
    cancelButtonText: t('Cancel'),
    closeOnConfirm: false,
    html: false
  }, function() {
    return Meteor.call('dir.delete', dataRoomId, dirId, function(err, result) {
      if (err) {
        return handleError(err);
      }
      if(result) {
        $(`li#${dirId}`).remove();
        swal({
          title: t('Removed'),
          text: t('Folder Has Been Delete'),
          type: 'success',
          timer: 2000,
          showConfirmButton: false
        });  
      } else {
        swal({
          title: t('Error Deleting Folder'),
          type: 'error',
          timer: 1000
        });
      }
      return true;
    });
  });
}

function folderNameExists(name, parentDirId, dirs) {
  return _.where(dirs, {parentDirId, name}).length > 0;
}

Template.dataRoom.events({
  'click .add-dir': function(event, template) {
    const dataRoom = template.dataRoom.get();
    const text = createDropDown(dataRoom);
    return swal({
      title: t('Create new folder'),
      text,
      type: 'input',
      showCancelButton: true,
      closeOnConfirm: false,
      closeOnCancel: true,
      confirmButtonText: t('Create'),
      cancelButtonText: t('Cancel'),
      html: true
    }, function(inputValue) {
      if (inputValue === false) {
        return false;
      }

      inputValue = inputValue.trim();

      if (inputValue === '') {
        swal.showInputError(TAPi18n.__('Please name the folder'));
        return false;
      }

      const parentDirId = $('#dir option:selected').val();
      const exists = folderNameExists(inputValue, parentDirId, dataRoom.childDirs);

      if(exists) {
        swal.showInputError(TAPi18n.__(`A folder named ${inputValue} already exists`));
        return false;
      }

      Meteor.call('dir.create', inputValue, parentDirId, dataRoom._id, function(error, result) {
        if (error) {
          console.error(error);
          return false;
        }

        swal({
          title: 'Folder Created',
          text: TAPi18n.__('Thank_you_exclamation_mark '),
          type: 'success',
          timer: 1000,
          showConfirmButton: false
        });
      });
              
    });
  },
  'click .add-file'(event, template){
    $('#uploadModal').show();
  },
  'click .dir-permission'(event, template){
    Session.set('editPermissions', {dirId: event.target.id});
    $('#permissionModal').show();
  },
  'click .folder-delete'(event, template) {
    const dirId = event.target.id;
    const dataRoom = template.dataRoom.get();
    deleteDir(dataRoom._id, dirId);
  }
})

Template.dirs.onCreated(function() {

});

Template.dirs.helpers({
  permissions() {
    return Template.instance().data.permissions;
  },
  dataRoom() {
    return Template.instance().data.dataRoom;
  },
  hasPermission(capability) {
    const permissions = Template.instance().data.permissions.get();
    return permissions.indexOf(capability) > -1;
  },
  getDirs() {
    const dataRoom = Template.instance().data.dataRoom.get();
    const parentDirId = Template.instance().data.dir._id;
    return _.where(dataRoom.childDirs, {parentDirId});
  },
  files() {
    const parentDirId = Template.instance().data.dir._id;
    return DataRoomFiles.find({parentDirId});
  }
});

Template.dirs.events({
  'click .dir-permission'(event, template) {
    Session.set('editPermissions', {dirId: event.target.id});
    $('#permissionModal').show();
  }
});
