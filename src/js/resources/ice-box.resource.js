'use strict';

yamapBordResources.factory('IceBox', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/icebox/stories/:storyId'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
