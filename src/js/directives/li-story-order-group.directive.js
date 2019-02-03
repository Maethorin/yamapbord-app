'use strict';

scrumInCeresDirectives.directive('liStoryOrderGroup', [function() {
  return {
    replace: true,
    scope: {
      porraAngular: '='
    },
    templateUrl: "templates/directives/li-story-order-group.html"
  };
}]);