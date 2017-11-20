'use strict';

scrumInCeresDirectives.directive('moduleEpic', ['$rootScope', function($rootScope) {
  return {
    replace: true,
    scope: {
      moduleId: '=',
      epicId: '='
    },
    link: function(scope, element, attrs) {
      var module = _.find($rootScope.modules, ['id', scope.moduleId]);
      var epic = _.find($rootScope.epics, ['id', scope.epicId]);
      scope.moduleEpic = '[{0}] {1}'.format([module.acronym, epic.name]);
    },
    template: function() {
      return '<span ng-bind="moduleEpic"></span>'
    }
  };
}]);