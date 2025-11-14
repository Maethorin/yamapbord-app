'use strict';

yamapBordDirectives.directive('liStoryFilter', ['$rootScope', function($rootScope) {
  return {
    replace: true,
    scope: {
      porraAngular: '=',
      storyFilter: '=',
      showIteration: '=',
      storiesFiltered: '=',
      stories: '='
    },
    link: function($scope) {
      $scope.openStoryFilter = function() {
        $scope.porraAngular.storyFilterIsOpen = !$scope.porraAngular.storyFilterIsOpen;
      };

      $scope.clearStoryFilter = function() {
        $scope.porraAngular.storyFilterIteration = null;
        $scope.porraAngular.moduleAcronym = '';

        $scope.storyFilter = {
          name: '',
          statement: ''
        };
      };

      $scope.setIterationStoryFilter = function() {
        delete $scope.storyFilter.sprintId;
        delete $scope.storyFilter.kanbanId;
        if ($scope.porraAngular.storyFilterIteration === 'icebox') {
          $scope.storyFilter.sprintId = null;
          $scope.storyFilter.kanbanId = null;
          return;
        }
        $scope.storyFilter.sprintId = $scope.porraAngular.storyFilterIteration === 'sprint' ? '' : null;
        $scope.storyFilter.kanbanId = $scope.porraAngular.storyFilterIteration === 'kanban' ? '' : null;
      };

      $scope.selectModuleStoryFilter = function() {
        $scope.porraAngular.moduleAcronym = $rootScope.modulesNames[$scope.storyFilter.moduleId];
      };
    },
    templateUrl: "templates/directives/li-story-filter.html"
  };
}]);