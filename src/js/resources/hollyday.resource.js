'use strict';

yamapBordResources.factory('Holiday', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource('{0}/me/holidays'.format([appConfig.backendURL]));
}]);
