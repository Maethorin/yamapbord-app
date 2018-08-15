'use strict';

scrumInCeresControllers.controller('BoardController', ['$rootScope', '$scope', '$timeout', '$filter', '$stateParams', 'MeService', 'StoryService', 'Alert', 'Notifier', 'Board', 'BoardStory', 'HollydayService', function($rootScope, $scope, $timeout, $filter, $stateParams, MeService, StoryService, Alert, Notifier, Board, BoardStory, HollydayService) {
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
  $scope.completeStoryPopupOpened = false;
  $scope.today = moment();
  $scope.newTask = {task: null};
  $scope.newTaskVisible = false;
  $scope.boardControlPanelOpen = false;
  $scope.columnExpanded = false;

  $scope.columns = [
    {name: 'PLAN', label: 'Planned'},
    {name: 'STAR', label: 'Started'},
    {name: 'FINI', label: 'Finished'},
    {name: 'RTDP', label: 'Ready to Deploy'},
    {name: 'ITST', label: 'In Test'},
    {name: 'DPYD', label: 'Deployed'},
    {name: 'ACCP', label: 'Accepted'},
    {name: 'REJE', label: 'Rejected'}
  ];

  $scope.storyTypeSequence = ['PLAN', 'STAR', 'FINI', 'RTDP', 'ITST', 'DPYD', 'ACCP', 'REJE'];

  $scope.storyTypeNames = {
    'PLAN': 'Planned',
    'STAR': 'Started',
    'FINI': 'Finished',
    'ITST': 'In Test',
    'RTDP': 'Ready to Deploy',
    'DPYD': 'Deployed',
    'ACCP': 'Accepted',
    'REJE': 'Rejected'
  };

  $scope.teams = [];

  $scope.timelineFilter = {
    type: null,
    startDate: moment().add(-12, 'months'),
    endDate: moment().add(4, 'months'),
    team: null,
    status: 'CURR'
  };

  Alert.loading();

  function getBoardsList() {
    Board.query(
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
          $scope.selectSprint(_.find($scope.boards, {id: parseInt($stateParams.boardId)}));
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
          'ITST': 0,
          'RTDP': 0,
          'DPYD': 0,
          'ACCP': 0,
          'REJE': 0
        };

        $scope.stories = {
          'PLAN': [],
          'STAR': [],
          'FINI': [],
          'ITST': [],
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
        addPointsToColumn('ITST');
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
      {boardId: $scope.selectedSprint.id, id: story.id},
      {'status': story.status},
      function(response) {
        story.updating = false;
        story.owner = response.owner;
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
        story.updating = false;
      }
    );
  }

  function updatingStoryCommentsList() {
    Notifier.warning('Saving comments...');
    $scope.selectedStory.updating = true;
    BoardStory.update(
      {boardId: $scope.selectedSprint.id, id: $scope.selectedStory.id},
      {'comments': $scope.selectedStory.comments},
      function() {
        $scope.selectedStory.updating = false;
        Notifier.success('Done!')
      },
      function(error) {
        Alert.randomErrorMessage(error);
        $scope.selectedStory.updating = false;
      }
    );
  }

  // TODO: Sim, está repetido e eu estou sem saco para arrumar... é Open Source!
  function updatingStoryTaskList() {
    Notifier.warning('Saving tasks...');
    $scope.selectedStory.updating = true;
    BoardStory.update(
      {boardId: $scope.selectedSprint.id, id: $scope.selectedStory.id},
      {'tasks': $scope.selectedStory.tasks},
      function() {
        $scope.selectedStory.updating = false;
        Notifier.success('Done!')
      },
      function(error) {
        Alert.randomErrorMessage(error);
        $scope.selectedStory.updating = false;
      }
    );
  }

  function updatingStoryMergeRequestsList() {
    Notifier.warning('Saving merge requests...');
    $scope.selectedStory.updating = true;
    BoardStory.update(
      {boardId: $scope.selectedSprint.id, id: $scope.selectedStory.id},
      {mergeRequests: $scope.selectedStory.mergeRequests},
      function() {
        $scope.selectedStory.updating = false;
        Notifier.success('Done!')
      },
      function(error) {
        Alert.randomErrorMessage(error);
        $scope.selectedStory.updating = false;
      }
    );
  }

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
    })
  });


  $rootScope.$on('board.story.updated', function(event, data) {
    if ($scope.selectedSprint  === null || $scope.selectedSprint.id !== data.sprintId) {
      return false;
    }
    Notifier.warning('Story data changed. Updating...');
    var story = _.find($scope.selectedSprint.stories, ['id', data.storyId]);
    BoardStory.get(
      {boardId: $scope.selectedSprint.id, id: story.id},
      function(response) {
        story.comments = response.comments;
        story.mergeRequests = response.mergeRequests;
        story.archived = response.archived;
        Notifier.success('Done!')
      },
      function(error) {
        Alert.randomErrorMessage('OHMYGOOODDD!!!!! A Story was updated and I could not get the updated data. Can you please, be sooo nice to refresh your browser before more minions die in despair!');
      }
    );

  });

  $scope.filterTimeline = function() {
    var filter = {};
    if ($scope.timelineFilter.type !== null) {
      filter.type = $scope.timelineFilter.type;
    }
    if ($scope.timelineFilter.team !== null) {
      filter.team = $scope.timelineFilter.team;
    }
    if ($scope.timelineFilter.status) {
      $scope.boards = $scope.fullBoards.filter(function(board) {
        return board.status === $scope.timelineFilter.status || board.type === 'kanban';
      });
      $scope.boards = $scope.boards.filter(function(board) {
        return moment(board.startDate).isBetween($scope.timelineFilter.startDate, $scope.timelineFilter.endDate);
      });
    }
    else {
      $scope.boards = $scope.fullBoards.filter(function(board) {
        return moment(board.startDate).isBetween($scope.timelineFilter.startDate, $scope.timelineFilter.endDate);
      });
    }
    $scope.boards = $filter('filter')($scope.boards, filter);
  };

  $scope.clearFilterTimeline = function() {
    $scope.boards = $scope.fullBoards;
    $scope.timelineFilter = {
      type: null,
      startDate: moment().add(-14, 'days'),
      endDate: moment().add(4, 'months'),
      team: null,
      status: null
    };
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
    Alert.loading();
    BoardStory.query(
      {boardId: sprint.id, boardType: sprint.type},
      function(response) {
        $scope.selectedSprint.stories = response;
        updateStoryData();
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    )
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
      {boardId: $scope.selectedSprint.id, id: story.id},
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

  $scope.changeDefinitionStatus = function(definition, $index, story) {
    if (definition.changing) {
      return false;
    }
    definition.changing = true;
    BoardStory.update(
      {boardId: $scope.selectedSprint.id, id: story.id},
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

  $scope.toggleCompleteStoryPopup = function(story) {
    $scope.selectedStory = story;
    $scope.completeStoryPopupOpened = !$scope.completeStoryPopupOpened;
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
      {boardId: $scope.selectedSprint.id, id: story.id},
      {'archived': true},
      function(response) {
        story.archived = true;
        Notifier.success('Story archived...');
        if (closePopup) {
          $scope.toggleCompleteStoryPopup(null);
        }
      },
      function(error) {
        story.archived = false;
        Notifier.error('Could not archive story! Sandriiim!!!');
      }
    );
  };

  $scope.changeScroll = function(tabIndex) {
    $scope.selectedStoryCurrentTab = tabIndex;
    $scope.$broadcast('content.changed');
  };

  $scope.saveSelectedStoryComments = function() {
    updatingStoryCommentsList();
  };

  $scope.saveSelectedStoryMergeRequests = function() {
    updatingStoryMergeRequestsList();
  };

  $scope.saveSelectedStoryTasks = function() {
    updatingStoryTaskList();
  };

  StoryService.prepareScopeToEditStory($scope);

  $scope.toggleControlPanelOpen = function () {
    $scope.boardControlPanelOpen = !$scope.boardControlPanelOpen;
  };

}]);
