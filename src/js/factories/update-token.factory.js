'use strict';

scrumInCeresFactories.factory('UpdateToken', ['$rootScope', '$q', 'AuthService', function($rootScope, $q, AuthService) {
  return {
    request: function(config) {
      config.headers['PUSHER-SOCKET-ID'] = $rootScope.pusherSocketId;
      return config;
    },
    responseError: function(response) {
      if (response.status === 401) {
        AuthService.clear();
        window.location.href = '/#!/login';
      }
      return $q.reject(response);
    }
  };
}]);
