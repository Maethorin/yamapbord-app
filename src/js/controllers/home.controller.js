'use strict';

scrumInCeresControllers.controller('HomeController', ['$rootScope', '$scope', 'Alert', 'MeService', 'Project', 'Story', function($rootScope, $scope, Alert, MeService, Project,Story) {
  $scope.projects = [];
  $scope.search = {
    expression: ''
  };

  $scope.selectedProject = {};
  $scope.timeline = null;
  $scope.scrollOptions = {scrollX: 'bottom',scrollY: 'none', useBothWheelAxes: true, scrollPosX: 0, preventWheelEvents: true};
  $scope.currentTimelineSprintLeftPosition = null;
  $scope.currentSprint = null;
  $scope.columnTemplate = '/templates/include/board-column.html';
  $scope.selectedSprint = null;
  $scope.selectedStory = null;
  $scope.completeStoryPopupOpened = false;

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
        $scope.updateStoryData();
      }
    )
  };

  $scope.addColumnSize = function(columnName) {
    if (columnName === 'PLAN' || columnName === 'STAR') {
      return 'col-md-3';
    }
    return 'col-md-2';
  };

  $scope.goToCurrentSprintInTimeline = function() {
    if ($scope.currentTimelineSprintLeftPosition === null) {
      var currentSprintElementPosition = angular.element('.timeline-event.current')[0].getBoundingClientRect();
      $scope.currentTimelineSprintLeftPosition = currentSprintElementPosition.left;
    }
    $scope.scrollOptions.scrollPosX = $scope.currentTimelineSprintLeftPosition - 55;
    $scope.selectSprint($scope.currentSprint);
  };

  $scope.updateStoryData = function() {

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
  };

  $scope.changeTaskStatus = function(task, $index, story) {
    if (task.changing) {
      return false;
    }
    task.changing = true;
    Story.update(
      {projectId:  $scope.selectedProject.id, sprintId: $scope.selectedSprint.id, id: story.id},
      {'toggleTask': $index},
      function(response) {
        task.changing = false;
        task.complete = !task.complete;
      },
      function(error) {
        task.changing = false;
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
    $scope.updateStoryData();
    saveStoryStatus(story);
  };

  $scope.moveStoryForward = function(story) {
    var actualStepIndex = $scope.storyTypeSequence.indexOf(story.status);
    if (actualStepIndex === $scope.storyTypeSequence.length - 1) {
      return false;
    }
    story.status = $scope.storyTypeSequence[actualStepIndex + 1];
    story.statusName = $scope.storyTypeNames[story.status];
    $scope.updateStoryData();
    saveStoryStatus(story);
  };

  $scope.searchStories = function() {

  };

  $scope.showMyInfo = function() {

  };

  $scope.logout = function() {

  };

  function saveStoryStatus(story) {
    story.updating = true;
    Story.update(
      {projectId:  $scope.selectedProject.id, sprintId: $scope.selectedSprint.id, id: story.id},
      {'status': story.status},
      function(response) {
        story.updating = false;
      },
      function(error) {
        story.updating = false;
      }
    )
  }
}]);
