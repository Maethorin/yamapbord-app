'use strict';

scrumInCeresResources.factory('IceBox', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/icebox/stories/:id'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
