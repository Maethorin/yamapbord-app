'use strict';

scrumInCeresControllers.controller('BacklogController', ['$rootScope', '$scope', 'Alert', 'StoryService', 'Backlog', function($rootScope, $scope, Alert, StoryService, Backlog) {
  $rootScope.selectedProject = null;
  $rootScope.currentController = 'BacklogController';
  $scope.scrollOptions = {scrollX: 'none', scrollY: 'right', preventWheelEvents: true};

  Backlog.query(
    function(response) {
      $scope.sprints = response;
    }
  );
}]);
