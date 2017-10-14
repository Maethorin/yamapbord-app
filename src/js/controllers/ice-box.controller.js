'use strict';

scrumInCeresControllers.controller('IceBoxController', ['$rootScope', '$scope', 'Alert', 'IceBox', function($rootScope, $scope, Alert, IceBox) {
  $rootScope.selectedProject = null;
  $rootScope.currentController = 'IceBoxController';

  $scope.scrollOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: true};
  $scope.points = [0, 1, 2, 3, 5, 8];
  $scope.completeStoryPopupOpened = false;
  $scope.selectedStory = null;
  $scope.addingNewStory = false;
  $scope.selectedStoryIndex = null;

  var filter = {};

  $scope.newTask = {task: null};
  $scope.newTaskVisible = false;
  $scope.newDefinition = {definition: null};
  $scope.newDefinitionVisible = false;

  function getStories() {
    IceBox.query(
      filter,
      function(response) {
        $scope.stories = response;
      }
    );
  }

  getStories();

  $rootScope.$on('story.filter.type', function(evt, type) {
    if (type !== null) {
      filter.type = type.code
    }
    else {
      delete filter.type;
    }
    getStories();
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

  $scope.setStoryType = function(story, type) {
    story.type = type.code;
    story.typeName = type.name;
  };

  $scope.selectStoryToEdit = function(story, $index) {
    $scope.selectedStory = _.cloneDeep(story);
    $scope.selectedStoryIndex = $index;
    $scope.completeStoryPopupOpened = true;
  };

  $scope.saveSelectedStory = function(form) {
    if (form.$invalid) {
      Alert.error(
        'Sum Ten Wong',
        'Invalid fields.'
      );
      return false;
    }

    if ($scope.addingNewStory) {
      IceBox.save(
        $scope.selectedStory,
        function() {
          getStories();
          $scope.addingNewStory = false;
          $scope.selectedStory = null;
          $scope.completeStoryPopupOpened = false;
        },
        function(error) {
          Alert.error('Sum Ten Wong', error.data.exception);
        }
      );
      return;
    }
    IceBox.update(
      {id: $scope.selectedStory.id},
      $scope.selectedStory,
      function() {
        $scope.stories[$scope.selectedStoryIndex] = $scope.selectedStory;
        $scope.selectedStoryIndex = null;
        $scope.selectedStory = null;
        $scope.completeStoryPopupOpened = false;
      },
      function(error) {
        Alert.error('Sum Ten Wong', error.data.exception);
      }
    );
  };

  $scope.cancelSaveSelectedStory = function() {
    $scope.selectedStory = null;
    $scope.selectedStoryIndex = null;
    $scope.completeStoryPopupOpened = false;
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
