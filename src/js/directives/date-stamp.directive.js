'use strict';

scrumInCeresDirectives.directive('dateStamp', [function() {
  return {
    replace: true,
    scope: {
      date: '='
    },
    link: function(scope, element, attrs, controller) {
      var momentDate = moment(scope.date);
      scope.showDate = {
        month: momentDate.format('MM'),
        day: momentDate.format('DD'),
        year: momentDate.format('YYYY')
      };
    },
    templateUrl: "templates/directives/date-stamp.html"
  };
}]);