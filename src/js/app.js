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
    'ngAria',
    'ngAnimate',
    'ngCookies',
    'ngScrollable',
    'ngFileUpload',
    'ui.router',
    'ui.bootstrap',
    'ui.utils.masks',
    'ui.bootstrap.datetimepicker',
    'ui.dateTimeInput',
    'ui.checkbox',
    'as.sortable',
    '19degrees.ngSweetAlert2',
    'ngMaterial',
    'multipleSelect',
    'scrumInCeres.services',
    'scrumInCeres.factories',
    'scrumInCeres.resources',
    'scrumInCeres.directives',
    'scrumInCeres.filters',
    'scrumInCeres.controllers'
  ]
);

scrumInCeres.constant('appConfig', {
  backendURL: '@@backendURL',
  pusherKey: '@@pusherKey',
  env: '@@env',
  pusherSocketId: null,
  pusher: null
});

scrumInCeres.config(['$httpProvider', '$stateProvider', '$locationProvider', '$urlRouterProvider', '$mdThemingProvider', 'appConfig', function($httpProvider, $stateProvider, $locationProvider, $urlRouterProvider, $mdThemingProvider, appConfig) {
  $httpProvider.interceptors.push('UpdateToken');
  moment.locale('pt-BR');
  $mdThemingProvider
    .theme('default')
    .dark()
    .primaryPalette('blue-grey')
    .accentPalette('green');

  Pusher.logToConsole = appConfig.env === 'development';

  var pusher = new Pusher(
    appConfig.pusherKey,
    {
      cluster: 'us2',
      encrypted: true
    }
  );

  pusher.connection.bind('connected', function() {
    appConfig.pusherSocketId = pusher.connection.socket_id;
  });
  appConfig.channel = pusher.subscribe('scruminceres');

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
      name: 'boardsState',
      url: '/board',
      templateUrl: 'templates/board.html',
      controller: 'BoardController',
      cache: false,
      headers: {
        'Cache-Control' : 'no-cache'
      }
    })

    .state({
      name: 'projectState',
      url: '/projects',
      templateUrl: 'templates/project.html',
      controller: 'ProjectController',
      cache: false,
      headers: {
        'Cache-Control' : 'no-cache'
      }
    })

    .state({
      name: 'boardState',
      url: '/board/:boardType/:boardId/:tabIndex',
      templateUrl: 'templates/board.html',
      controller: 'BoardController',
      cache: false,
      headers: {
        'Cache-Control' : 'no-cache'
      }
    })

    .state({
      name: 'storyBoardState',
      url: '/board/:boardType/:boardId/:tabIndex/stories/:storyId',
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
      name: 'modulesEpicsState',
      url: '/modules-epics',
      cache: false,
      templateUrl: 'templates/modules-epics.html',
      controller: 'ModulesEpicsController'
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

scrumInCeres.run(['$rootScope', '$timeout', '$q', 'appConfig', 'AuthService', 'MeService', 'Alert', 'Requester', 'Epic', 'Module', function($rootScope, $timeout, $q, appConfig, AuthService, MeService, Alert, Requester, Epic, Module) {
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
    {code: 'DRF', name: 'Draft'},
    {code: 'FEA', name: 'Feature'},
    {code: 'BUG', name: 'Bug'},
    {code: 'CHO', name: 'Chore'},
    {code: 'TEC', name: 'Technical'}
  ];

  $rootScope.storyStatus = [
    {code: "PLAN", name: 'Planned'},
    {code: "STAR", name: 'Started'},
    {code: "FINI", name: 'Finished'},
    {code: "RTSB", name: 'Ready to Sandbox'},
    {code: "INSB", name: 'In Sandbox'},
    {code: "RTST", name: 'Ready to Staging'},
    {code: "INST", name: 'In Staging'},
    {code: "RTDP", name: 'Ready to Deploy'},
    {code: "DPYD", name: 'Deployed'},
    {code: "ACCP", name: 'Accepted'},
    {code: "REJE", name: 'Rejected'}
  ];

  $rootScope.itemsView = {mode: 'list'};
  $rootScope.requesters = [];
  $rootScope.epics = [];
  $rootScope.modules = [];
  $rootScope.points = [0, 1, 2, 3, 5, 8, 13];
  $rootScope.pointsFilter = ['0', '1', '2', '3', '5', '8', '13'];
  $rootScope.newAttachmentFileTypeAccepts = {
    I: 'image/*',
    P: '.pdf',
    D: '.doc,.docx,.xls,.xlsx,.txt,',
    Z: '.zip,.rar,.tar-gz'
  };

  Requester.query(
    function(response) {
      $rootScope.requesters = response;
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


  Epic.query(
    function(response) {
      $rootScope.epics = response;
      $rootScope.epicsNames = {};
      _.forEach($rootScope.epics, function(epic) {
        $rootScope.epicsNames[epic.id] = epic.name;
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

  appConfig.channel.bind('board', function(data) {
    $rootScope.$broadcast('board.{message}'.format(data), data);
  });

  appConfig.channel.bind('backlog', function(data) {
    $rootScope.$broadcast('backlog.{message}'.format(data), data);
  });

  appConfig.channel.bind('icebox', function(data) {
    $rootScope.$broadcast('icebox.{message}'.format(data), data);
  });

  // const source = new EventSource("{backendURL}/subscribe".format(appConfig));
  // source.addEventListener('message', function(event) {
  //     console.log('message', JSON.parse(event.data))
  // }, false);

  // source.addEventListener(
  //   'board',
  //   function(event) {
      // console.log('board', JSON.parse(event.data));
      // const data = JSON.parse(event.data);
      // $rootScope.$broadcast('board.{message}'.format(data), data);
    // },
    // false
  // );

  // source.addEventListener(
  //   'backlog',
  //   function(event) {
  //     // console.log('backlog', JSON.parse(event.data));
  //     const data = JSON.parse(event.data);
  //     $rootScope.$broadcast('backlog.{message}'.format(data), data);
  //   },
  //   false
  // );

  // source.addEventListener(
  //   'icebox',
  //   function(event) {
  //     // console.log('icebox', JSON.parse(event.data));
  //     const data = JSON.parse(event.data);
  //     $rootScope.$broadcast('icebox.{message}'.format(data), data);
  //   },
  //   false
  // );
}]);
