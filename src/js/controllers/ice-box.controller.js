'use strict';

scrumInCeresControllers.controller('IceBoxController', ['$rootScope', '$scope', '$filter', 'Alert', 'Notifier', 'StoryService', 'IceBox', function($rootScope, $scope, $filter, Alert, Notifier, StoryService, IceBox) {
  $rootScope.currentController = 'IceBoxController';
  $rootScope.itemsView.mode = 'table';
  $scope.storyFilterTextTypes = {
    name: {type: 'name', name: 'By Name'},
    statement: {type: 'statement', name: 'By Statement'},
    tasks: {type: 'tasks', name: 'By Task'},
    definition: {type: 'definitionOfDone', name: 'By Definition'}
  };

  $scope.storyFilterObjects = {
    name: {name: ''},
    statement: {statement: ''},
    tasks: {tasks: ''},
    definition: {definitionOfDone: ''}
  };

  $scope.filterObject = {'name': ''};
  $scope.search = {
    expression: '',
    fieldType: {type: 'name', name: 'By Name'}
  };

  $scope.scrollOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: true};
  $scope.filterBarExpanded = false;
  $scope.stories = [];
  $scope.fullStories = [];
  $scope.filter = {
    type: null,
    epic: null,
    module: null,
    point: null,
    requester: null
  };
  $scope.groupedStories = false;
  $scope.storyGroupedBy = 'both';
  $scope.storiesOrder = [];
  $scope.storiesOrderControl = {
    type: null,
    name: null,
    statement: null,
    vp: null,
    sp: null,
    requester: null
  };

  $scope.mainFabOpen = false;

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
    }
  }

  Alert.loading();
  var clearFilter = true;
  StoryService.getStories(clearFilter).then(function(stories) {
    $scope.stories = stories;
    $scope.fullStories = stories;
    $scope.searchStories();
    Alert.close();
  });

  $scope.setStoryFilterTextType = function(type) {
    $scope.search.fieldType = $scope.storyFilterTextTypes[type];
  };

  $scope.searchStories = function(clear) {
    if (clear) {
      $scope.setStoryFilterTextType('name');
      $scope.storyFilterObjects = {
        name: {name: ''},
        statement: {statement: ''},
        tasks: {tasks: ''},
        definition: {definitionOfDone: ''}
      };
      $scope.search.expression = '';
    }
    $scope.storyFilterObjects[$scope.search.fieldType.type][$scope.search.fieldType.type] = $scope.search.expression;
    $scope.filterObject.filter = $scope.storyFilterObjects[$scope.search.fieldType.type];
    $scope.stories = $filter('filter')($scope.fullStories, $scope.filterObject.filter);
    groupStories();
  };

  $scope.toggleFilterBarExpanded = function () {
    $scope.filterBarExpanded = !$scope.filterBarExpanded;
  };

  $scope.selectFilter = function(property, value) {
    $scope.filter[property] = value;
    Alert.loading();
    StoryService.filter($scope.filter).then(function(stories) {
      $scope.fullStories = stories;
      $scope.searchStories();
      Alert.close();
    });
  };

  $scope.setStoryOrder = function(property) {
    if ($scope.storiesOrderControl[property] === null) {
      $scope.storiesOrderControl[property] = '+';
    }
    else if ($scope.storiesOrderControl[property] === '+') {
      $scope.storiesOrderControl[property] = '-';
    }
    else if ($scope.storiesOrderControl[property] === '-') {
      $scope.storiesOrderControl[property] = null;
    }
    var newOrder = $scope.storiesOrderControl[property] === null ? null : '{0}{1}'.format([$scope.storiesOrderControl[property], property]);
    var indexPropertyOrder = null;
    _.forEach($scope.storiesOrder, function(order, index) {
      if (order.indexOf(property) > -1) {
        indexPropertyOrder = index;
        return false;
      }
    });

    if (indexPropertyOrder === null) {
      $scope.storiesOrder.push(newOrder);
    }
    else {
      if (newOrder == null) {
        $scope.storiesOrder.splice(indexPropertyOrder, 1)
      }
      else {
        $scope.storiesOrder[indexPropertyOrder] = newOrder;
      }
    }
  };

  $scope.addStoryToEpic = function(module, epic, type, storyGroupedBy) {
    var data = {type: type};
    if (['both', 'module'].indexOf(storyGroupedBy) > -1) {
      data.module = module;
    }
    if (['both', 'epic'].indexOf(storyGroupedBy) > -1) {
      data.epic = epic;
    }
    $scope.addNewStory(data);
  };

  $scope.addEpic = function() {
    Alert.itsOpenSourceDude();
  };

  $scope.addModule = function() {
    Alert.itsOpenSourceDude();
  };

  $scope.$watch('storyGroupedBy', groupStories);

  $rootScope.$on('icebox.story.created', function(event, data) {
    IceBox.get(
      {id: data.storyId},
      function(response) {
        Notifier.warning('Story created');
        $scope.fullStories.push(response);
        $scope.searchStories();
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
        $scope.fullStories[index] = response;
        $scope.searchStories();
      },
      function() {
        Notifier.danger('Changes has been made and could not be updated', 'Hey!');
      }
    );
  });

  $rootScope.$on('icebox.story.deleted', function(event, data) {
    Notifier.warning('Story deleted');
    var index = _.findIndex($scope.stories, ['id', data.storyId]);
    $scope.fullStories.splice(index, 1);
    $scope.searchStories();
  });

  $scope.changeScroll = function() {
    $scope.$broadcast('content.changed');
  };

  StoryService.prepareScopeToEditStory($scope);
}]);
