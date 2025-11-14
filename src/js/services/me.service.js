'use strict';

yamapBordServices.service('MeService', ['$rootScope', '$q', '$window', 'AuthService', '$location', '$stateParams', 'Redirect', 'Alert', 'Me', function ($rootScope, $q, $window, AuthService, $location, $stateParams, Redirect, Alert, Me) {
  var info = null;
  var loading = false;

  var infoDeferrer = $q.defer();

  var errorGetInfo = function(error) {
    info = null;
    loading = false;
    if (error.status === 500) {
      Alert.error(
        'Erro',
        'Ocorreu um erro na comunicação com o servidor. Por favor, atualize a página para tentar novamente'
      ).then(
        function() {
          Redirect.toLogin();
        },
        function() {
          Redirect.toLogin();
        }
      );
    }
  };

  this.updateInfo = function() {
    Me.get(
      function(response) {
        $rootScope.$broadcast('userInfo.updated', response);
      },
      function(error) {
        errorGetInfo(error);
      }
    );
  };

  this.getInfo = function() {
    if (info) {
      infoDeferrer.resolve(info);
    }
    else {
      if (!loading) {
        loading = true;
        Me.get(
          function(response) {
            info = response;
            $rootScope.$broadcast('userInfo.updated', response);
            loading = false;
            infoDeferrer.resolve(info);
          },
          function(error) {
            errorGetInfo(error);
            infoDeferrer.reject(error);
          }
        );
      }
    }
    return infoDeferrer.promise;
  };
}]);
