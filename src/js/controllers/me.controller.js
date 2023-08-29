'use strict';

scrumInCeresControllers.controller('MeController', ['$rootScope', '$scope', function($rootScope, $scope) {
  $rootScope.currentController = 'MeController';
  $scope.passwordFieldType = 'password';

  $scope.passwordChange = {
    currentPassword: null,
    newPassword: null,
    confirmPassword: null
  }

  $scope.togglePasswordFieldType = function() {
    $scope.passwordFieldType = $scope.passwordFieldType === 'password' ? 'text': 'password';
  };
}]);
