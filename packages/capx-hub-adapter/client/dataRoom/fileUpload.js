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

    const fileList = [];
    _.each($('.file-info'), row => {
      const rowId = $(row)[0].id;
      if(rowId !== '') {
        const parentDirId = $(row).find('#parentDir option:selected').val();
        const fileName = $(row).find('#file-name').val();
        fileList.push({rowId, fileName, parentDirId});
      }
    });

    for(let row of fileList) {
      const {fileName, parentDirId} = row;
      const search = {fileName, parentDirId};
      const results = _.where(fileList, search);

      if(results.length > 1) {
        return swal({
          title: t('Error'),
          text: `Multiple files with same name ${fileName} are being uploaded`,
          type: 'error',
          timer: 3000
        });
      } else{
        const filesCount = DataRoomFiles.find(search).count();
        if(filesCount > 0) {
          return swal({
            title: t('Error'),
            text: 'A file with same name already exists',
            type: 'error',
            timer: 3000
          });
        }
      }
    }

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
