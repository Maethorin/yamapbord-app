'use strict';

scrumInCeresServices.service('StoryService', ['$rootScope', '$q', '$timeout', 'Alert', 'Notifier', 'IceBox', function($rootScope, $q, $timeout, Alert, Notifier, IceBox) {
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
    if (_filter.project) {
      filter.projectId = _filter.project.id;
    }
    if (_filter.module) {
      filter.moduleId = _filter.module.id;
    }
    if (_filter.epic) {
      filter.epicId = _filter.epic.id;
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
    if (_filter.status) {
      filter.status = _filter.status;
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
        $scope.fullStories = result.stories;
        $scope.searchStories();
      });
    }
    else {
      updateStory($scope, function($scope) {
        recalculateSelectedIterationPoints($scope);
        closingPopup($scope)
      });
    }
  }

  function deleteStoryAndClosePopup($scope) {
    deleteStory($scope, function($scope) {
      recalculateSelectedIterationPoints($scope);
      closingPopup($scope)
    });
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
          $scope.fullStories.push(result.story);
          $scope.searchStories();
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

  function deleteStory($scope, success) {
    self.deleteInIceLog($scope.selectedStory).then(
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

  function deleteStoryInList(story, success) {
    self.deleteInIceLog(story).then(
      function() {
        if (success) {
          success(story);
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

  this.deleteInIceLog = function(story) {
    var result = $q.defer();
    IceBox.delete(
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
    compact.mergeRequests = complete.mergeRequests;
    compact.project = complete.project;
    compact.module = complete.module;
    compact.epic = complete.epic;
    compact.requester = complete.requester;
    compact.owner = complete.owner;
    compact.sprint = complete.sprint;
    compact.kanban = complete.kanban;
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
    $scope.newComment = {comment: null, file: null, link: null, creator: null, createdAt: null};
    $scope.newCommentVisible = false;
    $scope.newCommentType = null;
    $scope.theButtonWasCliked = false;
    $scope.scrollCommentOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: false, preventKeyEvents: false};
    $scope.newMergeRequest = {url: null, creator: null, createdAt: null};
    $scope.newMergeRequestVisible = false;
    $scope.scrollMergeRequestOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: false, preventKeyEvents: false};
    $scope.saveAndClose = false;

    $scope.addNewStory = function(data, forProject) {
      $scope.addingNewStory = true;
      $scope.selectedStory = {
        definitionOfDone: [],
        name: null,
        percentageComplete: 0,
        points: null,
        statement: null,
        project: null,
        module: null,
        epic: null,
        status: 'PLAN',
        statusName: 'Planned',
        tasks: [],
        comments: [],
        mergeRequests: [],
        type: 'FEA',
        typeName: 'Feature',
        requester: {id: $rootScope.loggedUser.id, name: $rootScope.loggedUser.name}
      };
      if (data) {
        $scope.selectedIteration = data.iteration;
        if (data.iterationType === 'kanban') {
          $scope.selectedStory.kanbanId = data.iteration.id;
        }
        if (data.iterationType === 'sprint') {
          $scope.selectedStory.sprintId = data.iteration.id;
        }
        if (data.project) {
          $scope.selectedStory.project = {id: data.project.id};
        }
        if (data.module) {
          $scope.selectedStory.module = data.module;
        }
        if (data.epic) {
          $scope.selectedStory.epic = data.epic;
        }
        if (data.type) {
          $scope.selectedStory.type = data.type;
        }
      }
      if (forProject) {
        return $scope.selectedStory;
      }
      $scope.completeStoryPopupOpened = true;
      $rootScope.lateralMenuOpen = false;
    };

    $rootScope.$on('story.add', function(event, data) {
      $scope.addNewStory(data);
    });

    $scope.setStoryType = function(story, type) {
      story.type = type.code;
      story.typeName = type.name;
    };

    $scope.setStoryProject = function(story, project) {
      story.project = project;
    };

    $scope.setStoryModule = function(story, module) {
      story.module = module;
    };

    $scope.setStoryEpic = function(story, epic) {
      story.epic = epic;
    };

    $scope.selectStoryToEdit = function($event, story, $index) {
      $event.stopPropagation();
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

    $scope.deleteSelectedStory = function() {
      Alert.loading();
      deleteStoryAndClosePopup($scope);
    };

    $scope.fixModuleName = function(nameToFix) {
      $scope.fixedModuleName = nameToFix;
    };

    $scope.fixEpicName = function(nameToFix) {
      $scope.fixedEpicName = nameToFix;
    };

    $scope.deleteUnselectedStory = function(event, story) {
      event.stopPropagation();
      Alert.loading();
      deleteStoryInList(story);
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

    $scope.toggleEditStoryMergeRequest = function(mergeRequest, $event) {
      $scope.toggleEditInStoryList(mergeRequest, $event);
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

    $scope.addingTaskToStory = function(story) {
      if (story) {
        story.newTaskVisible = true;
      }
      $scope.newTaskVisible = true;
    };

    $scope.cancelAddTaskToStory = function($event, story) {
      if (story) {
        story.newTaskVisible = false;
      }
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
      story.newTaskVisible = false;
      $scope.newTask = {task: null};
      $event.stopPropagation();
    };

    $scope.removeStoryTask = function(story, $index) {
      story.tasks.splice($index, 1);
    };

    $scope.addingDefinitionToStory = function(story) {
      if (story) {
        story.newDefinitionVisible = true;
      }
      $scope.newDefinitionVisible = true;
    };

    $scope.cancelAddDefinitionToStory = function($event, story) {
      if (story) {
        story.newDefinitionVisible = false;
      }
      $scope.newDefinitionVisible = false;
      $scope.newDefinition = {definition: null};
      $event.stopPropagation();
    };

    $scope.blurInputDefinitionField = function($event, selectedStory) {
      $timeout(
        function() {
          $scope.addDefinitionToStory($event, selectedStory);
        },
        150
      );
    };

    $scope.addDefinitionToStory = function($event, story) {
      if ($scope.newDefinition.definition === null) {
        return false;
      }
      story.definitionOfDone.push({definition: $scope.newDefinition.definition, done: false});
      story.newDefinitionVisible = false;
      $scope.newDefinitionVisible = false;
      $scope.newDefinition = {definition: null};
      $event.stopPropagation();
    };

    $scope.removeStoryDefinition = function(story, $index) {
      story.definitionOfDone.splice($index, 1);
    };

    $scope.addingCommentToStory = function(type, story) {
      if (story) {
        story.newCommentVisible = true;
        story.newCommentType = type;
      }
      $scope.newCommentVisible = true;
      $scope.newCommentType = type;
      $scope.theButtonWasCliked = false;
    };

    $scope.cancelAddCommentToStory = function($event, story) {
      if (story) {
        story.newCommentVisible = false;
      }
      $scope.theButtonWasCliked = true;
      $scope.newCommentVisible = false;
      $scope.newCommentType = null;
      $scope.newComment = {comment: null, file: null, link: null, creator: null, createdAt: null};
      $event.stopPropagation();
    };

    $scope.blurInputCommentField = function($event, selectedStory) {
      $timeout(
        function() {
          if (!$scope.theButtonWasCliked) {
            $scope.addCommentToStory($event, selectedStory);
          }
        },
        200
      )
    };

    $scope.addCommentToStory = function($event, story) {
      if ($scope.newComment[$scope.newCommentType] === null) {
        Notifier.warning('You want to {0}, you need to {0} something!'.format([$scope.newCommentType]))
        return false;
      }
      if ($scope.newCommentType === 'link' && !$scope.newComment[$scope.newCommentType].startsWith('http')) {
        Notifier.warning('Links should start with http or https. Didnt you know that?!?');
        return false;
      }
      $scope.theButtonWasCliked = true;
      story.comments.push({
        comment: $scope.newComment.comment,
        file: $scope.newComment.file,
        link: $scope.newComment.link,
        creatorId: $rootScope.loggedUser.id,
        creator: {name: $rootScope.loggedUser.name},
        createdAt: moment().format('YYYY-MM-DD HH:mm')
      });
      story.newCommentVisible = false;
      story.newCommentType = null;
      $scope.newCommentVisible = false;
      $scope.newCommentType = null;
      $scope.newComment = {comment: null, file: null, link: null, creator: null, createdAt: null};
      $event.stopPropagation();
    };

    $scope.removeStoryComment = function(story, $index) {
      story.comments.splice($index, 1);
    };

    $scope.addingMergeRequestToStory = function() {
      $scope.newMergeRequestVisible = true;
    };

    $scope.cancelAddMergeRequestToStory = function($event) {
      $scope.newMergeRequestVisible = false;
      $scope.newMergeRequest = {url: null};
      $event.stopPropagation();
    };

    $scope.blurInputMergeRequestField = function($event, selectedStory) {
      $timeout(
        function() {
          $scope.addMergeRequestToStory($event, selectedStory);
        },
        150
      );
    };

    $scope.addMergeRequestToStory = function($event, story) {
      if ($scope.newMergeRequest.url === null) {
        Notifier.warning('I think is something missing, like THE merge request URL...');
        return false;
      }
      if (!$scope.newMergeRequest.url.startsWith('http')) {
        Notifier.warning('URLs should start with http or https. Didnt you know that?!?');
        return false;
      }

      if (story.mergeRequests === null) {
        story.mergeRequests = [];
      }
      story.mergeRequests.push({url: $scope.newMergeRequest.url, creatorId: $rootScope.loggedUser.id, creator: {name: $rootScope.loggedUser.name}, createdAt: moment().format('YYYY-MM-DD HH:mm')});
      $scope.newMergeRequestVisible = false;
      $scope.newMergeRequest = {url: null};
      $event.stopPropagation();
    };

    $scope.removeStoryMergeRequest = function(story, $index) {
      story.mergeRequests.splice($index, 1);
    };

    $scope.toggleOpenStoryPanel = function($event, story) {
      $event.stopPropagation();
      story.opened = !story.opened;
    };

    $scope.stopPropagation = function(event) {
      event.stopPropagation();
    };

    $scope.getNameInitials = function(fullName) {
      if (!fullName) {
        return '';
      }
      fullName = fullName.split(' ');
      return '{0}{1}'.format([fullName[0][0].toUpperCase(), fullName[fullName.length - 1][0].toUpperCase(), ])
    }
  }
}]);