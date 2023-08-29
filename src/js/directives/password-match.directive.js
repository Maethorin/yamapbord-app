'use strict';

scrumInCeresDirectives.directive('passwordMatch', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$validators.passwordMatch = function(modelValue, viewValue) {
        if (scope.passwordChange) {
          var passwordField = attrs.passwordMatch;
          if (!passwordField) {
            passwordField = 'password';
          }
          return scope.passwordChange[passwordField] === (viewValue || ctrl.$viewValue);
        }
      };
    }
  };
});