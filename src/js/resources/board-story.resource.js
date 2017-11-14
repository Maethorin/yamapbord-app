'use strict';

scrumInCeresResources.factory('BoardStory', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/boards/:boardId/stories/:id'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
