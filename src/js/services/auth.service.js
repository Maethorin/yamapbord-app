'use strict';

yamapBordServices.service('AuthService', ['$rootScope', '$cookies', 'appConfig', function($rootScope, $cookies, appConfig) {
  this.token = null;
  this.username = null;

  this.update = function() {
    this.token = $cookies.get('yamapbordUserToken');
    this.username = $cookies.get('yamapbordUserName');
  };

  this.clear = function(){
    $cookies.remove('yamapbordUserToken', {path: '/', domain: appConfig.hostDomain});
    $cookies.remove('yamapbordUserName', {path: '/', domain: appConfig.hostDomain});
    this.update();
  };

  this.userIsLogged = function() {
    return this.token !== null && this.token !== undefined;
  };

}]);
