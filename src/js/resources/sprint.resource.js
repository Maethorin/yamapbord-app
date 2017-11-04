'use strict';

scrumInCeresResources.factory('Sprint', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/sprints/:sprintId'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
