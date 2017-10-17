'use strict';

scrumInCeresResources.factory('Backlog', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{backendURL}/users/me/backlog/sprints/:id'.format(appConfig),
    null,
    {update: {method: 'PUT'}}
  );
}]);
