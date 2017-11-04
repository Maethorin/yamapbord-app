'use strict';

scrumInCeresResources.factory('Epic', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource('{0}/users/me/epics/:id'.format([appConfig.backendURL]));
}]);
