'use strict';

yamapBordResources.factory('BacklogSprint', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{backendURL}/users/me/backlog/sprints/:id'.format(appConfig),
    null,
    {update: {method: 'PUT'}}
  );
}]);
