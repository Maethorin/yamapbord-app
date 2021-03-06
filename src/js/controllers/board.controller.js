'use strict';

scrumInCeresControllers.controller('BoardController', ['$rootScope', '$scope', '$timeout', '$filter', '$state', '$stateParams', 'Upload', 'appConfig', 'MeService', 'StoryService', 'Alert', 'Notifier', 'BoardService', 'BoardStory', 'HollydayService', function($rootScope, $scope, $timeout, $filter, $state, $stateParams, Upload, appConfig, MeService, StoryService, Alert, Notifier, BoardService, BoardStory, HollydayService) {
  $rootScope.currentController = 'BoardController';
  $scope.boards = [];
  $scope.fullBoards = [];
  $scope.hollydays = [];
  $scope.timeline = null;
  $scope.scrollOptions = {scrollX: 'bottom', scrollY: 'none', useBothWheelAxes: true, scrollPosX: 0, preventWheelEvents: true};
  $scope.currentTimelineSprintLeftPosition = null;
  $scope.currentSprint = null;
  $scope.columnTemplate = '/templates/include/board-column.html';
  $scope.selectedSprint = null;
  $scope.selectedStory = null;
  $scope.selectedStoryCurrentTab = 0;
  $scope.visualizeStoryPopupOpened = false;
  $scope.today = moment();
  $scope.newTask = {task: null};
  $scope.newTaskVisible = false;
  $scope.boardControlPanelOpen = false;
  $scope.columnExpanded = false;
  $scope.updateIcebox = false;
  $scope.boardNeedRefresh = false;
  $scope.storyResource = {resource: null, urlData: {}};
  $scope.storySortableOptions = {
    containerPositioning: 'relative',
    orderChanged: function(event) {
      Notifier.warning('Moving Story');
      $scope.selectedSprint.stories = [];
      _.forEach($scope.stories, function(stories, columnName) {
        _.forEach(stories, function(story) {
          $scope.selectedSprint.stories.push(story);
        })
      });

      BoardService.updateBoard($scope.selectedSprint).then(
        function() {
          Notifier.success('Story Moved!');
        },

        function(error) {
          Notifier.danger('ERROR! Plz, do that Ctrl+R thing. :_(');
        }
      );
    }
  };

  var tabIndex = 0;
  if ($stateParams.hasOwnProperty('tabIndex')) {
    tabIndex = parseInt($stateParams.tabIndex);
  }
  $scope.selectedTab = tabIndex;

  $scope.devColumns = [
    {name: 'PLAN', label: 'Planned', colSpan: 3},
    {name: 'STAR', label: 'Started', colSpan: 3},
    {name: 'FINI', label: 'Finished', colSpan: 2},
    {name: 'RTSB', label: 'Ready to Sandbox', colSpan: 2},
    {name: 'INSB', label: 'In Sandbox', colSpan: 2}
  ];

  $scope.opsColumns = [
    {name: 'RTST', label: 'Ready to Staging', colSpan: 3},
    {name: 'INST', label: 'In Staging', colSpan: 3},
    {name: 'RTDP', label: 'Ready to Deploy', colSpan: 2},
    {name: 'DPYD', label: 'Deployed', colSpan: 2},
    {name: 'ACCP', label: 'Accepted', colSpan: 2},
    {name: 'REJE', label: 'Rejected', colSpan: 2}
  ];

  $scope.storyTypeSequence = ['PLAN', 'STAR', 'FINI', 'RTSB', 'INSB', 'RTST', 'INST', 'RTDP', 'DPYD', 'ACCP', 'REJE'];

  $scope.storyTypeNames = {
    'PLAN': 'Planned',
    'STAR': 'Started',
    'FINI': 'Finished',
    'RTSB': 'Ready to Sandbox',
    'INSB': 'In Sandbox',
    'RTST': 'Ready to Staging',
    'INST': 'In Staging',
    'RTDP': 'Ready to Deploy',
    'DPYD': 'Deployed',
    'ACCP': 'Accepted',
    'REJE': 'Rejected'
  };

  $scope.teams = [];

  $scope.timelineFilter = _.cloneDeep(BoardService.timelineFilter);

  Alert.loading();

  function getBoardsList() {
    BoardService.listBoards($stateParams.boardId).then(
      function(response) {
        $scope.boards = response;
        $scope.fullBoards = response;
        $scope.currentSprint = null;
        $scope.selectedSprint = null;

        _.forEach($scope.boards, function(sprint) {
          if (sprint.statusSlug === 'sprint-current') {
            $scope.currentSprint = sprint;
          }
        });

        $scope.filterTimeline();
        if ($stateParams.boardId) {
          $scope.selectSprint(_.find($scope.fullBoards, {id: parseInt($stateParams.boardId), type: $stateParams.boardType}));
        }
        Alert.close();
      }
    );
  }

  MeService.getInfo().then(
    function(info) {
      $scope.teams = info.teams;
      if ($scope.teams == null || $scope.teams.length === 0) {
        $scope.teams = [info.team];
        $scope.timelineFilter.team = info.team;
      }
      getBoardsList();
    }
  );

  function updateStoryData() {
    HollydayService.getHollydays().then(
      function() {
        $scope.pointsPerStoryTypeStatus = {
          'PLAN': 0,
          'STAR': 0,
          'FINI': 0,
          'RTSB': 0,
          'INSB': 0,
          'RTST': 0,
          'INST': 0,
          'RTDP': 0,
          'DPYD': 0,
          'ACCP': 0,
          'REJE': 0
        };

        $scope.stories = {
          'PLAN': [],
          'STAR': [],
          'FINI': [],
          'RTSB': [],
          'INSB': [],
          'RTST': [],
          'INST': [],
          'RTDP': [],
          'DPYD': [],
          'ACCP': [],
          'REJE': []
        };

        _.forEach($scope.selectedSprint.stories, function(story) {
          $scope.stories[story.status].push(story);
          $scope.pointsPerStoryTypeStatus[story.status] += story.points;
          story.hasTasks = ['PLAN', 'STAR'].indexOf(story.status) > -1;
        });

        var start = moment($scope.selectedSprint.startDate);
        var finish = moment($scope.selectedSprint.endDate);
        var days = parseInt((finish - start) / (1000 * 60 * 60 * 24)) + start.date() - 2;
        $scope.devDays = [];
        for (var dayNumber = start.date(); dayNumber <= days; dayNumber++) {
          start.date(start.date() + 1);
          if (start.day() !== 0 && start.day() !== 6 && !HollydayService.dateIsHollyday(start)) {
            var passed = $scope.today.month() > start.month() || ($scope.today.date() > start.date() && $scope.today.month() === start.month());
            var isToday = $scope.today.month() === start.month() && $scope.today.date() === start.date();
            $scope.devDays.push({
              id: dayNumber,
              day: '{0}/{1}'.format([start.date().paddingLeft(2), (start.month() + 1).paddingLeft(2)]),
              points: 0,
              passed: passed,
              isToday: isToday
            });
          }
        }

        for (var devdayIndex = 0; devdayIndex < $scope.devDays.length; devdayIndex++) {
          $scope.devDays[devdayIndex].points = $scope.selectedSprint.points / $scope.devDays.length;
        }

        var accumulatedPoint = 1;
        $scope.pointsPerColumn = [];
        function addPointsToColumn(columnName) {
          _.forEach(_.range(1, $scope.pointsPerStoryTypeStatus[columnName] + 1), function() {
            $scope.pointsPerColumn.push({column: columnName, point: accumulatedPoint});
            accumulatedPoint += 1;
          });
        }

        addPointsToColumn('ACCP');
        addPointsToColumn('DPYD');
        addPointsToColumn('RTDP');
        addPointsToColumn('INST');
        addPointsToColumn('RTST');
        addPointsToColumn('INSB');
        addPointsToColumn('RTSB');
        addPointsToColumn('FINI');
        addPointsToColumn('STAR');
        addPointsToColumn('PLAN');

        addPointsToColumn('REJE');
      }
    );
  }

  function saveStoryStatus(story) {
    story.updating = true;
    Alert.loading();
    BoardStory.update(
      {boardId: $scope.selectedSprint.id, storyId: story.id},
      {'status': story.status},
      function(response) {
        delete story.updating;
        story.owner = response.owner;
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    );
  }

  function toggleCompleteStoryPopup(story) {
    if (story !== null && story.id !== parseInt($stateParams.storyId)) {
      return false;
    }
    $scope.selectedStory = story;
    $scope.visualizeStoryPopupOpened = !$scope.visualizeStoryPopupOpened;
  }

  $scope.refreshBoard = function() {
    $scope.boardNeedRefresh = false;
    Alert.loading();
    BoardService.loadBoardStories().then(
     function(response) {
        $scope.selectedSprint.stories = response;
        updateStoryData();
        if ($stateParams.storyId) {
          toggleCompleteStoryPopup(_.find($scope.selectedSprint.stories, ['id', parseInt($stateParams.storyId)]));
        }
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  }

  StoryService.prepareScopeToEditStory($scope);

  $rootScope.$on('board.story.moved', function(event, data) {
    if ($scope.selectedSprint === null || $scope.selectedSprint.id !== data.sprintId) {
      return false;
    }
    Notifier.warning('Story moved');
    var story = _.find($scope.selectedSprint.stories, ['id', data.storyId]);
    story.status = data.toStatus;
    updateStoryData();
  });

  $rootScope.$on('board.story.taskToggled', function(event, data) {
    if ($scope.selectedSprint  === null || $scope.selectedSprint.id !== data.sprintId) {
      return false;
    }
    Notifier.warning('Story task state changed');
    var story = _.find($scope.selectedSprint.stories, ['id', data.storyId]);
    _.forEach(story.tasks, function(task, $index) {
      if ($index === data.index) {
        story.tasks[$index].complete = data.state;
      }
    })
  });

  $rootScope.$on('board.story.taskChanged', function(event, data) {
    if ($scope.selectedSprint  === null || $scope.selectedSprint.id !== data.sprintId) {
      return false;
    }
    Notifier.warning('Story task changed');
    var story = _.find($scope.selectedSprint.stories, ['id', data.storyId]);
    story.tasks = data.tasks;
  });

  $rootScope.$on('board.openControlPanel', function(event) {
    $scope.boardControlPanelOpen = !$scope.boardControlPanelOpen;
  });

  $rootScope.$on('board.story.definitionToggled', function(event, storyId) {
    if ($scope.selectedSprint  === null || $scope.selectedSprint.id !== data.sprintId) {
      return false;
    }
    Notifier.warning('Story definition state changed');
    var story = _.find($scope.selectedSprint.stories, ['id', data.storyId]);
    _.forEach(story.definitionOfDone, function(definition, $index) {
      if ($index === data.index) {
        story.definitionOfDone[$index].done = data.state;
      }
    });
  });

  $rootScope.$on('board.story.updated', function(event, data) {
    if ($scope.selectedSprint  === null || $scope.selectedSprint.id !== data.sprintId) {
      return false;
    }
    Notifier.warning('Story data changed. Updating...');
    var story = _.find($scope.selectedSprint.stories, ['id', data.storyId]);
    BoardStory.get(
      {boardId: $scope.selectedSprint.id, storyId: story.id},
      function(response) {
        story.comments = response.comments;
        story.mergeRequests = response.mergeRequests;
        story.archived = response.archived;
        Notifier.success('Done!')
      },
      function(error) {
        console.log(error);
        Alert.randomErrorMessage('OHMYGOOODDD!!!!! A Story was updated and I could not get the updated data. Can you please, be sooo nice to refresh your browser before more minions die in despair!');
      }
    );
  });

  $rootScope.$on('board.story.added', function(event, message) {
    $scope.boardNeedRefresh = message.iterationId === $scope.selectedSprint.id;
    $scope.$apply();
  });

  $rootScope.$on('board.story.orderChanged', function(event, message) {
    $scope.boardNeedRefresh = message.iterationId === $scope.selectedSprint.id;
    $scope.$apply();
  });

  $scope.$watch('timelineFilter', function() {
    $scope.filterTimeline();
  }, true);

  $scope.filterTimeline = function() {
    var filter = {};
    if ($scope.timelineFilter.type !== null) {
      filter.type = $scope.timelineFilter.type;
    }

    $scope.boards = $filter('filter')($scope.fullBoards, filter);

    if ($scope.timelineFilter.team !== null) {
      $scope.boards = $scope.boards.filter(function(board) {
        if (board.hasOwnProperty('team')) {
          return board.team.id === $scope.timelineFilter.team.id;
        }
        return _.findIndex(board.teams, ['id', $scope.timelineFilter.team.id]) > -1;
      });
    }

    var statusSelected = _.map($scope.timelineFilter.status, function(status) {
      if (status.selected) {
        return status.filter;
      }
    });

    if ($scope.timelineFilter.type === '' || $scope.timelineFilter.type === null) {
      $scope.boards = $scope.boards.filter(function(board) {
        return board.type === 'kanban' || statusSelected.length === 0 || statusSelected.indexOf(board.status) > -1;
      });
    }

    if ($scope.timelineFilter.type === 'sprint') {
      $scope.boards = $scope.boards.filter(function(board) {
        return statusSelected.length === 0 || statusSelected.indexOf(board.status) > -1;
      });
    }

    $scope.boards = $scope.boards.filter(function(board) {
      if (board.hasOwnProperty('startDate')) {
        return moment(board.startDate).isBetween($scope.timelineFilter.startDate, $scope.timelineFilter.endDate);
      }
      return moment(board.createdAt).isBetween($scope.timelineFilter.startDate, $scope.timelineFilter.endDate);
    });
  };

  $scope.clearFilterTimeline = function() {
    $scope.boards = $scope.fullBoards;
    $scope.timelineFilter = _.cloneDeep(BoardService.timelineFilter);
  };

  $scope.goToCurrentSprintInTimeline = function() {
    if ($scope.currentTimelineSprintLeftPosition === null) {
      var currentSprintElementPosition = angular.element('.timeline-event.current')[0].getBoundingClientRect();
      $scope.currentTimelineSprintLeftPosition = currentSprintElementPosition.left;
    }
    $scope.scrollOptions.scrollPosX = $scope.currentTimelineSprintLeftPosition - 55;
    $scope.selectSprint($scope.currentSprint);
  };

  $scope.toggleExpandColumn = function(column) {
    column.expanded = !column.expanded;
    $scope.columnExpanded = column.expanded;
  };

  $scope.selectSprint = function(sprint) {
    $scope.selectedSprint = sprint;
    BoardService.selectBoard(sprint);
    $scope.refreshBoard();
  };

  $scope.addColumnSize = function(columnName) {
    if (columnName === 'PLAN' || columnName === 'STAR') {
      return 'col-md-3';
    }
    return 'col-md-2';
  };

  $scope.changeTaskStatus = function($event, task, $index, story) {
    $event.stopPropagation();
    if (task.changing) {
      return false;
    }
    task.changing = true;
    BoardStory.update(
      {boardId: $scope.selectedSprint.id, storyId: story.id},
      {'toggleTask': $index},
      function(response) {
        task.changing = false;
        task.complete = !task.complete;
      },
      function(error) {
        Alert.randomErrorMessage(error);
        task.changing = false;
      }
    );
  };

  $scope.changeDefinitionStatus = function($event, definition, $index, story) {
    $event.stopPropagation();
    if (definition.changing) {
      return false;
    }
    definition.changing = true;
    BoardStory.update(
      {boardId: $scope.selectedSprint.id, storyId: story.id},
      {'toggleDefinition': $index},
      function(response) {
        definition.changing = false;
        definition.done = !definition.done;
      },
      function(error) {
        Alert.randomErrorMessage(error);
        definition.changing = false;
      }
    )
  };

  $scope.moveStoryBack = function(story) {
    var actualStepIndex = $scope.storyTypeSequence.indexOf(story.status);
    if (actualStepIndex === 0) {
      return false;
    }
    story.status = $scope.storyTypeSequence[actualStepIndex - 1];
    story.statusName = $scope.storyTypeNames[story.status];
    updateStoryData();
    saveStoryStatus(story);
  };

  $scope.moveStoryForward = function(story) {
    var actualStepIndex = $scope.storyTypeSequence.indexOf(story.status);
    if (actualStepIndex === $scope.storyTypeSequence.length - 1) {
      return false;
    }
    story.status = $scope.storyTypeSequence[actualStepIndex + 1];
    story.statusName = $scope.storyTypeNames[story.status];
    updateStoryData();
    saveStoryStatus(story);
  };

  $scope.archiveStory = function(story, closePopup) {
    Notifier.warning('Archiving story...');
    BoardStory.update(
      {boardId: $scope.selectedSprint.id, storyId: story.id},
      {'archived': true},
      function(response) {
        story.archived = true;
        Notifier.success('Story archived...');
        if (closePopup) {
          toggleCompleteStoryPopup(null);
        }
      },
      function(error) {
        story.archived = false;
        Notifier.error('Could not archive story! Sandriiim!!!');
      }
    );
  };

  $scope.changeScroll = function(tabIndex) {
    if (isNaN(tabIndex)) {
      tabIndex = 0;
    }
    $scope.selectedStoryCurrentTab = tabIndex;
    $scope.$broadcast('content.changed');
  };

  $scope.saveSelectedBoardStoryComments = function() {
    $scope.saveSelectedStoryComments(
      $scope.selectedStory,
      BoardStory,
      {boardId: $scope.selectedSprint.id, storyId: $scope.selectedStory.id},
      '{0}/users/me/boards/{1}/stories/{2}'.format([appConfig.backendURL, $scope.selectedSprint.id, $scope.selectedStory.id])
    );
  };

  $scope.saveSelectedBoardStoryMergeRequests = function() {
    $scope.saveSelectedStoryMergeRequests(
      $scope.selectedStory,
      BoardStory,
      {boardId: $scope.selectedSprint.id, storyId: $scope.selectedStory.id}
    );
  };

  $scope.saveSelectedBoardStoryTasks = function() {
    $scope.saveSelectedStoryTasks(
      $scope.selectedStory,
      BoardStory,
      {boardId: $scope.selectedSprint.id, storyId: $scope.selectedStory.id}
    );
  };

  $scope.saveSelectedBoardStoryDoDs = function() {
    $scope.saveSelectedStoryDefinitionOfDone(
      $scope.selectedStory,
      BoardStory,
      {boardId: $scope.selectedSprint.id, storyId: $scope.selectedStory.id}
    );
  };

  $scope.toggleControlPanelOpen = function () {
    $scope.boardControlPanelOpen = !$scope.boardControlPanelOpen;
  };

  $scope.getTestPlanUrl = function() {
    return '{0}/users/me/boards/{1}/stories?testPlan=1&boardType={2}'.format([appConfig.backendURL, $scope.selectedSprint.id, $scope.selectedSprint.type])
  };

  $scope.addNewStoryToCurrentIteration = function(storyType) {
    $scope.addNewStory(
      {project: $scope.selectedSprint.project, type: storyType, iterationType: $scope.selectedSprint.type, iteration: $scope.selectedSprint},
      false
    );
  };

  $scope.$on('story.addedToIteration', function(event, result) {
    updateStoryData();
    if (!result.closePopup) {
      $scope.completeStoryPopupOpened = false;
      $state.go('storyBoardState', {boardType: $scope.selectedSprint.type, boardId: $scope.selectedSprint.id, tabIndex: $scope.selectedTab, storyId: result.storyId})
    }
    Alert.close();
  });

  $scope.$on('projects.storyDeleted', function(event, storyDeleted) {
    const indexFull = _.findIndex($scope.selectedSprint.stories, ['id', storyDeleted.id]);
    $scope.selectedSprint.stories.splice(indexFull, 1);
    updateStoryData();
    $state.go('boardState', {boardType: $scope.selectedSprint.type, boardId: $scope.selectedSprint.id, tabIndex: $scope.selectedTab});
  });
}]);
