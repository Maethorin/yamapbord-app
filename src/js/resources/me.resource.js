'use strict';

scrumInCeresResources.factory('Me', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource('{0}/me'.format([appConfig.backendURL]));
}]);
