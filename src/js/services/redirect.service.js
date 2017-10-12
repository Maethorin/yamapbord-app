'use strict';

scrumInCeresServices.service('Redirect', ['$window', '$location', 'AuthService', 'Alert', function ($window, $location, AuthService, Alert) {
  this.toLogin = function() {
    AuthService.clear();
    var currentPath = $location.absUrl();
    var search = $location.search();
    var next = {};
    if (search.hasOwnProperty('next')) {
      next = {next: search.next};
    }
    if (currentPath.indexOf('/login') === -1) {
      next = {next: encodeURIComponent(currentPath)};
    }
    if (currentPath.indexOf('/password_reset') === -1) {
      $location.path('login').search(next);
    }
  };

  this.toHome = function() {
    $window.location.href = '/#!';
    $window.location.reload();
  };

}]);
