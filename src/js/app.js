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
    'ngScrollable',
    'ui.router',
    'ui.bootstrap',
    'ui.utils.masks',
    'ui.bootstrap.datetimepicker',
    'ui.dateTimeInput',
    'ui.checkbox',
    'as.sortable',
    '19degrees.ngSweetAlert2',
    'ngMaterial',
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
      name: 'homeState',
      url: '/',
      templateUrl: 'templates/home.html',
      controller: 'HomeController',
      cache: false,
      headers: {
        'Cache-Control' : 'no-cache'
      }
    })

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

  $urlRouterProvider.when('', '/');
}]);

scrumInCeres.run(['$rootScope', '$timeout', '$q', 'AuthService', 'MeService', 'Alert', 'Requester', 'Epic', 'Module', function($rootScope, $timeout, $q, AuthService, MeService, Alert, Requester, Epic, Module) {
  AuthService.update();
  $rootScope.lateralMenuOpen = false;

  $rootScope.toggleLateralMenu = function() {
    $rootScope.lateralMenuOpen = !$rootScope.lateralMenuOpen;
  };

  $rootScope.$on('userInfo.updated', function(evt, userInfo) {
    $rootScope.loggedUser = userInfo;
  });
  MeService.getInfo();
  $rootScope.currentController = null;
  $rootScope.currentStoryTypeFilter = null;
  $rootScope.storyTypes = [
    {code: 'FEA', name: 'Feature'},
    {code: 'BUG', name: 'Bug'},
    {code: 'CHO', name: 'Chore'},
    {code: 'TEC', name: 'Technical'}
  ];

  $rootScope.itemsView = {mode: 'list'};
  $rootScope.requesters = [];
  $rootScope.epics = [];
  $rootScope.modules = [];
  $rootScope.points = [0, 1, 2, 3, 5, 8, 13];
  $rootScope.pointsFilter = ['0', '1', '2', '3', '5', '8', '13'];

  Requester.query(
    function(response) {
      $rootScope.requesters = response;
    }
  );

  Epic.query(
    function(response) {
      $rootScope.epics = response;
      $rootScope.epicsNames = {};
      _.forEach($rootScope.epics, function(epic) {
        $rootScope.epicsNames[epic.id] = epic.name;
      });
    }
  );

  Module.query(
    function(response) {
      $rootScope.modules = response;
      $rootScope.modulesNames = {};
      _.forEach($rootScope.modules, function(module) {
        $rootScope.modulesNames[module.id] = module.name;
      });
    }
  );

  $rootScope.toggleFilterTimeline = function() {
    $rootScope.boardControlPanelButtonActive = !$rootScope.boardControlPanelButtonActive;
    $rootScope.$broadcast('board.openControlPanel');
  };

  $rootScope.setViewAs = function(mode) {
    $rootScope.itemsView.mode = mode;
  };

  $rootScope.addNewSprint = function() {
    $rootScope.$broadcast('sprint.add');
  };

  $rootScope.addNewKanban = function() {
    $rootScope.$broadcast('kanban.add');
  };

  $rootScope.startSearchStories = function($event) {
    if ($event.keyCode === 13) {
      $rootScope.searchStories();
    }
  };

  $rootScope.showMyInfo = function() {
    Alert.itsOpenSourceDude();
  };

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
