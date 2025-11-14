'use strict';

yamapBordControllers.controller('SelectedProjectAttachmentsController', ['$rootScope', '$scope', '$timeout', 'appConfig', 'Notifier', 'Alert', 'ProjectAttachment', 'Upload', function($rootScope, $scope, $timeout, appConfig, Notifier, Alert, ProjectAttachment, Upload) {
  $scope.theButtonWasCliked = false;
  $scope.newAttachment = {comment: null, file: null, fileType: 'I', link: null, creator: null, createdAt: null};

  $scope.$on('projects.selectedProject', function(event, project) {
    $scope.project = project;
    $scope.columnName = "{name}'s Attchments".format(project);
    $scope.removeAttachmentTitle = 'Remove attachment from {name}'.format($scope.project);
  });

  $scope.toggleEditAttachment = function(attachment, $event) {
    if ($event) {
      if ($event.which === 13) {
        $event.preventDefault();
      }
      return
    }
    if (!attachment.editing) {
      attachment.editing = true;
    }
    else {
      delete attachment.editing;
    }
  };

  $scope.clearNewAttachment = function() {
    $scope.newAttachmentVisible = false;
    $scope.newAttachmentType = null;
    $scope.newAttachmentFileTypeAccept = $rootScope.newAttachmentFileTypeAccepts['I'];
    $scope.newAttachment = {comment: null, file: null, fileType: 'I', link: null, creator: null, createdAt: null};
  };

  $scope.setNewAttachment = function(type, fileType) {
    $scope.newAttachmentVisible = true;
    $scope.newAttachmentType = type;
    $scope.newAttachmentFileTypeAccept = $rootScope.newAttachmentFileTypeAccepts[fileType];
    $scope.newAttachment.fileType = fileType;
  };

  $scope.addingAttachmentToProject = function(type, fileType) {
    $scope.setNewAttachment(type, fileType);
    $scope.theButtonWasCliked = false;
  };

  $scope.cancelAddAttachmentToProject = function($event) {
    $scope.theButtonWasCliked = true;
    $scope.clearNewAttachment();
    $event.stopPropagation();
  };

  $scope.addAttachmentToProject = function($event) {
    $event.stopPropagation();
    if ($scope.newAttachment[$scope.newAttachmentType] === null) {
      Notifier.warning('You want to {0}, you need to {0} something!'.format([$scope.newAttachmentType]));
      return false;
    }
    if ($scope.newAttachmentType === 'link' && !$scope.newAttachment[$scope.newAttachmentType].startsWith('http')) {
      Notifier.warning('Links should start with http or https. Didnt you know that?!?');
      return false;
    }
    $scope.theButtonWasCliked = true;

    var toSend =  {
      comment: $scope.newAttachment.comment,
      file: $scope.newAttachment.file,
      fileType: $scope.newAttachment.fileType,
      link: $scope.newAttachment.link,
      creatorId: $rootScope.loggedUser.id,
      createdAt: moment().format('YYYY-MM-DD HH:mm'),
    };

    var hasFile = toSend.file !== null && toSend.file.name !== undefined;
    if (hasFile) {
      Notifier.warning('Uploading attachments...');
      Upload.upload(
        {
          url: '{0}/users/me/projects/{1}/attachments'.format([appConfig.backendURL, $scope.project.id]),
          method: 'POST',
          data: toSend
        }
      ).then(
        function(response) {
          $scope.project.attachments.push(response.data);
          $scope.clearNewAttachment();
          $timeout(function () {
            Notifier.success('File attachments created!');
          });
        },

        function(error) {
          Alert.randomErrorMessage(error);
        }
      );
      return;
    }

    Notifier.warning('Saving attachment...');
    ProjectAttachment.save(
      {projectId: $scope.project.id},

      toSend,

      function(response) {
        $scope.project.attachments.push(response);
        $scope.clearNewAttachment();
        Notifier.success('Attachment created!');
      },

      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.removeProjectAttachment = function(attachment, $index) {
    Alert.warning(
      'WAAAAT?!?!',
      'Are you f#!%$ sure??? This will really really remove completely and for EVER this attachment!',
      function(response) {
        if (response.value) {
          ProjectAttachment.delete(
            {projectId: $scope.project.id, attachmentId: attachment.id},

            function(response) {
              $scope.project.attachments.splice($index, 1);
              Notifier.success('Attachment removed!');
            },

            function(error) {
              Alert.randomErrorMessage(error);
            }
          );
        }
      }
    );
  };

}]);
