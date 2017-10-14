'use strict';

scrumInCeresResources.factory('Backlog', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/backlog/sprints/:id'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
