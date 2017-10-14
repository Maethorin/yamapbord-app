'use strict';

var format = function(str, data) {
  return str.replace(/{([^{}]+)}/g, function(match, val) {
    var prop = data;
    val.split('.').forEach(function(key) {
      prop = prop[key];
    });

    return prop;
  });
};

String.prototype.format = function(data) {
  return format(this, data);
};

String.prototype.encodedURI = function() {
  return this.replace(' ', '+');
};

String.prototype.slugify = function() {
  function dasherize(str) {
    return str.trim().replace(/[-_\s]+/g, '-').toLowerCase();
  }

  function clearSpecial(str) {
    var from  = 'ąàáäâãåæăćčĉęèéëêĝĥìíïîĵłľńňòóöőôõðøśșşšŝťțţŭùúüűûñÿýçżźž',
      to    = 'aaaaaaaaaccceeeeeghiiiijllnnoooooooossssstttuuuuuunyyczzz';
    to = to.split('');
    return str.replace(/.{1}/g, function(c){
      var index = from.indexOf(c);
      return index === -1 ? c : to[index];
    });
  }

  return clearSpecial(dasherize(this));
};

Number.prototype.paddingLeft = function(size, char) {
  if (!char) {
    char = '0'
  }
  var length = this.toString().length;
  if (length >= size) {
    return this.toString();
  }
  var result = [];
  for (var i = length; i < size; i++) {
    result.push(char);
  }
  return result.join('') + this.toString();
};

var scrumInCeresServices  = angular.module('scrumInCeres.services', []);
var scrumInCeresFactories  = angular.module('scrumInCeres.factories', []);
var scrumInCeresResources  = angular.module('scrumInCeres.resources', []);
var scrumInCeresDirectives  = angular.module('scrumInCeres.directives', []);
var scrumInCeresControllers  = angular.module('scrumInCeres.controllers', []);

var scrumInCeres = angular.module(
  'scrumInCeres', [
    'ngResource',
    'ngAnimate',
    'ngCookies',
    'ngSanitize',
    'ngScrollable',
    'ui.router',
    'ui.bootstrap',
    'ui.utils.masks',
    '19degrees.ngSweetAlert2',
    'scrumInCeres.services',
    'scrumInCeres.factories',
    'scrumInCeres.resources',
    'scrumInCeres.directives',
    'scrumInCeres.controllers'
  ]
);

scrumInCeres.constant('appConfig', {
  backendURL: '@@backendURL'
});

scrumInCeres.config(['$httpProvider', '$stateProvider', '$locationProvider', '$urlRouterProvider', function($httpProvider, $stateProvider, $locationProvider, $urlRouterProvider) {
  $httpProvider.interceptors.push('UpdateToken');
  moment.locale('pt-BR');

  $locationProvider.hashPrefix('!');

  $stateProvider
    .state({
      name: 'boardState',
      url: '/board',
      templateUrl: 'templates/board.html',
      controller: 'BoardController',
      cache: false,
      headers: {
        'Cache-Control' : 'no-cache'
      }
    })

    .state({
      name: 'iceBoxState',
      url: '/ice-box',
      cache: false,
      templateUrl: 'templates/ice-box.html',
      controller: 'IceBoxController'
    })

    .state({
      name: 'login',
      url: '/login',
      cache: false,
      templateUrl: 'templates/login.html',
      controller: 'LoginController'
    })

    .state({
      name: 'logout',
      url: '/logout',
      controller: 'LogoutController'
    });

  $urlRouterProvider.when('', '/board');
}]);

scrumInCeres.run(['$rootScope', 'AuthService', 'MeService', 'Project', function($rootScope, AuthService, MeService, Project) {
  AuthService.update();
  $rootScope.$on('userInfo.updated', function(evt, userInfo) {
    $rootScope.loggedUser = userInfo;
  });
  $rootScope.currentController = null;
  $rootScope.selectedProject = null;
  $rootScope.projects = [];
  $rootScope.search = {
    expression: ''
  };
  $rootScope.currentStoryTypeFilter = null;
  $rootScope.storyTypes = [
    {code: 'FEA', name: 'Feature'},
    {code: 'BUG', name: 'Bug'},
    {code: 'CHO', name: 'Chore'},
    {code: 'TEC', name: 'Techinical'}
  ];

  $rootScope.storyFilterTextTypes = {
    name: {type: 'name', name: 'By Name'},
    statement: {type: 'statement', name: 'By Statement'},
    task: {type: 'task', name: 'By Task'},
    definition: {type: 'definition', name: 'By Definition'}
  };
  $rootScope.storyFilterTextType = null;

  MeService.getInfo().then(
    function(info) {
      Project.query(
        function(response) {
          $rootScope.projects = response;
          // $rootScope.viewProject(response[1]);
        }
      )
    },
    function(error) {
    }
  );

  $rootScope.setStoryFilterTextType = function(type) {
    $rootScope.storyFilterTextType = $rootScope.storyFilterTextTypes[type];
  };

  $rootScope.viewProject = function(project) {
    $rootScope.selectedProject = project;
  };

  $rootScope.filterByStoryType = function(type) {
    $rootScope.currentStoryTypeFilter = type;
    $rootScope.$broadcast('story.filter.type', type);
  };

  $rootScope.addNewStory = function() {
    $rootScope.$broadcast('story.add');
  };

  $rootScope.goToCurrentSprintInTimeline = function() {
    $rootScope.$broadcast('currentSprint.select');
  };

  $rootScope.searchStories = function() {
    $rootScope.$broadcast('story.search', $rootScope.storyFilterTextType);
  };

  $rootScope.showMyInfo = function() {

  };

  $rootScope.logout = function() {

  };
}]);
