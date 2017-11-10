'use strict';

scrumInCeresResources.factory('Hollyday', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource('{0}/me/hollydays'.format([appConfig.backendURL]));
}]);
