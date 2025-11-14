'use strict';

yamapBordControllers.controller('ModulesEpicsController', ['$rootScope', '$scope', '$uibModal', 'Alert', 'Module', 'Epic', function($rootScope, $scope, $uibModal, Alert, Module, Epic) {
  $rootScope.currentController = 'ModulesEpicsController';

  Alert.loading();

  var modulesLoaded = false;
  var epicsLoaded = false;

  $scope.search = {
    module: '',
    epic: '',
    moduleEpic: ''
  };

  $scope.selectedModule = null;
  $scope.selectedEpic = null;
  $scope.modules = [];
  $scope.epics = [];
  $scope.selectionStories = [];

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

  $scope.adding = function(what) {
    var addModal = $uibModal.open({
      animation: true,
      ariaLabelledBy: 'modalTitle',
      ariaDescribedBy: 'modalBody',
      templateUrl: 'templates/include/modal-add-module.html',
      controller: what === 'module' ? 'AddModuleController' : 'AddEpicController',
      size: 'sm'
    });

    addModal.result.then(
      function(result) {
        if (what === 'module') {
          $scope.modules.push(result);
          $scope.modules = _.sortBy($scope.modules, 'name');
        }
        else {
          $scope.epics.push(result);
          $scope.epics = _.sortBy($scope.epics, 'name');
        }
        Alert.randomSuccessMessage();
      },
      function() {
        console.log('dismiss');
      }
    );
  };

  $scope.selectModule = function(module) {
    $scope.selectedModule = module;
    $scope.selectionStories = [];
    Module.get(
      {id: module.id},
      function(result) {
        $scope.selectionStories = result.stories;
        $scope.selectedModule.epics = result.epics;
      }
    )
  };

  $scope.selectEpic = function(epic) {
    $scope.selectedEpic = epic;
    $scope.selectionStories = [];
    Epic.get(
      {id: epic.id},
      function(result) {
        $scope.selectionStories = result.stories;
      }
    )
  };

  $scope.addSelectedEpicToSelectedModule = function() {
    if (!_.find($scope.selectedModule.epics, {name: $scope.selectedEpic.name})) {
      $scope.selectedModule.epics.push($scope.selectedEpic);
      $scope.selectedModule.epics = _.sortBy($scope.selectedModule.epics, 'name');
    }
  };

  $scope.saveEpicsModule = function() {
    Module.update(
      {id: $scope.selectedModule.id},
      $scope.selectedModule,
      function(result) {
        Alert.randomSuccessMessage();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    )
  };

  $scope.removeEpicFromSelectedModule = function(epic) {
    var index = _.findIndex($scope.selectedModule.epics, ['id', epic.id]);
    $scope.selectedModule.epics.splice(index, 1);
  };

  $scope.removeModule = function(module, $event) {
    $event.stopPropagation();
    Alert.warning(
      'WAAAAT?!?!',
      'Are you f#!%$ sure???',
      function(response) {
        if (response.value) {
          Alert.itsOpenSourceDude();
          // Module.delete(
          //   {id: module.id},
          //   function() {
          //     var index = _.findIndex($scope.modules, ['id', module.id]);
          //     $scope.modules.splice(index, 1);
          //   }
          // );
        }
      }
    );
  };

  $scope.removeEpic = function(epic, $event) {
    $event.stopPropagation();
    Alert.warning(
      'WAAAAT?!?!',
      'Are you f#!%$ sure???',
      function(response) {
        if (response.value) {
          Alert.itsOpenSourceDude();
          // Epic.delete(
          //   {id: epic.id},
          //   function() {
          //     var index = _.findIndex($scope.epics, ['id', epic.id]);
          //     $scope.epics.splice(index, 1);
          //   }
          // );
        }
      }
    );
  };
}]);

yamapBordControllers.controller('AddModuleController', ['$scope', '$uibModalInstance', 'Alert', 'Module', function($scope, $uibModalInstance, Alert, Module) {
  $scope.isModule = true;
  $scope.model = {
    name: null,
    acronym: null
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.save = function(formAdd) {
    if (formAdd.$invalid) {
      Alert.error('Again?!?', 'We need a name for this module. HTH are we going to call it when need it?');
      return false;
    }

    Module.save(
      $scope.model,
      function(result) {
        $uibModalInstance.close(result);
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };
}]);

yamapBordControllers.controller('AddEpicController', ['$scope', '$uibModalInstance', 'Alert', 'Epic', function($scope, $uibModalInstance, Alert, Epic) {
  $scope.isModule = false;
  $scope.model = {
    name: null
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.save = function(formAdd) {
    if (formAdd.$invalid) {
      Alert.error('Again?!?', 'We need a name for this epic. HTH are we going to call it when need it?');
      return false;
    }

    Epic.save(
      $scope.model,
      function(result) {
        $uibModalInstance.close(result);
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };
}]);
