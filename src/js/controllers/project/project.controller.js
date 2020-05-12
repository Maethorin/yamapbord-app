'use strict';

scrumInCeresControllers.controller('ProjectController', ['$rootScope', '$scope', '$uibModal', 'Notifier', 'Alert', 'HollydayService', 'Project', function($rootScope, $scope, $uibModal, Notifier, Alert, HollydayService, Project) {
  $rootScope.currentController = 'ProjectController';
  $rootScope.lateralMenuOpen = true;

  Alert.loading();

  $scope.search = {
    project: {name: '', description: ''}
  };
  $scope.selectedProject = null;
  $scope.selectedSprint = null;
  $scope.selectedKanban = null;
  $scope.selectedProjectOpened = false;
  $scope.projects = [];
  $rootScope.showIceboxStories = false;

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
    _.map($scope.projects, function(project) {
      project.isOpen = false;
    });
    project.loading = true;
    $scope.selectedProject = project;
    $scope.selectedProjectOpened = true;
    Project.get(
      {projectId: project.id},

      function(result) {
        project.stories = result.stories;
        project.kanbans = result.kanbans;
        project.sprints = result.sprints;
        project.attachments = result.attachments;
        project.showIcebox = project.showIcebox === undefined ? true : project.showIcebox;
        project.showSprints = project.showSprints === undefined ? true : project.showSprints;
        project.showKanbans = project.showKanbans === undefined ? true : project.showKanbans;
        project.showAttachment = project.showAttachment === undefined ? false : project.showAttachment;
        project.isOpen = true;
        project.loading = false;
        $scope.$broadcast('projects.selectedProject', $scope.selectedProject);
      },

      function(error) {
        Alert.randomErrorMessage(error);
        project.loading = false;
      }
    )
  };

  $scope.toogleProjectPartVisible = function(project, part) {
    project['show{0}'.format([part])] = !project['show{0}'.format([part])];
  };

  $scope.closeProject = function(project) {
    $scope.selectedProject = null;
    $scope.selectedProjectOpened = false;
    project.isOpen = false;
  };

  $scope.removeProject = function(project, $event) {
    $event.stopPropagation();
    Alert.warning(
      'WAAAAT?!?!',
      'Are you f#!%$ sure??? This will really really remove completely and for EVER this project!',
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
    $rootScope.showIceboxStories = !$rootScope.showIceboxStories;
  });

  $scope.$on('projects.sendSelectedProject', function() {
    $scope.$broadcast('projects.selectedProject', $scope.selectedProject);
  });

  $scope.$on('projects.addingStoryToSelectedProject', function(ev, story) {
    $scope.$broadcast('projects.addStoryToSelectedProject', story);
  });

  $scope.$on('projects.selectingSprint', function(event, selectedSprint) {
    $scope.selectedSprint = selectedSprint;
    $scope.$broadcast('projects.selectedSprint', $scope.selectedSprint);
  });

  $scope.$on('projects.selectingKanban', function(event, selectedKanban) {
    $scope.selectedKanban = selectedKanban;
    $scope.$broadcast('projects.selectedKanban', $scope.selectedKanban);
  });

  $scope.$on('projects.addingStoryToSelectedSprint', function(ev, story) {
    $scope.$broadcast('projects.addStoryToSelectedSprint', story);
  });

  $scope.$on('projects.addingStoryToSelectedKanban', function(ev, story) {
    $scope.$broadcast('projects.addStoryToSelectedKanban', story);
  });

  $scope.$on('projects.storyRemovedFromProject', function(ev, story) {
    $scope.$broadcast('projects.movingStoryToIcebox', story);
  });

  $scope.$on('projects.storyRemovedFromSprint', function(ev, story) {
    $scope.$broadcast('projects.movingStoryToProjectIcebox', story);
  });

  $scope.$on('projects.storyRemovedFromKanban', function(ev, story) {
    $scope.$broadcast('projects.movingStoryToProjectIcebox', story);
  });
}]);
