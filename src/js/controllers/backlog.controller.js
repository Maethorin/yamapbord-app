'use strict';

scrumInCeresControllers.controller('BacklogController', ['$rootScope', '$scope', '$timeout', 'Alert', 'MeService', 'StoryService', 'Notifier', 'Backlog', function($rootScope, $scope, $timeout, Alert, MeService, StoryService, Notifier, Backlog) {
  $rootScope.currentController = 'BacklogController';
  $scope.sprints = [];

  $scope.scrollOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: true};

  $scope.completeSprintPopupOpened = false;
  $scope.selectedSprint = null;
  $scope.selectedSprintOriginalStories = [];
  $scope.selectedSprintIndex = null;
  $scope.addingNewSprint = false;

  $scope.completeStoryPopupOpened = false;
  $scope.formStoryPopupOpened = false;
  $scope.selectedStory = null;
  $scope.selectedStoryIndex = null;

  $scope.storiesPopupOpened = false;
  $scope.stories = [];
  $scope.teams = [];
  $scope.newStoryVisible = false;
  $scope.searchStories = '';

  $scope.newTask = {task: null};
  $scope.newTaskVisible = false;
  $scope.newDefinition = {definition: null};
  $scope.newDefinitionVisible = false;
  $scope.newComment = {comment: null, creator: null, createdAt: null};
  $scope.newCommentVisible = false;
  $scope.scrollCommentOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: false, preventKeyEvents: false};

  $scope.changeScroll = function() {
    $scope.$broadcast('content.changed');
  };

  MeService.getInfo().then(
    function(info) {
      $scope.teams = info.teams;
    }
  );

  function getSprints() {
    Alert.loading();
    Backlog.query(
      function(response) {
        $scope.sprints = response;
        _.forEach($scope.sprints, function(sprint) {
          setWorkingDays(sprint);
        });
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  }

  getSprints();

  function setWorkingDays(sprint) {
    var startDate = moment(sprint.startDate).startOf('day');
    var endDate = moment(sprint.endDate).startOf('day');
    sprint.workingDays = 1;
    while(startDate.add(1, 'days').diff(endDate) < 0) {
      if (startDate.weekday() !== 6 && startDate.weekday() !== 7) {
        sprint.workingDays += 1;
      }
    }
  }

  function recalculateSelectedSprintPoints() {
    var points = 0;
    _.forEach($scope.selectedSprint.stories, function(story) {
      points += (story.points !== null ? story.points : 0);
    });
    $scope.selectedSprint.points = points;
  }

  function startDateOnSetTime() {
    $scope.$broadcast('start-date-changed');
    setWorkingDays($scope.selectedSprint);
  }

  function endDateOnSetTime() {
    $scope.$broadcast('end-date-changed');
    setWorkingDays($scope.selectedSprint);
  }

  function startDateBeforeRender($dates) {
    if ($scope.selectedSprint.endDate) {
      var activeDate = moment($scope.selectedSprint.endDate);

      $dates.filter(
        function(date) {
          return date.localDateValue() >= activeDate.valueOf()
        }
      )
        .forEach(
          function(date) {
            date.selectable = false;
          }
        );
    }
  }

  function endDateBeforeRender($view, $dates) {
    if ($scope.selectedSprint.startDate) {
      var activeDate = moment($scope.selectedSprint.startDate).subtract(1, $view).add(1, 'minute');

      $dates.filter(
        function(date) {
          return date.localDateValue() <= activeDate.valueOf()
        }
      ).forEach(
        function (date) {
          date.selectable = false;
        }
      );
    }
  }

  $rootScope.$on('sprint.add', function() {
    $scope.addingNewSprint = true;
    $scope.selectedSprint = {
      name: null,
      objective: null,
      startDate: null,
      endDate: null,
      points: null,
      status: 'PLAN',
      team: $rootScope.loggedUser.teams === null ? $rootScope.loggedUser.team : null,
      stories: []
    };
    $scope.completeSprintPopupOpened = true;
  });

  $rootScope.$on('backlog.sprint.created', function(event, data) {
    Notifier.warning('Sprint created');
    Backlog.get(
      {id: data.sprintId},
      function(response) {
        $scope.sprints.push(response);
      },
      function() {
        Notifier.danger('Changes has been made and could not be updated', 'Hey!');
      }
    );
  });

  $rootScope.$on('backlog.sprint.updated', function(event, data) {
    Notifier.warning('Sprint updated');
    Backlog.get(
      {id: data.sprintId},
      function(response) {
        var index = _.findIndex($scope.sprints, ['id', data.sprintId]);
        $scope.sprints[index] = response;
      },
      function() {
        Notifier.danger('Changes has been made and could not be updated', 'Hey!');
      }
    );
  });

  $rootScope.$on('backlog.sprint.deleted', function(event, data) {
    Notifier.warning('Sprint deleted');
    var index = _.findIndex($scope.sprints, ['id', data.sprintId]);
    $scope.sprints.splice(index, 1);
  });

  $rootScope.$watch('itemsView.mode', function(newValue) {
    _.forEach($scope.sprints, function(sprint) {
      sprint.opened = newValue !== 'list';
    });
  });

  $scope.setSelectedSprintTeam = function(team) {
    $scope.selectedSprint.team = team;
  };

  $scope.toggleCompleteStoryPopup = function(story) {
    if (story === null) {
      $scope.selectedStory = story;
      $scope.completeStoryPopupOpened = !$scope.completeStoryPopupOpened;
      return false;
    }
    Alert.loading();
    StoryService.getFullStory(story.id).then(
      function(response) {
        $scope.selectedStory = story;
        $scope.selectedStory.tasks = response.tasks;
        $scope.selectedStory.definitionOfDone = response.definitionOfDone;
        $scope.completeStoryPopupOpened = !$scope.completeStoryPopupOpened;
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.selectSprintToEdit = function($event, sprint, $index) {
    $scope.selectedSprint = _.cloneDeep(sprint);
    $scope.selectedSprintOriginalStories = sprint.stories;
    $scope.selectedSprintIndex = $index;
    $scope.completeSprintPopupOpened = true;
    $event.stopPropagation();
  };

  $scope.saveSelectedSprint = function(form) {
    if (form.$invalid) {
      Alert.randomErrorMessage('Invalid Fields', 'Invalid Fields');
      return false;
    }

    if ($scope.selectedSprint.team === null) {
      Alert.randomErrorMessage('Invalid Fields', 'The Team Dude...');
      return false;
    }

    Alert.loading();
    if ($scope.addingNewSprint) {
      Backlog.save(
        $scope.selectedSprint,
        function() {
          getSprints();
          $scope.selectedSprint = null;
          $scope.completeSprintPopupOpened = false;
          Alert.randomSuccessMessage();
        },
        function(error) {
          Alert.randomErrorMessage(error);
        }
      );
      return;
    }
    Backlog.update(
      {id: $scope.selectedSprint.id},
      $scope.selectedSprint,
      function() {
        $scope.selectedSprint.startDate = moment($scope.selectedSprint.startDate).format('YYYY-MM-DD');
        $scope.selectedSprint.endDate = moment($scope.selectedSprint.endDate).format('YYYY-MM-DD');
        $scope.sprints[$scope.selectedSprintIndex] = $scope.selectedSprint;
        $scope.selectedSprintIndex = null;
        $scope.selectedSprint = null;
        $scope.completeSprintPopupOpened = false;
        Alert.randomSuccessMessage();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.cancelSaveSelectedSprint = function() {
    $scope.selectedSprint = null;
    $scope.selectedSprintIndex = null;
    $scope.completeSprintPopupOpened = false;
  };

  $scope.endDateBeforeRender = endDateBeforeRender;

  $scope.endDateOnSetTime = endDateOnSetTime;

  $scope.startDateBeforeRender = startDateBeforeRender;

  $scope.startDateOnSetTime = startDateOnSetTime;

  $scope.addingStoryToSelectedSprint = function() {
    Alert.loading();
    StoryService.getReadyUse().then(
      function(stories) {
        $scope.stories = stories;
        _.forEach($scope.stories, function(story) {
          if (_.findIndex($scope.selectedSprint.stories, ['id', story.id]) > -1) {
            story.selected = true;
          }
        });
        $scope.storiesPopupOpened = true;
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.saveAddSelectedSprintStories = function() {
    $scope.selectedSprint.stories = _.clone($scope.selectedSprintOriginalStories);
    if ($scope.selectedSprint.stories === null || $scope.selectedSprint.stories === undefined) {
      $scope.selectedSprint.stories = [];
    }
    _.forEach($scope.stories, function(story) {
      if (story.selected) {
        if (_.findIndex($scope.selectedSprint.stories, ['id', story.id]) === -1) {
          $scope.selectedSprint.stories.push(story);
        }
      }
    });
    recalculateSelectedSprintPoints();
    $scope.stories = [];
    $scope.storiesPopupOpened = false;
  };

  $scope.cancelAddSelectedSprintStories = function() {
    $scope.stories = [];
    $scope.storiesPopupOpened = false;
  };

  $scope.removeSprintStory = function(story, $index, event) {
    event.stopPropagation();
    if (story.sprintId) {
      Alert.warning('Watch Out!', 'This story is already associated with this sprint. Are you sure you want to desassociate it?', function() {
        Alert.loading();
        StoryService.updateInIceLog({id: story.id, removeSprint: true}).then(
          function() {
            $scope.selectedSprint.stories.splice($index, 1);
            recalculateSelectedSprintPoints();
            Alert.randomSuccessMessage();
          },
          function(error) {
            Alert.randomErrorMessage(error);
          }
        );
      });
    }
    else {
      $scope.selectedSprint.stories.splice($index, 1);
      recalculateSelectedSprintPoints();
    }
  };

  $scope.toggleOpenSprintPanel = function($event, sprint) {
    $event.stopPropagation();
    sprint.opened = !sprint.opened;
  };

  // TODO: isso deve ser movido para um service ou factory, pois é usado em dois controllers. Observar que o código aqui só faz update. O código que deve ser usado como base é o do IceBoxController.
  $scope.toggleFormStoryPopupOpened = function(story, index) {
    Alert.loading();
    $scope.selectedStoryIndex = index;
    StoryService.getFullStory(story.id).then(
      function(response) {
        $scope.selectedStory = response;
        $scope.formStoryPopupOpened = !$scope.formStoryPopupOpened;
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.setStoryModule = function(story, module) {
    story.module = module;
  };

  $scope.setStoryEpic = function(story, epic) {
    story.epic = epic;
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

  $scope.saveSelectedStory = function(form) {
    if (form.$invalid) {
      Alert.randomErrorMessage('Invalid fields.', 'Invalid fields.');
      return false;
    }

    Alert.loading();
    StoryService.updateInIceLog($scope.selectedStory).then(
      function() {
        $scope.selectedSprint.stories[$scope.selectedStoryIndex] = $scope.selectedStory;
        $scope.cancelSaveSelectedStory();
        Alert.randomSuccessMessage();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.cancelSaveSelectedStory = function() {
    $scope.selectedStoryIndex = null;
    $scope.selectedStory = null;
    $scope.formStoryPopupOpened = false;
  };

}]);
