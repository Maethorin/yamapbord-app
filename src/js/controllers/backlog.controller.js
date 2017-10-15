'use strict';

scrumInCeresControllers.controller('BacklogController', ['$rootScope', '$scope', 'Alert', 'StoryService', 'Backlog', function($rootScope, $scope, Alert, StoryService, Backlog) {
  $rootScope.selectedProject = null;
  $rootScope.currentController = 'BacklogController';
  $scope.scrollOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: true};

  $scope.completeSprintPopupOpened = false;
  $scope.selectedSprint = null;
  $scope.selectedSprintOriginalStories = null;
  $scope.selectedSprintIndex = null;
  $scope.addingNewSprint = false;

  $scope.completeStoryPopupOpened = false;
  $scope.selectedStory = null;

  $scope.storiesPopupOpened = false;
  $scope.stories = [];
  $scope.newStoryVisible = false;

  $scope.changeScroll = function() {
    $scope.$broadcast('content.changed');
  };

  function getStories() {
    Backlog.query(
      function(response) {
        $scope.sprints = response;
        _.forEach($scope.sprints, function(sprint) {
          setWorkingDays(sprint);
        });
      }
    );
  }

  getStories();

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

  $rootScope.$on('sprint.add', function() {
    $scope.addingNewSprint = true;
    $scope.selectedSprint = {
      name: null,
      objective: null,
      startDate: null,
      endDate: null,
      points: null,
      status: 'PLAN',
      project: null,
      stories: []
    };
    $scope.completeSprintPopupOpened = true;
  });

  $scope.setSelectedSprintProject = function(project) {
    $scope.selectedSprint.project = project;
  };

  $scope.toggleCompleteStoryPopup = function(story) {
    if (story === null) {
      $scope.selectedStory = story;
      $scope.completeStoryPopupOpened = !$scope.completeStoryPopupOpened;
    }
    StoryService.getFullStory(story.id).then(
      function(response) {
        $scope.selectedStory = story;
        $scope.selectedStory.tasks = response.tasks;
        $scope.selectedStory.definitionOfDone = response.definitionOfDone;
        $scope.completeStoryPopupOpened = !$scope.completeStoryPopupOpened;
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

    if ($scope.selectedSprint.project === null) {
      Alert.randomErrorMessage('Invalid Fields', 'The Project Dude...');
      return false;
    }

    if ($scope.addingNewSprint) {
      Backlog.save(
        $scope.selectedSprint,
        function() {
          getStories();
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

  $scope.addingStoryToSelectedSprint = function() {
    StoryService.getReadyUse().then(
      function(stories) {
        $scope.stories = stories;
        _.forEach($scope.stories, function(story) {
          if (_.findIndex($scope.selectedSprint.stories, ['id', story.id]) > -1) {
            story.selected = true;
          }
        });
        $scope.storiesPopupOpened = true;
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.saveAddSelectedSprintStories = function() {
    $scope.selectedSprint.stories = _.clone($scope.selectedSprintOriginalStories);
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

  $scope.removeSprintStory = function(story, $index) {
    if (story.sprintId) {
      Alert.warning('Watch Out!', 'This story is already associated with this sprint. Are you sure you want to desassociate it?', function() {
        StoryService.updateInIceLog({id: story.id, sprintId: null}).then(
          function() {
            $scope.selectedSprint.stories.splice($index, 1);
            Alert.randomSuccessMessage();
            recalculateSelectedSprintPoints();
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
}]);
