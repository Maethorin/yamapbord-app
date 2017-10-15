'use strict';

scrumInCeresControllers.controller('BacklogController', ['$rootScope', '$scope', 'Alert', 'StoryService', 'Backlog', function($rootScope, $scope, Alert, StoryService, Backlog) {
  $rootScope.selectedProject = null;
  $rootScope.currentController = 'BacklogController';
  $scope.scrollOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: true};

  $scope.completeSprintPopupOpened = false;
  $scope.selectedSprint = null;
  $scope.selectedSprintIndex = null;
  $scope.addingNewSprint = false;

  $scope.completeStoryPopupOpened = false;
  $scope.selectedStory = null;

  function getStories() {
    Backlog.query(
      function(response) {
        $scope.sprints = response;
        _.forEach($scope.sprints, function(sprint) {
          var startDate = moment(sprint.startDate).startOf('day');
          var endDate = moment(sprint.endDate).startOf('day');
          sprint.workingDays = 1;
          while(startDate.add(1, 'days').diff(endDate) < 0) {
            if (startDate.weekday() !== 6 && startDate.weekday() !== 7) {
              sprint.workingDays += 1;
            }
          }
          sprint.startDate = moment(sprint.startDate);
          sprint.startDate.opened = false;
          sprint.endDate = moment(sprint.endDate);
        });
      }
    );
  }

  getStories();

  $rootScope.$on('sprint.add', function() {
    $scope.addingNewSprint = true;
    $scope.selectedSprint = {
      name: null,
      objective: null,
      startDate: null,
      endDate: null,
      points: null,
      status: 'PLAN',
      projectId: null,
      stories: []
    };
    $scope.completeSprintPopupOpened = true;
  });

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
        Alert.error('Sum Ten Wong')
      }
    );
  };

  $scope.selectSprintToEdit = function(sprint, $index) {
    $scope.selectedSprint = _.cloneDeep(sprint);
    $scope.selectedSprintIndex = $index;
    $scope.completeSprintPopupOpened = true;
  };

  $scope.saveSelectedSprint = function(form) {
    if (form.$invalid) {
      Alert.error(
        'Sum Ten Wong',
        'Invalid fields.'
      );
      return false;
    }

    if ($scope.addingNewSprint) {
      Backlog.save(
        $scope.selectedSprint,
        function() {
          getStories();
        },
        function(error) {
          Alert.error('Sum Ten Wong', error.data.exception);
        }
      );
      return;
    }
    StoryService.updateInIceLog($scope.selectedStory).then(
      function() {
        $scope.stories[$scope.selectedStoryIndex] = $scope.selectedStory;
        $scope.selectedStoryIndex = null;
        $scope.selectedStory = null;
        $scope.completeStoryPopupOpened = false;
      },
      function(error) {
        Alert.error('Sum Ten Wong', error.data.exception);
      }
    );
  };

  $scope.cancelSaveSelectedSprint = function() {
    $scope.selectedSprint = null;
    $scope.selectedSprintIndex = null;
    $scope.completeSprintPopupOpened = false;
  };
}]);
