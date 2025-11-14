'use strict';

yamapBordServices.service('AuthService', ['$rootScope', '$cookies', function($rootScope, $cookies) {
  this.token = null;
  this.username = null;

  this.update = function() {
    this.token = $cookies.get('yamapbordUserToken');
    this.username = $cookies.get('yamapbordUserName');
  };

  this.clear = function(){
    $cookies.remove('yamapbordUserToken', {path: '/', domain: 'vai-mudar.com.br'});
    $cookies.remove('yamapbordUserName', {path: '/', domain: 'vai-mudar.com.br'});
    this.update();
  };

  this.userIsLogged = function() {
    return this.token !== null && this.token !== undefined;
  };

}]);
