'use strict';

scrumInCeresControllers.controller('IceBoxController', ['$rootScope', '$scope', '$timeout', 'Alert', 'Notifier', 'StoryService', 'IceBox', function($rootScope, $scope, $timeout, Alert, Notifier, StoryService, IceBox) {
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
  $scope.newComment = {comment: null, creator: null, createdAt: null};
  $scope.newCommentVisible = false;
  $scope.scrollCommentOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: false, preventKeyEvents: false};

  Alert.loading();
  StoryService.getStories().then(function(stories) {
    $scope.stories = stories;
    Alert.close();
  });

  $rootScope.$watch('itemsView.mode', function(newValue) {
    _.forEach($scope.stories, function(story) {
      story.opened = newValue !== 'list';
    });
  });

  $rootScope.$on('story.filter.type', function(evt, type) {
    Alert.loading();
    StoryService.filterByType(type).then(function(stories) {
      $scope.stories = stories;
      Alert.close();
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
      module: null,
      epic: null,
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

  $scope.setStoryModule = function(story, module) {
    story.module = module;
  };

  $scope.setStoryEpic = function(story, epic) {
    story.epic = epic;
  };

  $scope.selectStoryToEdit = function($event, story, $index) {
    $event.stopPropagation();
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

  $scope.toggleEditStoryComment = function(comment, $event) {
    toggleEditInStoryList(comment, $event);
  };

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

  $scope.blurInputTaskFiled = function($event, selectedStory) {
    $timeout(
      function() {
        $scope.addTaskToStory($event, selectedStory);
      },
      150
    )
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


  $scope.addingCommentToStory = function() {
    $scope.newCommentVisible = true;
  };

  $scope.cancelAddCommentToStory = function($event) {
    $scope.newCommentVisible = false;
    $scope.newComment = {comment: null};
    $event.stopPropagation();
  };

  $scope.blurInputCommentFiled = function($event, selectedStory) {
    $timeout(
      function() {
        $scope.addCommentToStory($event, selectedStory);
      },
      150
    )
  };

  $scope.addCommentToStory = function($event, story) {
    if ($scope.newComment.comment === null) {
      return false;
    }
    story.comments.push({comment: $scope.newComment.comment, creatorId: $rootScope.loggedUser.id, creator: {name: $rootScope.loggedUser.name}, createdAt: moment().format('YYYY-MM-DD HH:mm')});
    $scope.newCommentVisible = false;
    $scope.newComment = {comment: null};
    $event.stopPropagation();
  };

  $scope.removeStoryComment = function(story, $index) {
    story.comments.splice($index, 1);
  };

  $scope.toggleOpenStoryPanel = function($event, story) {
    $event.stopPropagation();
    story.opened = !story.opened;
  };
}]);
