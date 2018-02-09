Template.dataRoomPermissions.onCreated(function() {

});

Template.dataRoomPermissions.helpers({
  dealRoomsOpen() {
    const dataRoom = Template.instance().dataRoom.get();
    return (dataRoom && dataRoom.status === 'DEAL_ROOMS_OPEN');
  }
});

Template.dataRoomPermissions.events({
  'click .close'(event, template) {
    $('#permissionModal').hide();
  },
  'click .cancel-permissions'(event, template) {
    $('#permissionModal').hide();
  },
  'click .save-permissions'(event, template) {
    const editPermissions = Session.get('editPermissions');
    
    if(editPermissions){ 
      const row = $(`#${editPermissions.id}.row`)[0];
      const btnClass = $(row).find('button[data-type=allusers]').attr('class');
      const allUsers = btnClass.indexOf('all-users') > -1;

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

      const access = {
        allUsers, 
        dealRoomIds,
        teamIds,
        userIds
      };

      if(editPermissions.objectType === 'file') {
        Meteor.call('file.permissionsUpdate', editPermissions.id, access, function(error, result){
          if(error) {
            console.error(error);
          }
        });
      } else if(editPermissions.objectType === 'dir') {
        const hubInfo = Session.get('hubInfo');
        const hub = HUB.findOne({_id: hubInfo.hubId});
        const dataRoom = DataRoom.findOne({_id: hub.dataRoomId});

        Meteor.call('dir.permissionsUpdate', dataRoom._id, editPermissions.id, access, function(error, result){
          if(error) {
            console.error(error);
          }
        });
      }
    }
  },
});