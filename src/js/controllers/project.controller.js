'use strict';

scrumInCeresControllers.controller('ProjectController', ['$rootScope', '$scope', '$uibModal', 'Alert', 'StoryService', 'Project', 'ProjectStory', function($rootScope, $scope, $uibModal, Alert, StoryService, Project, ProjectStory) {
  $rootScope.currentController = 'ProjectController';
  $rootScope.lateralMenuOpen = true;

  Alert.loading();

  var modulesLoaded = false;
  var epicsLoaded = false;

  $scope.search = {
    project: {name: '', description: ''},
    story: {name: '', statement: ''}
  };

  $scope.selectedProject = null;
  $scope.projects = [];
  $scope.selectedStory = null;

  function loading(who) {
    Project.query(
      function(projects) {
        $scope.projects = projects;
        Alert.close();
      },
      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  }

  loading();

  StoryService.prepareScopeToEditStory($scope);

  $scope.addingProject = function() {
    var addModal = $uibModal.open({
      animation: true,
      ariaLabelledBy: 'modalTitle',
      ariaDescribedBy: 'modalBody',
      templateUrl: 'templates/include/modal-add-project.html',
      controller: 'AddProjectController',
      size: 'lg'
    });

    addModal.result.then(
      function(result) {
        $scope.projects.push(result);
        $scope.projects = _.sortBy($scope.projects, 'startDate');
        Alert.randomSuccessMessage();
      },
      function() {
        console.log('dismiss');
      }
    );
  };

  $scope.selectProject = function(project) {
    $scope.selectedProject = project;
    Project.get(
      {id: project.id},
      function(result) {
        $scope.selectedProject.stories = result.stories;
        $scope.selectedProject.kanbans = result.kanbans;
        $scope.selectedProject.sprints = result.sprints;
      }
    )
  };

  $scope.selectStory = function(story) {
    $scope.selectedStory = story;
    ProjectStory.get(
      {projectId: $scope.selectedProject.id, storyId: story.id},

      function(result) {
        StoryService.turnCompactStoryAsComplete($scope.selectedStory, result);
      }
    )
  };

  $scope.addSelectedStoryToSelectedProject = function() {
    if (_.find($scope.selectedProject.stories, {id: $scope.selectedStory.id})) {
      return false;
    }
    Alert.loading();
    ProjectStory.save(
      {projectId: $scope.selectedProject.id},

      {storyId: $scope.selectedStory.id},

      function(result) {
        $scope.selectedProject.stories.push($scope.selectedStory);
        $scope.selectedProject.stories = _.sortBy($scope.selectedProject.stories, 'name');
        Alert.randomSuccessMessage();
      },

      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.addNewStoryToSelectedProject = function() {
    $scope.addNewStory({project: $scope.selectedProject});
  };

  $scope.removeStoryFromSelectedProject = function(story) {
    ProjectStory.delete(
      {projectId: $scope.selectedProject.id, storyId: story.id},

      function() {
        var index = _.findIndex($scope.selectedProject.stories, ['id', story.id]);
        $scope.selectedProject.stories.splice(index, 1);
        Alert.randomSuccessMessage();
      },

      function(error) {
        Alert.randomErrorMessage(error);
      }
    )
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

}]);

scrumInCeresControllers.controller('AddProjectController', ['$scope', '$uibModalInstance', 'Alert', 'Module', function($scope, $uibModalInstance, Alert, Module) {
  $scope.project = {
    name: null,
    slug: null,
    startDate: null,
    endDate: null,
    description: null
  };

  $scope.$watch('project.name', function(newValue) {
    if (!newValue) {
      return false;
    }
    $scope.project.slug = slug(newValue);
  });

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
