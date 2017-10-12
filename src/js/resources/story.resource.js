'use strict';

scrumInCeresResources.factory('Story', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource('{0}/users/me/projects/:projectId/sprints/:sprintId/stories'.format([appConfig.backendURL]));
}]);
