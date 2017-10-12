'use strict';

scrumInCeresFactories.factory('UpdateToken', ['AuthService', '$q', '$location', function(AuthService, $q, $location) {
  return {
    responseError: function(response) {
      if (response.status === 401) {
        AuthService.clear();
        window.location.href = '/#!/login';
      }
      return $q.reject(response);
    }
  };
}]);
