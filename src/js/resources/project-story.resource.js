'use strict';

yamapBordResources.factory('ProjectStory', ['$resource', 'appConfig', function ($resource, appConfig) {
  return $resource(
    '{0}/users/me/projects/:projectId/stories/:storyId'.format([appConfig.backendURL]),
    null,
    {update: {method: 'PUT'}}
  );
}]);
