'use strict';

scrumInCeresResources.factory('Requester', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource('{0}/users/me/requesters'.format([appConfig.backendURL]));
}]);
