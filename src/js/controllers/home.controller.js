'use strict';

scrumInCeresControllers.controller('HomeController', ['$rootScope', '$scope', 'Alert', 'MeService', 'Project', function($rootScope, $scope, Alert, MeService, Project) {
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
          // TODO: pra qdo trocar o projeto e a lista de sprints mudar
          // $scope.$broadcast('content.changed');
        }
      )
    },
    function(error) {
    }
  );

  $scope.viewProject = function(project) {
    $scope.selectedProject = project;
    $scope.selectedProject.sprints = [
      {
        startDate: {year: '2017', month: 'OUT', day: '16'},
        endDate: {year: '2017', month: 'OUT', day: '23'},
        name: 'Sprint A',
        objective: 'Finishing this board'
      }
    ];
  };

  $scope.selectSprint = function(sprint) {
    $scope.selectedSprint = sprint;
  };

  $scope.goToCurrentSprintInTimeline = function() {
    if ($scope.currentTimelineSprintLeftPosition === null) {
      var currentSprintElementPosition = angular.element('.timeline-event.current')[0].getBoundingClientRect();
      $scope.currentTimelineSprintLeftPosition = currentSprintElementPosition.left;
    }
    $scope.scrollOptions.scrollPosX = $scope.currentTimelineSprintLeftPosition - 45;
    $scope.selectedSprint = $scope.currentSprint;
  };

  $scope.searchStories = function() {

  };

  $scope.showMyInfo = function() {

  };

  $scope.logout = function() {

  };

  $scope.selectedProject.sprints = [
    {
      id: 1,
      startDate: {year: '2017', month: 'SET', day: '15'},
      endDate: {year: '2017', month: 'SET', day: '30'},
      name: 'Sprint #1',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'SUCC',
      statusSlug: 'sprint-success'
    },
    {
      id: 1,
      startDate: {year: '2017', month: 'SET', day: '15'},
      endDate: {year: '2017', month: 'SET', day: '30'},
      name: 'Sprint #1',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'SUCC',
      statusSlug: 'sprint-success'
    },
    {
      id: 1,
      startDate: {year: '2017', month: 'SET', day: '15'},
      endDate: {year: '2017', month: 'SET', day: '30'},
      name: 'Sprint #1',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'SUCC',
      statusSlug: 'sprint-success'
    },
    {
      id: 1,
      startDate: {year: '2017', month: 'SET', day: '15'},
      endDate: {year: '2017', month: 'SET', day: '30'},
      name: 'Sprint #1',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'SUCC',
      statusSlug: 'sprint-success'
    },
    {
      id: 1,
      startDate: {year: '2017', month: 'SET', day: '15'},
      endDate: {year: '2017', month: 'SET', day: '30'},
      name: 'Sprint #1',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'SUCC',
      statusSlug: 'sprint-success'
    },
    {
      id: 1,
      startDate: {year: '2017', month: 'SET', day: '15'},
      endDate: {year: '2017', month: 'SET', day: '30'},
      name: 'Sprint #1',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'SUCC',
      statusSlug: 'sprint-success'
    },
    {
      id: 1,
      startDate: {year: '2017', month: 'SET', day: '15'},
      endDate: {year: '2017', month: 'SET', day: '30'},
      name: 'Sprint #1',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'SUCC',
      statusSlug: 'sprint-success'
    },
    {
      id: 1,
      startDate: {year: '2017', month: 'SET', day: '15'},
      endDate: {year: '2017', month: 'SET', day: '30'},
      name: 'Sprint #1',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'SUCC',
      statusSlug: 'sprint-success'
    },
    {
      id: 2,
      startDate: {year: '2017', month: 'OUT', day: '03'},
      endDate: {year: '2017', month: 'OUT', day: '14'},
      name: 'Sprint #2',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'FAIL',
      statusSlug: 'sprint-fail'
    },
    {
      id: 3,
      startDate: {year: '2017', month: 'OUT', day: '16'},
      endDate: {year: '2017', month: 'OUT', day: '23'},
      name: 'Sprint #3',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'CURR',
      statusSlug: 'sprint-current'
    },
    {
      id: 4,
      startDate: {year: '2017', month: 'OUT', day: '25'},
      endDate: {year: '2017', month: 'NOV', day: '05'},
      name: 'Sprint #4',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'PLAN',
      statusSlug: 'sprint-planned'
    },
    {
      id: 4,
      startDate: {year: '2017', month: 'OUT', day: '25'},
      endDate: {year: '2017', month: 'NOV', day: '05'},
      name: 'Sprint #4',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'PLAN',
      statusSlug: 'sprint-planned'
    },
    {
      id: 4,
      startDate: {year: '2017', month: 'OUT', day: '25'},
      endDate: {year: '2017', month: 'NOV', day: '05'},
      name: 'Sprint #4',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'PLAN',
      statusSlug: 'sprint-planned'
    },
    {
      id: 4,
      startDate: {year: '2017', month: 'OUT', day: '25'},
      endDate: {year: '2017', month: 'NOV', day: '05'},
      name: 'Sprint #4',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'PLAN',
      statusSlug: 'sprint-planned'
    },
    {
      id: 4,
      startDate: {year: '2017', month: 'OUT', day: '25'},
      endDate: {year: '2017', month: 'NOV', day: '05'},
      name: 'Sprint #4',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'PLAN',
      statusSlug: 'sprint-planned'
    },
    {
      id: 4,
      startDate: {year: '2017', month: 'OUT', day: '25'},
      endDate: {year: '2017', month: 'NOV', day: '05'},
      name: 'Sprint #4',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'PLAN',
      statusSlug: 'sprint-planned'
    },
    {
      id: 4,
      startDate: {year: '2017', month: 'OUT', day: '25'},
      endDate: {year: '2017', month: 'NOV', day: '05'},
      name: 'Sprint #4',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'PLAN',
      statusSlug: 'sprint-planned'
    },
    {
      id: 4,
      startDate: {year: '2017', month: 'OUT', day: '25'},
      endDate: {year: '2017', month: 'NOV', day: '05'},
      name: 'Sprint #4',
      objective: 'Finishing this board',
      storiesQuantity: 8,
      points: 45,
      status: 'PLAN',
      statusSlug: 'sprint-planned'
    }
  ];

  _.forEach($scope.selectedProject.sprints, function(sprint) {
    if (sprint.statusSlug === 'sprint-current') {
      $scope.currentSprint = sprint;
    }
  })
}]);
