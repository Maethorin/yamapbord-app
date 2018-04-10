'use strict';

scrumInCeresServices.service('StoryService', ['$rootScope', '$q', '$timeout', 'Alert', 'IceBox', function($rootScope, $q, $timeout, Alert, IceBox) {
  var self = this;
  var filter = {};
  this.filterByType = function(type) {
    if (type !== null) {
      this.filter.type = type.code
    }
    else {
      delete this.filter.type;
    }
    return this.getStories();
  };

  this.filter = function(_filter) {
    filter = {};
    if (_filter.type) {
      filter.type = _filter.type.code;
    }
    if (_filter.epic) {
      filter.epicId = _filter.epic.id;
    }
    if (_filter.module) {
      filter.moduleId = _filter.module.id;
    }
    if (_filter.point) {
      filter.points = _filter.point;
    }
    if (_filter.valuePoint) {
      filter.valuePoints = _filter.valuePoint;
    }
    if (_filter.requester) {
      filter.requesterId = _filter.requester.id;
    }
    return this.getStories();
  };

  this.getReadyUse = function() {
    filter.readyToUse = true;
    return this.getStories();
  };

  this.getStories = function(clearFilter) {
    var result = $q.defer();
    if (clearFilter) {
      filter = {};
    }
    IceBox.query(
      filter,
      function(response) {
        result.resolve(response);
      },
      function(error) {
        result.reject(error);
      }
    );
    return result.promise;
  };

  function closingPopup($scope) {
    $scope.selectedStory = null;
    $scope.selectedStoryIndex = null;
    $scope.completeStoryPopupOpened = false;
  }

  function recalculateSelectedIterationPoints($scope, newStory) {
    if (!$scope.selectedIteration) {
      return false;
    }
    if (newStory) {
      $scope.selectedIteration.stories.push(newStory);
    }
    $scope.selectedIteration.points = 0;
    _.forEach($scope.selectedIteration.stories, function(story) {
      $scope.selectedIteration.points += (story.points || 0);
    });
  }

  function saveStoryAndClosePopup($scope) {
    if ($scope.addingNewStory) {
      createStory($scope, function(result) {
        closingPopup($scope);
        recalculateSelectedIterationPoints($scope, result.story);
        if ($scope.selectedIteration) {
          return;
        }
        $scope.stories = result.stories;
      });
    }
    else {
      updateStory($scope, function($scope) {
        recalculateSelectedIterationPoints($scope);
        closingPopup($scope)
      });
    }
  }

  function saveStoryAndKeepPopupOpen($scope) {
    if ($scope.addingNewStory) {
      createStory($scope, function(result) {
        recalculateSelectedIterationPoints($scope, result.story);
        if (result.story !== null) {
          $scope.selectedStory = result.story;
          if ($scope.selectedIteration) {
            return;
          }
          $scope.stories.push(result.story);
        }
      });
    }
    else {
      updateStory($scope, function($scope) {
        recalculateSelectedIterationPoints($scope);
      });
    }
  }

  function updateStory($scope, success) {
    self.updateInIceLog($scope.selectedStory).then(
      function() {
        if (success) {
          success($scope);
        }
        Alert.randomSuccessMessage();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  }

  function createStory($scope, success) {
    $scope.addingNewStory = false;
    self.addToIceLog($scope.selectedStory).then(
      function(result) {
        success(result);
        Alert.randomSuccessMessage();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  }

  this.addToIceLog = function(newStory) {
    var result = $q.defer();
    IceBox.save(
      newStory,
      function(response) {
        self.getStories().then(
          function(stories) {
            result.resolve({stories: stories, story: response});
          },
          function(error) {
            Alert.warning('Saved!', 'Story was created but could not update stories list. Plz refresh page.');
            result.resolve({stories: [], story: response});
          }
        );
      },
      function(error) {
        result.reject(error);
      }
    );
    return result.promise;
  };

  this.updateInIceLog = function(story) {
    var result = $q.defer();
    IceBox.update(
      {id: story.id},
      story,
      function() {
        result.resolve();
      },
      function(error) {
        result.reject(error);
      }
    );
    return result.promise;
  };

  this.getFullStory = function(storyId) {
    var result = $q.defer();
    IceBox.get(
      {id: storyId},
      function(response) {
        result.resolve(response);
      },
      function(error) {
        result.reject(error);
      }
    );
    return result.promise;
  };

  this.turnCompactStoryAsComplete = function(compact, complete) {
    compact.tasks = complete.tasks;
    compact.definitionOfDone = complete.definitionOfDone;
    compact.comments = complete.comments;
    compact.epic = complete.epic;
    compact.module = complete.module;
    compact.requester = complete.requester;
    compact.owner = complete.owner;
  };

  this.prepareScopeToEditStory = function($scope) {
    $scope.completeStoryPopupOpened = false;
    $scope.selectedStory = null;
    $scope.selectedIteration = null;
    $scope.addingNewStory = false;
    $scope.selectedStoryIndex = null;
    $scope.newTask = {task: null};
    $scope.newTaskVisible = false;
    $scope.newDefinition = {definition: null};
    $scope.newDefinitionVisible = false;
    $scope.newComment = {comment: null, creator: null, createdAt: null};
    $scope.newCommentVisible = false;
    $scope.scrollCommentOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: false, preventKeyEvents: false};
    $scope.saveAndClose = false;

    $scope.addNewStory = function($event, data) {
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
        comments: [],
        type: 'FEA',
        typeName: 'Feature'
      };
      if (data) {
        $scope.selectedIteration = data.iteration;
        if (data.iterationType === 'kanban') {
          $scope.selectedStory.kanbanId = data.iteration.id;
        }
        if (data.iterationType === 'sprint') {
          $scope.selectedStory.sprintId = data.iteration.id;
        }
      }
      $scope.completeStoryPopupOpened = true;
    };

    $rootScope.$on('story.add', $scope.addNewStory);

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
      if ($scope.selectedSprint && !$scope.selectedSprint.isPlanned) {
        $scope.toggleShowStoryPopup(story);
        return false;
      }
      Alert.loading();
      $scope.addingNewStory = false;
      $scope.selectedStoryIndex = $index;
      // TODO: TARTARUGA. Pra tirar essa aqui, precisa renomear $scope.selectedSprint para $scope.selectedIteration em todos os lugares
      $scope.selectedIteration = $scope.selectedSprint;
      self.getFullStory(story.id).then(
        function(response) {
          $scope.selectedStory = story;
          self.turnCompactStoryAsComplete($scope.selectedStory, response);
          $scope.completeStoryPopupOpened = true;
          Alert.close();
        },
        function(error) {
          Alert.randomErrorMessage(error);
        }
      );
    };

    $scope.saveSelectedStory = function(form, saveAndClose) {
      if (form.$invalid) {
        Alert.randomErrorMessage('Invalid fields.', 'Invalid fields.');
        return false;
      }

      Alert.loading();

      if (saveAndClose) {
        saveStoryAndClosePopup($scope);
      }
      else {
        saveStoryAndKeepPopupOpen($scope);
      }
    };

    $scope.cancelSaveSelectedStory = function() {
      $scope.selectedStory = null;
      $scope.selectedStoryIndex = null;
      $scope.addingNewStory = false;
      $scope.completeStoryPopupOpened = false;
    };

    $scope.toggleEditInStoryList = function(element, $event) {
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
    };

    $scope.toggleEditStoryComment = function(comment, $event) {
      $scope.toggleEditInStoryList(comment, $event);
    };

    $scope.toggleEditStoryTask = function(task, $event) {
      $scope.toggleEditInStoryList(task, $event);
    };

    $scope.toggleEditStoryDefinition = function(definition, $event) {
      $scope.toggleEditInStoryList(definition, $event);
    };

    $scope.addingTaskToStory = function() {
      $scope.newTaskVisible = true;
    };

    $scope.cancelAddTaskToStory = function($event) {
      $scope.newTaskVisible = false;
      $scope.newTask = {task: null};
      $event.stopPropagation();
    };

    $scope.blurInputTaskField = function($event, selectedStory) {
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
  }
}]);