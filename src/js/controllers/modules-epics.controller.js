'use strict';

scrumInCeresControllers.controller('ModulesEpicsController', ['$rootScope', '$scope', 'Alert', 'Module', 'Epic', function($rootScope, $scope, Alert, Module, Epic) {
  $rootScope.currentController = 'ModulesEpicsController';

  Alert.loading();

  var modulesLoaded = false;
  var epicsLoaded = false;

  $scope.search = {
    module: '',
    epic: '',
    moduleEpic: ''
  };

  $scope.selectedModule = {};
  $scope.modules = [];
  $scope.epics = [];

  function unLoading() {
    if (modulesLoaded && epicsLoaded) {
      Alert.close();
    }
  }

  Module.query(
    function(modules) {
      $scope.modules = modules;
      modulesLoaded = true;
      unLoading();
    },
    function(error) {
      modulesLoaded = true;
      unLoading();
      Alert.randomErrorMessage(error);
    }
  );

  Epic.query(
    function(epics) {
      $scope.epics = epics;
      epicsLoaded = true;
      unLoading();
    },
    function(error) {
      epicsLoaded = true;
      unLoading();
      Alert.randomErrorMessage(error);
    }
  );

  $scope.selectModule = function(module) {
    $scope.selectedModule = module;
  };

}]);
