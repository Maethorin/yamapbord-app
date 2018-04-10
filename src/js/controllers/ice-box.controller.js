'use strict';

scrumInCeresControllers.controller('IceBoxController', ['$rootScope', '$scope', 'Alert', 'Notifier', 'StoryService', 'IceBox', function($rootScope, $scope, Alert, Notifier, StoryService, IceBox) {
  $rootScope.currentController = 'IceBoxController';
  $rootScope.itemsView.mode = 'table';
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
  $scope.storyGroupedBy = 'both';

  function groupStories() {
    $scope.groupedStories = false;
    if ($scope.storyGroupedBy === 'module') {
      $scope.groupedStories = _.groupBy($scope.stories, 'module.id');
    }
    if ($scope.storyGroupedBy === 'epic') {
      $scope.groupedStories = _.groupBy($scope.stories, 'epic.id');
    }
    if ($scope.storyGroupedBy === 'both') {
      $scope.groupedStories = [];
      var tempGroupStories = _.groupBy($scope.stories, 'module.id');
      _.forEach(tempGroupStories, function(group) {
        $scope.groupedStories.push(
          {
            module: group[0].module,
            stories: _.groupBy(group, 'epic.id')
          }
        );
      });
      console.log($scope.groupedStories);
    }
  }

  Alert.loading();
  var clearFilter = true;
  StoryService.getStories(clearFilter).then(function(stories) {
    $scope.stories = stories;
    groupStories();
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
      $rootScope.$broadcast('story.grouped');
      Alert.close();
    });
  };

  $scope.$watch('storyGroupedBy', groupStories);

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
