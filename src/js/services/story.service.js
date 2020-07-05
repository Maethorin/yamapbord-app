'use strict';

scrumInCeresServices.service('StoryService', ['$rootScope', '$q', '$timeout', 'Alert', 'Notifier', 'IceBox', 'Upload', function($rootScope, $q, $timeout, Alert, Notifier, IceBox, Upload) {
  var self = this;
  var filter = {};
  this.filterByType = function(type) {
    if (type !== null) {
      this.filter.type = type.code
    }
    else {
      delete this.filter.type;
    }
    return this.getIceboxStories();
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
    return this.getIceboxStories();
  };

  this.getReadyUse = function() {
    filter.readyToUse = true;
    return this.getIceboxStories();
  };

  this.getIceboxStories = function(clearFilter) {
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

  function saveStoryAndClosePopup($scope, updateIcebox) {
    if ($scope.addingNewStory) {
      createStory(
        $scope,

        function(result) {
          closingPopup($scope);
          recalculateSelectedIterationPoints($scope, result);
          $scope.$broadcast('story.addedToIteration', {closePopup: true, storyId: result.id});
          if ($scope.selectedIteration) {
            return;
          }
          $scope.stories = result.stories;
          $scope.fullStories = result.stories;
          $scope.searchStories();
        },

        updateIcebox
      );
    }
    else {
      updatingStory($scope, function($scope) {
        recalculateSelectedIterationPoints($scope);
        closingPopup($scope)
      });
    }
  }

  function saveStoryAndKeepPopupOpen($scope, updateIcebox) {
    if ($scope.addingNewStory) {
      createStory(
        $scope,

        function(result) {
          recalculateSelectedIterationPoints($scope, result);
          $scope.$broadcast('story.addedToIteration', {closePopup: false, storyId: result.id});
          $scope.selectedStory = result;
          if ($scope.selectedIteration) {
            return;
          }
          $scope.stories.push(result);
          $scope.fullStories.push(result);
          $scope.searchStories();
        },

        updateIcebox
      );
    }
    else {
      updatingStory($scope, function($scope) {
        recalculateSelectedIterationPoints($scope);
      });
    }
  }

  function createStory($scope, success, updateIcebox) {
    $scope.addingNewStory = false;
    self.createNewStory($scope.selectedStory, IceBox, {}, updateIcebox).then(
      function(result) {
        success(result);
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  }

  function updatingStory($scope, success) {
    self.updateStory($scope.selectedStory).then(
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

  function deleteStoryAndClosePopup($scope) {
    deletingStory($scope, function($scope) {
      recalculateSelectedIterationPoints($scope);
      closingPopup($scope)
    });
  }

  function deletingStory($scope, success) {
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

  function prepateStoryToSave(story) {
    Notifier.warning('Saving story...');
    var storyToSend = _.cloneDeep(story);
    story.updating = true;
    delete storyToSend.isOpen;
    delete storyToSend.isLoaded;
    delete storyToSend.currentTab;
    delete storyToSend.newTaskVisible;
    delete storyToSend.newDefinitionVisible;
    delete storyToSend.newCommentVisible;
    delete storyToSend.newCommentType;
    delete storyToSend.newCommentFileTypeAccept;
    delete storyToSend.newMergeRequestVisible;
    return storyToSend;
  }

  this.createNewStory = function(newStory, resource, urlData, updateIcebox) {
    var result = $q.defer();
    var toSend = prepateStoryToSave(newStory);
    resource.save(
      urlData,
      toSend,
      function(response) {
        delete newStory.updating;
        if (!updateIcebox) {
          Notifier.success('Story created!');
          result.resolve(response);
          return;
        }
        self.getIceboxStories().then(
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
        delete newStory.updating;
        result.reject(error);
      }
    );
    return result.promise;
  };

  this.updateStory = function(story, resource, urlData) {
    if (!resource) {
      resource = IceBox;
    }
    if (!urlData) {
      urlData = {storyId: story.id};
    }
    var result = $q.defer();
    var toSend = prepateStoryToSave(story);
    resource.update(
      urlData,
      toSend,
      function(response) {
        delete story.updating;
        Notifier.success('Story saved!');
        result.resolve(response);
      },
      function(error) {
        delete story.updating;
        Alert.randomErrorMessage(error);
        result.reject(error);
      }
    );
    return result.promise;
  };

  this.deleteInIceLog = function(story) {
    var result = $q.defer();
    IceBox.delete(
      {storyId: story.id},
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
      {storyId: storyId},
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
    compact.name = complete.name;
    compact.statement = complete.statement;
    compact.type = complete.type;
    compact.typeName = complete.typeName;
    compact.points = complete.points;
    compact.valuePoints = complete.valuePoints;
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

  this.deletingStory = function(story, caller) {
    var result = $q.defer();
    var data = {storyId: story.id, hardDelete: true}
    _.forEach(caller.urlData, function(value, key) {
      data[key] = value;
    })
    var resource = caller.resource;
    if (resource === null) {
      resource = IceBox;
    }
    resource.delete(
      data,

      function() {
        result.resolve();
      },

      function(error) {
        result.reject(error);
      }
    );
    return result.promise;
  }

  this.prepareScopeToEditStory = function($scope) {
    $scope.completeStoryPopupOpened = false;
    $scope.selectedStory = null;
    $scope.selectedIteration = null;
    $scope.addingNewStory = false;
    $scope.selectedStoryIndex = null;
    $scope.newTask = {task: null};
    $scope.newTaskVisible = false;
    $scope.newDefinition = {definition: null, composed: {givens: [{value: null}], whens: [{value: null}], thens: [{value: null}]}};
    $scope.newDefinitionVisible = false;
    $scope.newComment = {comment: null, file: null, fileType: null, link: null, creator: null, createdAt: null};
    $scope.newCommentVisible = false;
    $scope.newCommentType = null;
    $scope.newCommentFileTypeAccept = $rootScope.newAttachmentFileTypeAccepts['I'];
    $scope.theButtonWasCliked = false;
    $scope.scrollCommentOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: false, preventKeyEvents: false};
    $scope.newMergeRequest = {url: null, creator: null, createdAt: null};
    $scope.newMergeRequestVisible = false;
    $scope.scrollMergeRequestOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: false, preventKeyEvents: false};
    $scope.saveAndClose = false;
    $scope.shhImSpeaking = false;

    $scope.addNewStory = function(data, forProject) {
      $scope.addingNewStory = true;
      var newStory = {
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
          newStory.kanban = {id: data.iteration.id, name: data.iteration.name};
        }
        if (data.iterationType === 'sprint') {
          newStory.sprint = {id: data.iteration.id, name: data.iteration.name};
        }
        if (data.project) {
          newStory.project = {id: data.project.id, name: data.project.name};
        }
        if (data.module) {
          newStory.module = data.module;
        }
        if (data.epic) {
          newStory.epic = data.epic;
        }
        if (data.type) {
          newStory.type = data.type;
        }
      }
      if (forProject) {
        newStory.isOpen = true;
        newStory.isLoaded = true;
        newStory.currentTab = 0;
        newStory.newTaskVisible = false;
        newStory.newDefinitionVisible = false;
        $scope.clearNewComment(newStory);
        newStory.newMergeRequestVisible = false;
        return newStory;
      }
      $scope.selectedStory = newStory;
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

    $scope.selectingStory = function(story, resource, urlData) {
      if (story.isLoaded) {
        story.isOpen = !story.isOpen;
        return;
      }
      story.loading = true;
      resource.get(
        urlData,

        function(result) {
          story.isOpen = true;
          story.isLoaded = true;
          story.currentTab = story.currentTab ? story.currentTab : 0;
          story.newTaskVisible = false;
          story.newDefinitionVisible = false;
          story.newMergeRequestVisible = false;
          $scope.clearNewComment(story);
          self.turnCompactStoryAsComplete(story, result);
          delete story.loading;
        }
      )
    };

    // TODO: Isso está aqui pq é usado no Icebox. Um dia, isso poderá morrer
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

    $scope.saveSelectedStory = function(form, saveAndClose, updateIcebox) {
      if (form.$invalid) {
        Alert.randomErrorMessage('Invalid fields.', 'Invalid fields.');
        return false;
      }

      Alert.loading();

      if (saveAndClose) {
        saveStoryAndClosePopup($scope, updateIcebox);
      }
      else {
        saveStoryAndKeepPopupOpen($scope, updateIcebox);
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

    $scope.addGivenToNewDoD = function() {
      $scope.newDefinition.composed.givens.push({value: null});
    };

    $scope.addWhenToNewDoD = function() {
      $scope.newDefinition.composed.whens.push({value: null});
    };

    $scope.addThenToNewDoD = function() {
      $scope.newDefinition.composed.thens.push({value: null});
    };

    $scope.cancelAddDefinitionToStory = function($event, story) {
      if (story) {
        story.newDefinitionVisible = false;
      }
      $scope.newDefinitionVisible = false;
      $scope.newDefinition = {definition: null, composed: {givens: [{value: null}], whens: [{value: null}], thens: [{value: null}]}};
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

    $scope.addDefinitionToStory = function($event, story, fromPopup) {
      if (fromPopup) {
        var givens = [];
        var whens = [];
        var thens = [];
        _.forEach($scope.newDefinition.composed.givens, function(given, index) {
          if (given.value === null) {
            return;
          }
          var start = 'Dado que';
          if (index > 0) {
            start = ', e dado que'
          }
          givens.push('{0} {1}'.format([start, given.value]));
        });
        givens = givens.join('');

        _.forEach($scope.newDefinition.composed.whens, function(when, index) {
          if (when.value === null) {
            return;
          }
          var start = 'quando';
          if (index > 0) {
            start = ', e quando'
          }
          whens.push('{0} {1}'.format([start, when.value]));
        });
        whens = whens.join('');

        _.forEach($scope.newDefinition.composed.thens, function(then, index) {
          if (then.value === null) {
            return;
          }
          var start = 'então';
          if (index > 0) {
            start = ', e então'
          }
          thens.push('{0} {1}'.format([start, then.value]));
        });
        thens = thens.join('');

        $scope.newDefinition.definition = '{0}; {1}; {2}.'.format([givens, whens, thens]);
      }
      if ($scope.newDefinition.definition === null) {
        return false;
      }
      story.definitionOfDone.push({definition: $scope.newDefinition.definition, done: false});
      story.newDefinitionVisible = false;
      $scope.newDefinitionVisible = false;
      $scope.newDefinition = {definition: null, composed: {givens: [{value: null}], whens: [{value: null}], thens: [{value: null}]}};
      $event.stopPropagation();
    };

    $scope.talkToMe = function($event, definition, currentButton) {
      $event.stopPropagation();
      if ($scope.shhImSpeaking) {
        window.speechSynthesis.cancel();
        return;
      }
      var msg = new SpeechSynthesisUtterance(definition);
      msg.lang = "pt-BR";
      $scope.shhImSpeaking = true;
      msg.addEventListener('end', function() {
        $scope.shhImSpeaking = false;
        $scope.$apply();
      });
      window.speechSynthesis.speak(msg);
    }

    $scope.removeStoryDefinition = function(story, $index) {
      story.definitionOfDone.splice($index, 1);
    };

    $scope.clearNewComment = function(component) {
      component.newCommentVisible = false;
      component.newCommentType = null;
      component.newCommentFileTypeAccept = $rootScope.newAttachmentFileTypeAccepts['I'];
      $scope.newComment = {comment: null, file: null, fileType: 'I', link: null, creator: null, createdAt: null};
    };

    $scope.setNewComment = function(component, type, fileType) {
      component.newCommentVisible = true;
      component.newCommentType = type;
      component.newCommentFileTypeAccept = $rootScope.newAttachmentFileTypeAccepts[fileType];
      $scope.newComment.fileType = fileType;
    };

    $scope.addingCommentToStory = function(type, story, fileType) {
      if (story) {
        $scope.setNewComment(story, type, fileType);
      }
      $scope.setNewComment($scope, type, fileType);
      $scope.theButtonWasCliked = false;
    };

    $scope.cancelAddCommentToStory = function($event, story) {
      if (story) {
        $scope.clearNewComment(story)
      }
      $scope.theButtonWasCliked = true;
      $scope.clearNewComment($scope);
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
        Notifier.warning('You want to {0}, you need to {0} something!'.format([$scope.newCommentType]));
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
        fileType: $scope.newComment.fileType,
        link: $scope.newComment.link,
        creatorId: $rootScope.loggedUser.id,
        creator: {name: $rootScope.loggedUser.name},
        createdAt: moment().format('YYYY-MM-DD HH:mm'),
        isDirty: true
      });
      $scope.clearNewComment(story);
      $scope.clearNewComment($scope);
      $event.stopPropagation();
    };

    $scope.removeStoryComment = function(story, $index) {
      story.comments.splice($index, 1);
    };

    $scope.addingMergeRequestToStory = function(story) {
      if (story) {
        story.newMergeRequestVisible = true;
      }
      $scope.newMergeRequestVisible = true;
    };

    $scope.cancelAddMergeRequestToStory = function($event, story) {
      if (story) {
        story.newMergeRequestVisible = false;
      }
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
    };

    $scope.saveSelectedStoryTasks = function(story, resource, urlData) {
      Notifier.warning('Saving tasks...');
      story.updating = true;
      resource.update(
        urlData,
        {tasks: story.tasks},
        function() {
          delete story.updating;
          Notifier.success('Tasks saved!')
        },
        function(error) {
          Alert.randomErrorMessage(error);
          delete story.updating;
        }
      );
    };

    $scope.saveSelectedStoryDefinitionOfDone = function(story, resource, urlData) {
      Notifier.warning('Saving DoDs...');
      story.updating = true;
      resource.update(
        urlData,
        {definitionOfDone: story.definitionOfDone},
        function() {
          delete story.updating;
          Notifier.success('DoDs saved!')
        },
        function(error) {
          Alert.randomErrorMessage(error);
          delete story.updating;
        }
      );
    };

    $scope.saveSelectedStoryComments = function(story, resource, urlData, uploadUrl) {
      Notifier.warning('Saving comments...');
      story.updating = true;
      var commentsWithFiles = _.filter(story.comments, function(comment) {
        return comment.file !== null && comment.file.name !== undefined;
      });
      var commentsWithoutFiles = _.filter(story.comments, function(comment) {
        return comment.file === null || comment.file.name === undefined;
      });
      resource.update(
        urlData,
        {'comments': commentsWithoutFiles},
        function() {
          if (commentsWithFiles.length > 0) {
            Notifier.warning('Comments saved! Uploading attachments...');
            Upload.upload({
              url: uploadUrl,
              method: 'PUT',
              data: {comments: commentsWithFiles}
            }).then(
              function(response) {
                delete story.updating;
                story.comments = response.data.comments;
                $timeout(function () {
                  Notifier.success('Attachments saved!');
                });
              },
              function(error) {
                delete story.updating;
                Alert.randomErrorMessage(error);
              }
            );
            return;
          }
          delete story.updating;
          Notifier.success('Comments saved!');
        },
        function(error) {
          Alert.randomErrorMessage(error);
          delete story.updating;
        }
      );
    };

    $scope.saveSelectedStoryMergeRequests = function(story, resource, urlData) {
      Notifier.warning('Saving merge requests...');
      story.updating = true;
      resource.update(
        urlData,
        {mergeRequests: story.mergeRequests},
        function() {
          delete story.updating;
          Notifier.success('Done!')
        },
        function(error) {
          Alert.randomErrorMessage(error);
          delete story.updating;
        }
      );
    };

    $scope.deleteStory = function(story) {
      Alert.warning(
        'Watch Out!', 'Are you cleary wanting to start deleting this story?',

        function(result) {
          if (!result.value) {
            return;
          }

          var notififyContainer = Notifier.warning('Deleting Story. Plz, wait a second... or several...', '', 'TOO-DAMN-HIGH');
          story.updating = true
          self.deletingStory(story, $scope.storyResource).then(
            function() {
              Notifier.close(notififyContainer);
              $scope.$emit('projects.storyDeleted', story);
              Notifier.success('Its done! I hope you dont miss it.')
            },

            function(error) {
              Notifier.close(notififyContainer);
              Alert.randomErrorMessage(error);
            }
          );
        }
      );
    }
  }
}]);