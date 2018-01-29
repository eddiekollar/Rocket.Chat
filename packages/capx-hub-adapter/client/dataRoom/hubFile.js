Template.hubFile.onCreated(function() {
  console.log(this);
});

Template.hubFile.helpers({
  file() {
    return Template.instance().data.file;
  },
  hasPermission(capability) {
    const permissions = Template.instance().data.permissions.get();
    return permissions.indexOf(capability) > -1;
  },
  getFileIcon(type) {
		if (type.match(/^image\/.+$/)) {
			return 'icon-picture';
		}

		return 'icon-docs';
	},
	escapedName() {
    const file = Template.instance().data.file;
		return _.escape(file.displayName);
  },
  url() {
    const fileId = Template.instance().data.file.fileId;
    const file = Files.findOne({_id: fileId});
    return file.link();
  }
});

Template.hubFile.events({
  'click .file-permission'(event, template) {
    Session.set('editPermissions', {fileId: event.target.id});
    $('#permissionModal').show();
  },
  'click .icon-trash.file-delete'(event, template) {
    const fileId = event.target.id;
    return swal({
      title: t('Are_you_sure'),
      text: t('This file will be deleted'),
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DD6B55',
      confirmButtonText: t('Yes Delete File'),
      cancelButtonText: t('Cancel'),
      closeOnConfirm: false,
      html: false
    }, function() {
      return Meteor.call('file.delete', fileId, function(err, result) {
        if (err) {
          return handleError(err);
        }
        if(result) {
          $(`li#${fileId}`).remove();
          swal({
            title: t('Removed'),
            text: t('File has been delete'),
            type: 'success',
            timer: 2000,
            showConfirmButton: false
          });  
        } else {
          swal({
            title: t('Error Deleting File'),
            type: 'error',
            timer: 1000
          });
        }
        
        return true;
      });
    });
  }
});