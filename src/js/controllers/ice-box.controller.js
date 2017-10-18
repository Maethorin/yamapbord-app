'use strict';

scrumInCeresControllers.controller('IceBoxController', ['$rootScope', '$scope', 'Alert', 'Notifier', 'StoryService', 'IceBox', function($rootScope, $scope, Alert, Notifier, StoryService, IceBox) {
  $rootScope.selectedProject = null;
  $rootScope.currentController = 'IceBoxController';

  $scope.scrollOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: true};
  $scope.points = [0, 1, 2, 3, 5, 8];
  $scope.completeStoryPopupOpened = false;
  $scope.selectedStory = null;
  $scope.addingNewStory = false;
  $scope.selectedStoryIndex = null;

  $scope.newTask = {task: null};
  $scope.newTaskVisible = false;
  $scope.newDefinition = {definition: null};
  $scope.newDefinitionVisible = false;

  Alert.loading();
  StoryService.getStories().then(function(stories) {
    $scope.stories = stories;
    Alert.close();
  });

  $rootScope.$on('story.filter.type', function(evt, type) {
    StoryService.filterByType(type).then(function(stories) {
      $scope.stories = stories;
    });
  });

  $rootScope.$on('story.add', function() {
    $scope.addingNewStory = true;
    $scope.selectedStory = {
      definitionOfDone: [],
      name: null,
      percentageComplete: 0,
      points: null,
      statement: null,
      status: 'PLAN',
      tasks: [],
      type: 'FEA',
      typeName: 'Feature'
    };
    $scope.completeStoryPopupOpened = true;
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

  $scope.setStoryType = function(story, type) {
    story.type = type.code;
    story.typeName = type.name;
  };

  $scope.selectStoryToEdit = function(story, $index) {
    $scope.selectedStory = _.cloneDeep(story);
    $scope.addingNewStory = false;
    $scope.selectedStoryIndex = $index;
    $scope.completeStoryPopupOpened = true;
  };

  $scope.saveSelectedStory = function(form) {
    if (form.$invalid) {
      Alert.randomErrorMessage('Invalid fields.', 'Invalid fields.');
      return false;
    }

    Alert.loading();
    if ($scope.addingNewStory) {
      StoryService.addToIceLog($scope.selectedStory).then(
        function(stories) {
          $scope.stories = stories;
          $scope.addingNewStory = false;
          $scope.selectedStory = null;
          $scope.completeStoryPopupOpened = false;
          Alert.randomSuccessMessage();
        },
        function(error) {
          Alert.randomErrorMessage(error);
        }
      );
      return;
    }
    StoryService.updateInIceLog($scope.selectedStory).then(
      function() {
        $scope.stories[$scope.selectedStoryIndex] = $scope.selectedStory;
        $scope.selectedStoryIndex = null;
        $scope.selectedStory = null;
        $scope.completeStoryPopupOpened = false;
        Alert.randomSuccessMessage();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.cancelSaveSelectedStory = function() {
    $scope.selectedStory = null;
    $scope.selectedStoryIndex = null;
    $scope.addingNewStory = false;
    $scope.completeStoryPopupOpened = false;
  };

  function toggleEditInStoryList(element, $event) {
    if ($event) {
      if ($event.which === 13) {
        $event.preventDefault();
      }
      return
    }
    if (!element.editing) {
      element.editing = true;
    }
    else {
      delete element.editing;
    }
  }

  $scope.toggleEditStoryTask = function(task, $event) {
    toggleEditInStoryList(task, $event);
  };

  $scope.toggleEditStoryDefinition = function(definition, $event) {
    toggleEditInStoryList(definition, $event);
  };

  $scope.addingTaskToStory = function() {
    $scope.newTaskVisible = true;
  };

  $scope.cancelAddTaskToStory = function($event) {
    $scope.newTaskVisible = false;
    $scope.newTask = {task: null};
    $event.stopPropagation();
  };

  $scope.addTaskToStory = function($event, story) {
    if ($scope.newTask.task === null) {
      return false;
    }
    story.tasks.push({task: $scope.newTask.task, complete: false});
    $scope.newTaskVisible = false;
    $scope.newTask = {task: null};
    $event.stopPropagation();
  };

  $scope.removeStoryTask = function(story, $index) {
    story.tasks.splice($index, 1);
  };

  $scope.addingDefinitionToStory = function() {
    $scope.newDefinitionVisible = true;
  };

  $scope.cancelAddDefinitionToStory = function($event) {
    $scope.newDefinitionVisible = false;
    $scope.newDefinition = {definition: null};
    $event.stopPropagation();
  };

  $scope.addDefinitionToStory = function($event, story) {
    if ($scope.newDefinition.definition === null) {
      return false;
    }
    story.definitionOfDone.push({definition: $scope.newDefinition.definition, done: false});
    $scope.newDefinitionVisible = false;
    $scope.newDefinition = {definition: null};
    $event.stopPropagation();
  };

  $scope.removeStoryDefinition = function(story, $index) {
    story.definitionOfDone.splice($index, 1);
  };
}]);
