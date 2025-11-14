'use strict';

yamapBordControllers.controller('LoginController', ['$rootScope', '$scope', '$window', '$location', '$state','$timeout', 'AuthService', 'Login',
function($rootScope, $scope, $window, $location, $state, $timeout, AuthService, Login) {
  $rootScope.currentController = 'LoginController';

  if (AuthService.userIsLogged()) {
    $state.go('homeState', {}, {reload: 'homeState'});
  }

  $scope.login = new Login({
    username: null,
    password: null
  });

  $scope.formLogin = true;
  $scope.loginFail = false;
  $scope.loginLoad = false;

  $scope.logingIn = function() {
    $scope.loginFail = false;
    if ($scope.formLogin.$invalid) {
      $scope.loginFail = true;
      return false;
    }
    $scope.loginLoad = true;
    $scope.login.$save().then(
      function(resp) {
        AuthService.update();
        var next = $location.search();
        var redirectUrl = '/';
        if (next.hasOwnProperty('next')) {
          redirectUrl = decodeURIComponent(next.next);
        }
        $window.location.href = redirectUrl;
        $window.location.reload();
      },
      function() {
        $scope.loginFail = true;
        $scope.loginLoad = false;
      }
    );
  };

  $scope.trocarForm = function() {
    $scope.formLogin = !$scope.formLogin
  }
}]);


yamapBordControllers.controller('LogoutController', ['$rootScope', '$window', 'AuthService', 'Login', function($rootScope, $window, AuthService, Login) {
  AuthService.clear();
  $window.location.href = '/';
}]);