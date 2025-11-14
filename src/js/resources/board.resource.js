'use strict';

yamapBordResources.factory('Board', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/boards/:boardId'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
