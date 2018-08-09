'use strict';

scrumInCeresDirectives.directive('ownerName', [function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      story: '='
    },
    link: function(scope, element, attrs) {
      scope.ownerName = scope.story.owner ? scope.story.owner.name : '';
      if (['DPYD', 'ACCP', 'REJE'].indexOf(scope.story.status) > -1) {
        scope.ownerName = '';
      }
    },
    template: function() {
      return '<span class="story-owner" title="{{story.owner.name}}"><label class="rq-ow">Ow</label>{{ownerName}}</span>'
    }
  };
}]);