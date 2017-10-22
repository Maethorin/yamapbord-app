'use strict';

scrumInCeresControllers.controller('BoardController', ['$rootScope', '$scope', '$timeout', 'Alert', 'Notifier', 'Story', function($rootScope, $scope, $timeout, Alert, Notifier, Story) {
  $rootScope.currentController = 'BoardController';
  $scope.timeline = null;
  $scope.scrollOptions = {scrollX: 'bottom', scrollY: 'none', useBothWheelAxes: true, scrollPosX: 0, preventWheelEvents: true};
  $scope.currentTimelineSprintLeftPosition = null;
  $scope.currentSprint = null;
  $scope.columnTemplate = '/templates/include/board-column.html';
  $scope.selectedSprint = null;
  $scope.selectedStory = null;
  $scope.completeStoryPopupOpened = false;
  $scope.today = moment();
  $scope.newTask = {task: null};
  $scope.newTaskVisible = false;

  if (!$rootScope.selectedProject) {
    Notifier.info('Select a Project Dude!', 'Hey!');
  }

  $scope.columns = [
    {name: 'PLAN', label: 'Planned'},
    {name: 'STAR', label: 'Started'},
    {name: 'FINI', label: 'Finished'},
    {name: 'ITST', label: 'In Test'},
    {name: 'RTDP', label: 'Ready to Deploy'},
    {name: 'DPYD', label: 'Deployed'},
    {name: 'ACCP', label: 'Accepted'},
    {name: 'REJE', label: 'Rejected'}
  ];

  $scope.storyTypeSequence = ['PLAN', 'STAR', 'FINI', 'ITST', 'RTDP', 'DPYD', 'ACCP', 'REJE'];

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

  function updateStoryData() {
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

    var start = moment($scope.selectedSprint.startDateText);
    var finish = moment($scope.selectedSprint.endDateText);
    var days = parseInt((finish - start) / (1000 * 60 * 60 * 24)) + start.date() - 2;
    $scope.devDays = [];
    for (var dayNumber = start.date(); dayNumber <= days; dayNumber++) {
      start.date(start.date() + 1);
      if (start.day() !== 0 && start.day() !== 6) {
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

    addPointsToColumn('PLAN');
    addPointsToColumn('STAR');
    addPointsToColumn('FINI');
    addPointsToColumn('ITST');
    addPointsToColumn('RTDP');
    addPointsToColumn('DPYD');
    addPointsToColumn('ACCP');
    addPointsToColumn('REJE');
  }

  function saveStoryStatus(story) {
    story.updating = true;
    Alert.loading();
    Story.update(
      {projectId:  $rootScope.selectedProject.id, sprintId: $scope.selectedSprint.id, id: story.id},
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

  function updatingStoryTaskList() {
    Notifier.warning('Saving tasks...');
    $scope.selectedStory.updating = true;
    Story.update(
      {projectId:  $rootScope.selectedProject.id, sprintId: $scope.selectedSprint.id, id: $scope.selectedStory.id},
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

  $rootScope.$on('currentSprint.select', function() {
    if ($scope.currentTimelineSprintLeftPosition === null) {
      var currentSprintElementPosition = angular.element('.timeline-event.current')[0].getBoundingClientRect();
      $scope.currentTimelineSprintLeftPosition = currentSprintElementPosition.left;
    }
    $scope.scrollOptions.scrollPosX = $scope.currentTimelineSprintLeftPosition - 55;
    $scope.selectSprint($scope.currentSprint);
  });

  $rootScope.$watch('selectedProject', function(project) {
    if (!project) {
      return false;
    }
    $scope.currentSprint = null;
    $scope.selectedSprint = null;

    _.forEach($rootScope.selectedProject.sprints, function(sprint) {
      if (sprint.statusSlug === 'sprint-current') {
        $scope.currentSprint = sprint;
      }
    })
  });

  $scope.selectSprint = function(sprint) {
    $scope.selectedSprint = sprint;
    Alert.loading();
    Story.query(
      {projectId:  $rootScope.selectedProject.id, sprintId: sprint.id},
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
    Story.update(
      {projectId:  $rootScope.selectedProject.id, sprintId: $scope.selectedSprint.id, id: story.id},
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
    Story.update(
      {projectId:  $rootScope.selectedProject.id, sprintId: $scope.selectedSprint.id, id: story.id},
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

  $scope.changeScroll = function() {
    $scope.$broadcast('content.changed');
  };

  $scope.toggleEditStoryTask = function(task, $event) {
    if ($event) {
      if ($event.which === 13) {
        $event.preventDefault();
      }
      return
    }
    if (!task.editing) {
      task.editing = true;
    }
    else {

      delete task.editing;
    }
  };

  $scope.addingTaskToStory = function() {
    $scope.newTaskVisible = true;
  };

  $scope.cancelAddTaskToStory = function($event) {
    $scope.newTaskVisible = false;
    $scope.newTask = {task: null};
    $event.stopPropagation();
  };

  $scope.blurInputTaskFiled = function($event) {
    $timeout(
      function() {
        $scope.addTaskToStory($event);
      },
      150
    )
  };

  $scope.addTaskToStory = function($event) {
    if ($scope.newTask.task === null) {
      return false;
    }
    $scope.newTask.task = $scope.newTask.task.trim();
    if ($scope.newTask.task === '') {
      return false;
    }
    $scope.selectedStory.tasks.push({task: $scope.newTask.task, complete: false});
    $scope.newTaskVisible = false;
    $scope.newTask = {task: null};
    $event.stopPropagation();
  };

  $scope.removeStoryTask = function($index) {
    $scope.selectedStory.tasks.splice($index, 1);
  };

  $scope.saveSelectedStoryTasks = function() {
    updatingStoryTaskList();
  }
}]);
