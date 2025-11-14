'use strict';

yamapBordResources.factory('BacklogKanban', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{backendURL}/users/me/backlog/kanbans/:id'.format(appConfig),
    null,
    {update: {method: 'PUT'}}
  );
}]);
