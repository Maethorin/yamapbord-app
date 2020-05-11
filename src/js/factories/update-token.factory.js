'use strict';

scrumInCeresFactories.factory('UpdateToken', ['appConfig', '$q', 'AuthService', function(appConfig, $q, AuthService) {
  return {
    request: function(config) {
      config.headers['PUSHER-SOCKET-ID'] = appConfig.pusherSocketId;
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
