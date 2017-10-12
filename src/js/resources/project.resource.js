'use strict';

scrumInCeresResources.factory('Project', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource('{0}/users/me/projects/:id'.format([appConfig.backendURL]));
}]);
