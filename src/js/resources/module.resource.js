'use strict';

scrumInCeresResources.factory('Module', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/modules/:id'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
