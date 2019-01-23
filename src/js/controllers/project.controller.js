'use strict';

scrumInCeresControllers.controller('ProjectController', ['$rootScope', '$scope', '$uibModal', 'Alert', 'StoryService', 'HollydayService', 'Project', 'ProjectStory', function($rootScope, $scope, $uibModal, Alert, StoryService, HollydayService, Project, ProjectStory) {
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

  StoryService.prepareScopeToEditStory($scope);

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
        console.log('dismiss');
      }
    );
  };

  var editModal;
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
        $scope.selectedProject = project;
        console.log('dismiss');
      }
    );
  };

  $scope.openProject = function(project) {
    $scope.selectedProject = project;
    Project.get(
      {projectId: project.id},
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
