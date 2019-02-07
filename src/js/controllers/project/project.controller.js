'use strict';

scrumInCeresControllers.controller('ProjectController', ['$rootScope', '$scope', '$uibModal', 'Notifier', 'Alert', 'HollydayService', 'Project', function($rootScope, $scope, $uibModal, Notifier, Alert, HollydayService, Project) {
  $rootScope.currentController = 'ProjectController';
  $rootScope.lateralMenuOpen = true;

  Alert.loading();

  $scope.search = {
    project: {name: '', description: ''}
  };
  $scope.canAddStoryTo = false;
  $scope.selectedProject = null;
  $scope.selectedSprint = null;
  $scope.selectedProjectOpened = false;
  $scope.projects = [];
  $scope.showIceboxStories = false;

  function loading() {
    Project.query(
      function(projects) {
        $scope.projects = projects;
        _.forEach($scope.projects, function(project) {
          HollydayService.setWorkingDays(project);
        });
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  }

  loading();

  function getModal(project) {
    return $uibModal.open({
      animation: true,
      backdrop: 'static',
      ariaLabelledBy: 'modalTitle',
      ariaDescribedBy: 'modalBody',
      templateUrl: 'templates/include/modal-form-project.html',
      controller: 'FormProjectController',
      size: 'lg',
      resolve: {
        projectModel: project
      }
    });
  }

  $scope.addingProject = function() {
    var addModal = getModal({
      name: null,
      slug: null,
      startDate: null,
      endDate: null,
      description: null
    });
    addModal.result.then(
      function(result) {
        HollydayService.setWorkingDays(result);
        $scope.projects.push(result);
        $scope.projects = _.orderBy($scope.projects, ['startDate'], ['asc']);
        Alert.randomSuccessMessage();
      },
      function() {
      }
    );
  };

  let editModal;
  $scope.editingProject = function(project) {
    $scope.selectedProject = project;
    if (editModal) {
      editModal.dismiss();
    }
    editModal = getModal({
      name: project.name,
      slug: project.slug,
      startDate: project.startDate,
      endDate: project.endDate,
      description: project.description
    });
    editModal.result.then(
      function(result) {
        $scope.selectedProject = project;
        project.name = result.name;
        project.slug = result.slug;
        project.startDate = result.startDate;
        project.endDate = result.endDate;
        project.description = result.description;
        HollydayService.setWorkingDays(project);
        $scope.projects = _.orderBy($scope.projects, ['startDate'], ['asc']);
        Alert.randomSuccessMessage();
      },
      function() {
        $scope.selectedProject = null;
      }
    );
  };

  $scope.openProject = function(project) {
    project.loading = true;
    $scope.selectedProject = project;
    $scope.selectedProjectOpened = true;

    Project.get(
      {projectId: project.id},

      function(result) {
        $scope.selectedProject.stories = result.stories;
        $scope.selectedProject.kanbans = result.kanbans;
        $scope.selectedProject.sprints = result.sprints;
        project.loading = false;
        $scope.$broadcast('projects.selectedProject', $scope.selectedProject);
      },

      function(error) {
        Alert.randomErrorMessage(error);
        project.loading = false;
      }
    )
  };

  $scope.closeProject = function() {
    $scope.selectedProject = null;
    $scope.selectedProjectOpened = false;
  };

  $scope.removeProject = function(project, $event) {
    $event.stopPropagation();
    Alert.warning(
      'WAAAAT?!?!',
      'Are you f#!%$ sure???',
      function(response) {
        if (response.value) {
          Project.delete(
            {id: project.id},

            function() {
              var index = _.findIndex($scope.projects, ['id', project.id]);
              $scope.projects.splice(index, 1);
              Alert.randomSuccessMessage();
            },

            function(error) {
              Alert.randomErrorMessage(error);
            }
          );
        }
      }
    );
  };

  $scope.$on('projects.toggleIceboxStoriesVisible', function() {
    $scope.showIceboxStories = !$scope.showIceboxStories;
    $scope.$broadcast('projects.selectedProject', $scope.selectedProject);
  });

  $scope.$on('projects.sendSelectedProject', function() {
    $scope.$broadcast('projects.selectedProject', $scope.selectedProject);
  });

  $scope.$on('projects.addingStoryToSelectedProject', function(ev, story) {
    $scope.$broadcast('projects.addStoryToSelectedProject', story);
  });

  $scope.$on('projects.selectingSprint', function(event, selectedSprint) {
    if (selectedSprint !== null && $scope.selectedSprint !== null && $scope.selectedSprint.id === selectedSprint.id) {
      return;
    }
    $scope.selectedSprint = selectedSprint;
    $scope.$broadcast('projects.selectedSprint', $scope.selectedSprint);
  });

  $scope.$on('projects.addingStoryToSelectedSprint', function(ev, story) {
    $scope.$broadcast('projects.addStoryToSelectedSprint', story);
  });
}]);
