'use strict';

yamapBordDirectives.directive('liStoryOrderGroup', ['$rootScope', function($rootScope) {
  return {
    replace: true,
    scope: {
      porraAngular: '=',
      useOrder: '='
    },

    link: function($scope) {
      $scope.selectGroupStory = function() {
        $scope.$emit('group-story-changed')
      };
    },

    templateUrl: "templates/directives/li-story-order-group.html"
  };
}]);