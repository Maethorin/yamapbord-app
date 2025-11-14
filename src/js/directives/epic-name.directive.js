'use strict';

yamapBordDirectives.directive('epicName', [function() {
  return {
    replace: true,
    scope: {
      epic: '='
    },
    link: function(scope, element, attrs) {
      scope.epicName = scope.epic.modules ? '[{modules}] {name}'.format(scope.epic) : scope.epic.name;
    },
    template: function() {
      return '<span ng-bind="epicName"></span>'
    }
  };
}]);