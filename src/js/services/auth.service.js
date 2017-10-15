'use strict';

scrumInCeresServices.service('AuthService', ['$rootScope', '$cookies', function($rootScope, $cookies) {
  this.token = null;
  this.username = null;

  this.update = function() {
    this.token = $cookies.get('scruminceresUserToken');
    this.username = $cookies.get('scruminceresUserName');
  };

  this.clear = function(){
    $cookies.remove('scruminceresUserToken', {path: '/', domain: 'inceres.com.br'});
    $cookies.remove('scruminceresUserName', {path: '/', domain: 'inceres.com.br'});
    this.update();
  };

  this.userIsLogged = function() {
    return this.token !== null && this.token !== undefined;
  };

}]);
