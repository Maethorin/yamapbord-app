'use strict';

scrumInCeresResources.factory('Login', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource('{0}/login'.format([appConfig.backendURL]));
}]);
