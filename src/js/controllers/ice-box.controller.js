'use strict';

scrumInCeresControllers.controller('IceBoxController', ['$rootScope', '$scope', 'Alert', 'Notifier', 'StoryService', 'IceBox', function($rootScope, $scope, Alert, Notifier, StoryService, IceBox) {
  $rootScope.currentController = 'IceBoxController';
  $scope.scrollOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: true};
  $scope.filterBarExpanded = false;
  $scope.filter = {
    type: null,
    epic: null,
    module: null,
    point: null,
    requester: null
  };
  $scope.groupedStories = false;

  Alert.loading();
  StoryService.getStories().then(function(stories) {
    $scope.stories = stories;
    Alert.close();
  });

  $scope.toggleFilterBarExpanded = function () {
    $scope.filterBarExpanded = !$scope.filterBarExpanded;
  };

  $scope.selectFilter = function(property, value) {
    $scope.filter[property] = value;
    Alert.loading();
    StoryService.filter($scope.filter).then(function(stories) {
      $scope.stories = stories;
      Alert.close();
    });
  };

  $rootScope.$watch('itemsView.mode', function(newValue) {
    _.forEach($scope.stories, function(story) {
      story.opened = newValue !== 'list';
    });
  });

  $rootScope.$on('story.grouped', function() {
    $scope.groupedStories = false;
    if ($rootScope.storyGroupedBy === 'Module') {
      $scope.groupedStories = _.groupBy($scope.stories, 'module.id');
    }
    if ($rootScope.storyGroupedBy === 'Epic') {
      $scope.groupedStories = _.groupBy($scope.stories, 'epic.id');
    }
    console.log($scope.groupedStories)
  });

  $rootScope.$on('icebox.story.created', function(event, data) {
    IceBox.get(
      {id: data.storyId},
      function(response) {
        Notifier.warning('Story created');
        $scope.stories.push(response);
      },
      function() {
        Notifier.danger('Changes has been made and could not be updated', 'Hey!');
      }
    );
  });

  $rootScope.$on('icebox.story.updated', function(event, data) {
    IceBox.get(
      {id: data.storyId},
      function(response) {
        Notifier.warning('Story updated');
        var index = _.findIndex($scope.stories, ['id', data.storyId]);
        $scope.stories[index] = response;
      },
      function() {
        Notifier.danger('Changes has been made and could not be updated', 'Hey!');
      }
    );
  });

  $rootScope.$on('icebox.story.deleted', function(event, data) {
    Notifier.warning('Story deleted');
    var index = _.findIndex($scope.stories, ['id', data.storyId]);
    $scope.stories.splice(index, 1);
  });

  $scope.changeScroll = function() {
    $scope.$broadcast('content.changed');
  };

  StoryService.prepareScopeToEditStory($scope);
}]);
