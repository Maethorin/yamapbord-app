'use strict';

scrumInCeresControllers.controller('BacklogController', ['$rootScope', '$scope', '$timeout', '$filter', 'Alert', 'MeService', 'StoryService', 'HollydayService', 'Notifier', 'BacklogSprint', 'BacklogKanban', function($rootScope, $scope, $timeout, $filter, Alert, MeService, StoryService, HollydayService, Notifier, BacklogSprint, BacklogKanban) {
  $rootScope.currentController = 'BacklogController';
  $rootScope.itemsView.mode = 'table';
  $scope.sprints = [];
  $scope.kanbans = [];

  $scope.iterationStatuses = [
    {code: 'PLAN', name: 'Planned'},
    {code: 'SUCC', name: 'Success'},
    {code: 'FAIL', name: 'Fail'},
    {code: 'CURR', name: 'Current'}
  ];

  $scope.scrollOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: true};

  $scope.completeSprintPopupOpened = false;
  $scope.selectedSprint = null;
  $scope.selectedSprintOriginalStories = [];
  $scope.selectedSprintIndex = null;
  $scope.addingNew = false;
  $scope.storiesPopupOpened = false;
  $scope.stories = [];
  $scope.teams = [];
  $scope.showStoryPopupOpened = false;
  $scope.storiesExpanded = false;

  $scope.showinStory = null;
  $scope.selectedStoryIndex = null;

  $scope.porraAngular = function() {
    $scope.storiesExpanded = !$scope.storiesExpanded;
  };

  $scope.changeScroll = function() {
    $scope.$broadcast('content.changed');
  };

  $scope.storiesSortableListeners = {
    orderChanged: function(event) {
      _.forEach($scope.selectedSprint.stories, function(story, index) {
        story.executionOrder = index + 1;
      });
    }
  };

  $scope.clearStoryFilter = function() {
    $scope.searchStories = {
      type: '',
      epicId: '',
      moduleId: '',
      name: '',
      statement: ''
    };
  };

  $scope.clearStoryFilter();

  $scope.storyFilterComparator = function(actual, expected) {
    if (!expected) {
      return true;
    }
    var key = null;
    if (typeof expected === "string" && expected.indexOf("|") > -1) {
      expected = expected.split("|");
      key = expected[0];
      expected = parseInt(expected[1]);
    }
    if (key === "epicId" && $scope.searchStories.epicId && $scope.searchStories.epicId !== '') {
      return actual === expected;
    }
    if (key === "moduleId" && $scope.searchStories.moduleId && $scope.searchStories.moduleId !== '') {
      return actual === expected;
    }
    if (key === "points" && $scope.searchStories.points !== undefined && $scope.searchStories.points !== '') {
      if (expected === -1) {
        return actual === null;
      }
      return actual === expected;
    }
    if (key === "valuePoints" && $scope.searchStories.valuePoints !== undefined && $scope.searchStories.valuePoints !== '') {
      if (expected === -1) {
        return actual === null;
      }
      return actual === expected;
    }
    if (typeof expected === "string" && typeof actual === "string") {
      return actual.toLowerCase().indexOf(expected.toLowerCase()) >-1
    }
    return angular.equals(actual, expected);
  };

  MeService.getInfo().then(
    function(info) {
      $scope.teams = info.teams;
      if ($scope.teams == null || $scope.teams.length === 0) {
        $scope.teams = [info.team];
      }
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
      team: $rootScope.loggedUser.team,
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
      teams: [$rootScope.loggedUser.team],
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

  $scope.selectSprintToEdit = function($event, sprint, $index, type) {
    $scope.selectedSprint = _.cloneDeep(sprint);
    $scope.selectedSprint.type = type;
    $scope.selectedSprintOriginalStories = sprint.stories;
    $scope.selectedSprintIndex = $index;
    $scope.completeSprintPopupOpened = true;
    $event.stopPropagation();
  };

  $scope.teamIsInSelectedSprint = function(team) {
    return _.findIndex($scope.selectedSprint.teams, ['id', team.id]) > -1;
  };

  $scope.toggleSelectedSprintTeamSelected = function(team) {
    var sprintTeamIndex = _.findIndex($scope.selectedSprint.teams, ['id', team.id]);
    if (sprintTeamIndex > -1) {
      $scope.selectedSprint.teams.splice(sprintTeamIndex, 1);
    }
    else {
      $scope.selectedSprint.teams.push(team);
    }
    console.log($scope.selectedSprint.teams)
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
          $scope.clearStoryFilter();
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
      function(response) {
        $scope.selectedSprint.startDate = moment($scope.selectedSprint.startDate).format('YYYY-MM-DD');
        $scope.selectedSprint.endDate = moment($scope.selectedSprint.endDate).format('YYYY-MM-DD');
        $scope.sprints[$scope.selectedSprintIndex] = response;
        $scope.selectedSprintIndex = null;
        $scope.selectedSprint = null;
        $scope.completeSprintPopupOpened = false;
        $scope.clearStoryFilter();
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
          $scope.clearStoryFilter();
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
        $scope.clearStoryFilter();
        Alert.randomSuccessMessage();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  }

  $scope.saveSelectedSprint = function(form) {
    if (form.team && form.team.$invalid) {
      Alert.randomErrorMessage('Field team is required', 'The Team, Duuude...');
      return false;
    }

    if (form.name && form.name.$invalid) {
      Alert.randomErrorMessage('Field name is required', 'The Name, Duuude...');
      return false;
    }

    if (form.objective && form.objective.$invalid) {
      Alert.randomErrorMessage('Field objective is required', 'The Objective, Duuude...');
      return false;
    }

    if (form.startDate && form.startDate.$invalid) {
      Alert.randomErrorMessage('Field start date is required', 'The Start Date, Duuude...');
      return false;
    }

    if (form.endDate && form.endDate.$invalid) {
      Alert.randomErrorMessage('Field end date is required', 'The End Date, Duuude...');
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

  $scope.saveSprintStatus = function() {
    saveSelectedSprint();
  };

  $scope.cancelSaveSelectedSprint = function() {
    $scope.selectedSprint = null;
    $scope.selectedSprintIndex = null;
    $scope.completeSprintPopupOpened = false;
    $scope.clearStoryFilter();
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

  $scope.addNewStoryToSelectedSprint = function(iterationType, type) {
    $rootScope.$broadcast('story.add', {iterationType: iterationType, iteration: $scope.selectedSprint, type: type});
  };

  $scope.toggleFilterBarExpanded = function () {
    $scope.filterBarExpanded = !$scope.filterBarExpanded;
  };

  $scope.filterIteration = {
    team: {id: ''},
    status: ''
  };

  $scope.filterSprint = {
    team: {id: ''},
    status: ''
  };

  $scope.filterKanban = {};

  $scope.selectIterationFilter = function(property, value) {
    $scope.filterIteration[property] = value;
    $scope.filterSprint[property] = value;
    if (property === 'team') {
      $scope.filterKanban[property] = value;
    }
  };

  $scope.storyStatus = ["plan", "star", "fini", "itst", "rtdp", "dpyd", "accp", "reje"];

  $scope.filterKanbanStories = {
    status: _.clone($scope.storyStatus)
  };

  $scope.toggleFilterStoryStatus = function(status) {
    if (status === 'all') {
      if ($scope.filterKanbanStories.status.length === $scope.storyStatus.length) {
        $scope.filterKanbanStories.status = [];
      }
      else {
        $scope.filterKanbanStories.status = _.clone($scope.storyStatus);
      }
      return;
    }
    var statusIndex = $scope.filterKanbanStories.status.indexOf(status);
    if (statusIndex > -1) {
      $scope.filterKanbanStories.status.splice(statusIndex, 1);
    }
    else {
      $scope.filterKanbanStories.status.push(status);
    }
  };

  $scope.filterKanbanStory = function(story) {
    return $scope.filterKanbanStories.status.indexOf(story.status.toLowerCase()) > -1;
  };
}]);
