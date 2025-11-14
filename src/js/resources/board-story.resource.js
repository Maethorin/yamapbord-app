'use strict';

yamapBordResources.factory('BoardStory', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/boards/:boardId/stories/:storyId'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
