'use strict';

scrumInCeresServices.service('AuthService', ['$rootScope', '$cookies', function($rootScope, $cookies) {
  this.token = null;
  this.username = null;

  this.update = function() {
    this.token = $cookies.get('scruminceresUserToken');
    this.username = $cookies.get('scruminceresUserName');
  };

  this.clear = function(){
    this.token = null;
    this.username = null;
  };

  this.userIsLogged = function() {
    return this.token !== null && this.token !== undefined;
  };

}]);
