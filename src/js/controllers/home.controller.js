'use strict';

scrumInCeresControllers.controller('HomeController', ['$rootScope', '$scope', 'Alert', 'MeService', 'Project', 'Story', function($rootScope, $scope, Alert, MeService, Project,Story) {
  $scope.projects = [];
  $scope.search = {
    expression: ''
  };

  $scope.selectedProject = {};
  $scope.timeline = null;
  $scope.scrollOptions = {scrollX: 'bottom',scrollY: 'none', useBothWheelAxes: true, scrollPosX: 0};
  $scope.currentTimelineSprintLeftPosition = null;
  $scope.currentSprint = null;

  MeService.getInfo().then(
    function(info) {
      Project.query(
        function(response) {
          $scope.projects = response;
          $scope.viewProject(response[1]);
        }
      )
    },
    function(error) {
    }
  );

  $scope.viewProject = function(project) {
    $scope.selectedProject = project;

    _.forEach($scope.selectedProject.sprints, function(sprint) {
      if (sprint.statusSlug === 'sprint-current') {
        $scope.currentSprint = sprint;
      }
    })
  };

  $scope.selectSprint = function(sprint) {
    $scope.selectedSprint = sprint;
    Story.query(
      {projectId:  $scope.selectedProject.id, sprintId: sprint.id},
      function(response) {
        $scope.selectedSprint.stories = response;
      }
    )
  };

  $scope.goToCurrentSprintInTimeline = function() {
    if ($scope.currentTimelineSprintLeftPosition === null) {
      var currentSprintElementPosition = angular.element('.timeline-event.current')[0].getBoundingClientRect();
      $scope.currentTimelineSprintLeftPosition = currentSprintElementPosition.left;
    }
    $scope.scrollOptions.scrollPosX = $scope.currentTimelineSprintLeftPosition - 55;
    $scope.selectSprint($scope.currentSprint);
  };

  $scope.searchStories = function() {

  };

  $scope.showMyInfo = function() {

  };

  $scope.logout = function() {

  };
}]);
