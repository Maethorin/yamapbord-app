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
var scrumInCeresFilters  = angular.module('scrumInCeres.filters', []);
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
    'ui.bootstrap.datetimepicker',
    'ui.dateTimeInput',
    'ui.checkbox',
    '19degrees.ngSweetAlert2',
    'scrumInCeres.services',
    'scrumInCeres.factories',
    'scrumInCeres.resources',
    'scrumInCeres.directives',
    'scrumInCeres.filters',
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
      name: 'backlogState',
      url: '/backlog',
      cache: false,
      templateUrl: 'templates/backlog.html',
      controller: 'BacklogController'
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

scrumInCeres.run(['$rootScope', '$timeout', '$q', 'AuthService', 'MeService', 'Alert', function($rootScope, $timeout, $q, AuthService, MeService, Alert) {
  AuthService.update();
  $rootScope.$on('userInfo.updated', function(evt, userInfo) {
    $rootScope.loggedUser = userInfo;
  });
  MeService.getInfo();
  $rootScope.currentController = null;
  $rootScope.filterObject = {'name': ''};
  $rootScope.search = {
    expression: '',
    fieldType: {type: 'name', name: 'By Name'}
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
    tasks: {type: 'tasks', name: 'By Task'},
    definition: {type: 'definitionOfDone', name: 'By Definition'}
  };

  $rootScope.storyFilterObjects = {
    name: {name: ''},
    statement: {statement: ''},
    tasks: {tasks: ''},
    definition: {definitionOfDone: ''}
  };

  $rootScope.itemsView = {mode: 'list'};

  $rootScope.filterByStoryType = function(type) {
    $rootScope.currentStoryTypeFilter = type;
    $rootScope.$broadcast('story.filter.type', type);
  };

  $rootScope.addNewStory = function() {
    $rootScope.$broadcast('story.add');
  };

  $rootScope.addNewSprint = function() {
    $rootScope.$broadcast('sprint.add');
  };

  $rootScope.goToCurrentSprintInTimeline = function() {
    $rootScope.$broadcast('currentSprint.select');
  };

  $rootScope.setStoryFilterTextType = function(type) {
    $rootScope.search.fieldType = $rootScope.storyFilterTextTypes[type];
  };

  $rootScope.searchStories = function() {
    $rootScope.storyFilterObjects[$rootScope.search.fieldType.type][$rootScope.search.fieldType.type] = $rootScope.search.expression;
    $rootScope.filterObject.filter = $rootScope.storyFilterObjects[$rootScope.search.fieldType.type];
  };

  $rootScope.showMyInfo = function() {
    Alert.itsOpenSourceDude();
  };

  Pusher.logToConsole = true;

  var pusher = new Pusher('cf7366082066d84f2706', {
    cluster: 'us2',
    encrypted: true
  });

  $rootScope.pusherSocketId = null;
  pusher.connection.bind('connected', function() {
    $rootScope.pusherSocketId = pusher.connection.socket_id;
  });

  var channel = pusher.subscribe('scruminceres');
  channel.bind('board', function(data) {
    $rootScope.$broadcast('board.{message}'.format(data), data);
  });

  channel.bind('backlog', function(data) {
    $rootScope.$broadcast('backlog.{message}'.format(data), data);
  });

  channel.bind('icebox', function(data) {
    $rootScope.$broadcast('icebox.{message}'.format(data), data);
  });
}]);
