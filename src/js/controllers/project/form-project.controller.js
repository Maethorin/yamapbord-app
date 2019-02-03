'use strict';

scrumInCeresControllers.controller('FormProjectController', ['$scope', '$uibModalInstance', 'HollydayService', 'Alert', 'Project', 'projectModel', function($scope, $uibModalInstance, HollydayService, Alert, Project, projectModel) {
  $scope.project = projectModel;

  $scope.$watch('project.name', function(newValue) {
    if (!newValue) {
      return false;
    }
    $scope.project.slug = slug(newValue).toLowerCase();
  });

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.startDateOnSetTime = function() {
    $scope.$broadcast('start-date-changed');
    HollydayService.setWorkingDays($scope.project);
  };

  $scope.endDateOnSetTime = function() {
    $scope.$broadcast('end-date-changed');
    HollydayService.setWorkingDays($scope.project);
  };

  $scope.startDateBeforeRender = function($dates) {
    if ($scope.project.endDate) {
      var activeDate = moment($scope.project.endDate);

      $dates.filter(
        function(date) {
          return date.localDateValue() >= activeDate.valueOf()
        }
      )
        .forEach(
          function(date) {
            date.selectable = false;
          }
        );
    }
  };

  $scope.endDateBeforeRender = function($view, $dates) {
    if ($scope.project.startDate) {
      var activeDate = moment($scope.project.startDate).subtract(1, $view).add(1, 'minute');

      $dates.filter(
        function(date) {
          return date.localDateValue() <= activeDate.valueOf()
        }
      ).forEach(
        function (date) {
          date.selectable = false;
        }
      );
    }
  };

  $scope.save = function(formAdd) {
    if (formAdd.$invalid) {
      Alert.error('Oh Dude?!?', 'There are incomplete things! Cmon! Dont be laziie, Okay?');
      return false;
    }

    if ($scope.project.id) {
      Project.update(
        {projectId: $scope.project.id},

        $scope.project,

        function(result) {
          $uibModalInstance.close(result);
        },

        function(error) {
          Alert.randomErrorMessage(error);
        }
      );
      return;
    }

    Project.save(
      $scope.project,

      function(result) {
        $uibModalInstance.close(result);

      },

      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };
}]);
