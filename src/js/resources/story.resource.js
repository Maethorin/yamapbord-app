'use strict';

scrumInCeresResources.factory('Story', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/sprints/:sprintId/stories/:id'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
