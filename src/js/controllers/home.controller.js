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
    {name: 'RTDP', label: 'Ready to Deploy'},
    {name: 'ACCP', label: 'Accepted'}
  ];

  $scope.pointsPerStoryStatus = {
    'PLAN': 0,
    'STAR': 0,
    'FINI': 0,
    'RTDP': 0,
    'ACCP': 0
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

        $scope.pointsPerStoryStatus = {
          'PLAN': 0,
          'STAR': 0,
          'FINI': 0,
          'RTDP': 0,
          'ACCP': 0
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
    _.forEach($scope.selectedSprint.stories, function(story) {
      $scope.stories[story.status].push(story);
      $scope.pointsPerStoryStatus[story.status] += story.points;
      story.hasTasks = ['PLAN', 'STAR'].indexOf(story.status) > -1;
    });

    // $q.all(totalPoints).then(function () {
    //   var start = parseDate($scope.iteration.start);
    //   var finish = parseDate($scope.iteration.finish);
    //   var days = parseInt((finish - start) / (1000 * 60 * 60 * 24)) + start.getDate() - 2;
    //   $scope.devDays = [];
    //   for (var dayNumber = start.getDate(); dayNumber <= days; dayNumber++) {
    //     start.setDate(start.getDate() + 1);
    //     if (start.getDay() != 0 && start.getDay() != 6) {
    //       var passed = $scope.today.getMonth() > start.getMonth() || ($scope.today.getDate() > start.getDate() && $scope.today.getMonth() == start.getMonth());
    //       var isToday = $scope.today.getMonth() == start.getMonth() && $scope.today.getDate() == start.getDate();
    //       $scope.devDays.push({
    //         id: dayNumber,
    //         day: '{0}/{1}'.format([start.getDate().paddingLeft(2), (start.getMonth() + 1).paddingLeft(2)]),
    //         points: 0,
    //         passed: passed,
    //         isToday: isToday
    //       });
    //     }
    //   }
    //
    //   totalPoints = totalPoints.reduce(function(a, b) { return a + b; });
    //   for (var devdayIndex = 0; devdayIndex < $scope.devDays.length; devdayIndex++) {
    //     $scope.devDays[devdayIndex].points = totalPoints / $scope.devDays.length;
    //   }
    //
    //   $scope.pointsPerColumn = [];
    //   var pointsAddes = 1;
    //   function addPointsToColumn(columnName) {
    //     _.forEach(range($scope.pointsPerStoryStatus[columnName]), function() {
    //       $scope.pointsPerColumn.push({column: columnName, point: pointsAddes});
    //       pointsAddes += 1;
    //     });
    //   }
    //   addPointsToColumn('accepted');
    //   addPointsToColumn('delivered');
    //   addPointsToColumn('finished');
    //   addPointsToColumn('started');
    //   addPointsToColumn('planned');
    // });
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

  $scope.searchStories = function() {

  };

  $scope.showMyInfo = function() {

  };

  $scope.logout = function() {

  };
}]);
