'use strict';

scrumInCeresDirectives.directive('storyFilterTotal', [function() {
  return {
    replace: true,
    scope: {
      totalStories: '=',
      filteredStories: '='
    },
    link: function(scope, element, attrs, controller) {
      scope.$watch('filteredStories', function(newValue) {
        if (newValue === undefined) {
          return false
        }
        scope.storyFilterText = "{filteredStories} of {totalStories} stories filtered".format(scope);
        if (scope.filteredStories === scope.totalStories) {
          scope.storyFilterText = 'No stories filtered of {totalStories} total'.format(scope);
        }
        if (scope.filteredStories === 0) {
          scope.storyFilterText = "No stories found for filter";
        }
        if (scope.totalStories === 0) {
          scope.storyFilterText = "There is no stories for this project";
        }
      });
    },
    template: function() {
      return '<span class="story-filter-text" ng-bind="storyFilterText"></span>'
    }
  };
}]);