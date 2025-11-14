'use strict';

yamapBordDirectives.directive('epicTitle', function(){
  return {
    restrict: 'E',
    link: function(scope, element, attrs) {
      angular.element('.ice-box').bind("scroll", function () {
        var el = element[0];
        var top = el.getBoundingClientRect().top;
        if (top < 100 && top > 0) {
          scope.fixEpicName(attrs.epicNameToFix);
          scope.fixModuleName(attrs.moduleNameToFix);
          scope.$apply();
        }
      });
    },
    template: function(element, attrs) {
      return '<span id="{epicNameToFix}" class="module-name name">{epicNameToFix}</span>'.format(attrs)
    }
  };
});