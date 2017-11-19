'use strict';

scrumInCeresControllers.controller('BacklogController', ['$rootScope', '$scope', '$timeout', 'Alert', 'MeService', 'StoryService', 'HollydayService', 'Notifier', 'BacklogSprint', 'BacklogKanban', function($rootScope, $scope, $timeout, Alert, MeService, StoryService, HollydayService, Notifier, BacklogSprint, BacklogKanban) {
  $rootScope.currentController = 'BacklogController';
  $rootScope.itemsView.mode = 'table';
  $scope.sprints = [];
  $scope.kanbans = [];

  $scope.scrollOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: true};

  $scope.completeSprintPopupOpened = false;
  $scope.selectedSprint = null;
  $scope.selectedSprintOriginalStories = [];
  $scope.selectedSprintIndex = null;
  $scope.addingNew = false;
  $scope.storiesPopupOpened = false;
  $scope.stories = [];
  $scope.teams = [];
  $scope.searchStories = '';
  $scope.showStoryPopupOpened = false;

  $scope.showinStory = null;
  $scope.selectedStoryIndex = null;

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
    BacklogSprint.query(
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

  function getKanbans() {
    Alert.loading();
    BacklogKanban.query(
      function(response) {
        $scope.kanbans = response;
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  }

  getSprints();
  getKanbans();

  function setWorkingDays(sprint) {
    HollydayService.getHollydays().then(
      function() {
        var startDate = moment(sprint.startDate).startOf('day');
        var endDate = moment(sprint.endDate).startOf('day');
        sprint.workingDays = 1;
        while (startDate.add(1, 'days').diff(endDate) < 0) {
          if (startDate.weekday() !== 6 && startDate.weekday() !== 7 && !HollydayService.dateIsHollyday(startDate)) {
            sprint.workingDays += 1;
          }
        }
      }
    );
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
    $scope.addingNew = true;
    $scope.selectedSprint = {
      name: null,
      objective: null,
      startDate: null,
      endDate: null,
      points: null,
      status: 'PLAN',
      isPlanned: true,
      type: 'sprint',
      team: $rootScope.loggedUser.teams === null ? $rootScope.loggedUser.team : null,
      stories: []
    };
    $scope.completeSprintPopupOpened = true;
  });

  $rootScope.$on('kanban.add', function() {
    $scope.addingNew = true;
    $scope.selectedSprint = {
      name: null,
      points: null,
      isPlanned: true,
      type: 'kanban',
      team: $rootScope.loggedUser.teams === null ? $rootScope.loggedUser.team : null,
      stories: []
    };
    $scope.completeSprintPopupOpened = true;
  });

  $rootScope.$on('backlog.sprint.created', function(event, data) {
    Notifier.warning('Sprint created');
    BacklogSprint.get(
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
    BacklogSprint.get(
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

  $rootScope.$on('backlog.kanban.created', function(event, data) {
    Notifier.warning('Kanban created');
    BacklogKanban.get(
      {id: data.kanbanId},
      function(response) {
        $scope.kanbans.push(response);
      },
      function() {
        Notifier.danger('Changes has been made and could not be updated', 'Hey!');
      }
    );
  });

  $rootScope.$on('backlog.kanban.updated', function(event, data) {
    Notifier.warning('Kanban updated');
    BacklogKanban.get(
      {id: data.kanbanId},
      function(response) {
        var index = _.findIndex($scope.kanbans, ['id', data.kanbanId]);
        $scope.kanbans[index] = response;
      },
      function() {
        Notifier.danger('Changes has been made and could not be updated', 'Hey!');
      }
    );
  });

  $rootScope.$on('backlog.kanban.deleted', function(event, data) {
    Notifier.warning('Kanban deleted');
    var index = _.findIndex($scope.kanbans, ['id', data.kanbanId]);
    $scope.kanbans.splice(index, 1);
  });

  $rootScope.$watch('itemsView.mode', function(newValue) {
    $scope.showAsTable = newValue === 'table';
    if (!$scope.showAsTable) {
      _.forEach($scope.sprints, function(sprint) {
        sprint.opened = newValue !== 'list';
      });
      _.forEach($scope.kanbans, function(kanban) {
        kanban.opened = newValue !== 'list';
      });
    }
  });

  $scope.quantityOf = function(stories, status) {
    return _.filter(stories, ['status', status]).length;
  };

  $scope.setSelectedSprintTeam = function(team) {
    $scope.selectedSprint.team = team;
  };

  $scope.toggleShowStoryPopup = function(story) {
    if (story === null) {
      $scope.showinStory = story;
      $scope.showStoryPopupOpened = !$scope.showStoryPopupOpened;
      return false;
    }
    Alert.loading();
    StoryService.getFullStory(story.id).then(
      function(response) {
        $scope.showinStory = story;
        StoryService.turnCompactStoryAsComplete($scope.showinStory, response);
        $scope.showStoryPopupOpened = !$scope.showStoryPopupOpened;
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.selectSprintToEdit = function($event, sprint, $index, type) {
    $scope.selectedSprint = _.cloneDeep(sprint);
    $scope.selectedSprint.type = type;
    $scope.selectedSprintOriginalStories = sprint.stories;
    $scope.selectedSprintIndex = $index;
    $scope.completeSprintPopupOpened = true;
    $event.stopPropagation();
  };

  function saveSelectedSprint() {
    if ($scope.addingNew) {
      BacklogSprint.save(
        $scope.selectedSprint,
        function() {
          getSprints();
          $scope.selectedSprint = null;
          $scope.completeSprintPopupOpened = false;
          $scope.addingNew = false;
          Alert.randomSuccessMessage();
        },
        function(error) {
          Alert.randomErrorMessage(error);
        }
      );
      return;
    }
    BacklogSprint.update(
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
  }

  function saveSelectedKanban() {
    if ($scope.addingNew) {
      BacklogKanban.save(
        $scope.selectedSprint,
        function() {
          getKanbans();
          $scope.selectedSprint = null;
          $scope.completeSprintPopupOpened = false;
          $scope.addingNew = false;
          Alert.randomSuccessMessage();
        },
        function(error) {
          Alert.randomErrorMessage(error);
        }
      );
      return;
    }
    BacklogKanban.update(
      {id: $scope.selectedSprint.id},
      $scope.selectedSprint,
      function() {
        $scope.kanbans[$scope.selectedSprintIndex] = $scope.selectedSprint;
        $scope.selectedSprintIndex = null;
        $scope.selectedSprint = null;
        $scope.completeSprintPopupOpened = false;
        Alert.randomSuccessMessage();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  }

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
    if ($scope.selectedSprint.type === 'sprint') {
      saveSelectedSprint();
    }
    else {
      saveSelectedKanban();
    }
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

  StoryService.prepareScopeToEditStory($scope);

  $scope.addNewStoryToSelectedSprint = function(iterationType) {
    $rootScope.$broadcast('story.add', {iterationType: iterationType, iteration: $scope.selectedSprint});
  };

  $scope.toggleFilterBarExpanded = function () {
    $scope.filterBarExpanded = !$scope.filterBarExpanded;
  };
}]);
