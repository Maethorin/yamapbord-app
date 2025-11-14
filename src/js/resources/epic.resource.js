'use strict';

yamapBordResources.factory('Epic', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource('{0}/users/me/epics'.format([appConfig.backendURL]));
}]);
