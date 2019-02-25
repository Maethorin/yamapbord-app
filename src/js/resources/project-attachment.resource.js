'use strict';

scrumInCeresResources.factory('ProjectAttachment', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/projects/:projectId/attachments/:attachmentId'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
