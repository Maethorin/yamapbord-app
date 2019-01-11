'use strict';

scrumInCeresControllers.controller('ModulesEpicsController', ['$rootScope', '$scope', '$uibModal', 'Alert', 'Module', 'Epic', function($rootScope, $scope, $uibModal, Alert, Module, Epic) {
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

  function loading(who) {
    if (who === undefined || who === 'modules') {
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
    }

    if (who === undefined || who === 'epics') {
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
    }
  }

  loading();

  $scope.addingModule = function() {
    var modalAddModule = $uibModal.open({
      animation: true,
      ariaLabelledBy: 'modalTitle',
      ariaDescribedBy: 'modalBody',
      templateUrl: 'templates/include/modal-add-module.html',
      controller: 'AddModuleController',
      size: 'sm'
    });

    modalAddModule.result.then(
      function(module) {
        $scope.modules.push(module);
        $scope.modules = _.sortBy($scope.modules, 'name');
      },
      function() {
        console.log('dismiss');
      }
    );
  };

  $scope.selectModule = function(module) {
    $scope.selectedModule = module;
  };

}]);

scrumInCeresControllers.controller('AddModuleController', ['$scope', '$uibModalInstance', 'Alert', 'Module', function($scope, $uibModalInstance, Alert, Module) {
  $scope.module = {
    name: null,
    acronym: null
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.saveModule = function(formAddModule) {
    if (formAddModule.$invalid) {
      Alert.error('Again?!?', 'We need a name for this module. HTH are we going to call it when need it?');
      return false;
    }

    Module.save(
      $scope.module,
      function(result) {
        $uibModalInstance.close(result);
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    )
  }
}]);
