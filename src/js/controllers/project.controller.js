'use strict';

scrumInCeresControllers.controller('ProjectController', ['$rootScope', '$scope', '$uibModal', 'Notifier', 'Alert', 'StoryService', 'HollydayService', 'Project', 'ProjectStory', function($rootScope, $scope, $uibModal, Notifier, Alert, StoryService, HollydayService, Project, ProjectStory) {
  $rootScope.currentController = 'ProjectController';
  $rootScope.lateralMenuOpen = true;

  Alert.loading();

  $scope.search = {
    project: {name: '', description: ''},
    story: {name: '', statement: ''}
  };

  $scope.selectedProject = null;
  $scope.selectedProjectOpened = false;
  $scope.projects = [];

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
        $scope.selectedProject = null;
        console.log('dismiss');
      }
    );
  };

  $scope.openProject = function(project) {
    $scope.selectedProject = project;
    $scope.selectedProjectOpened = true;

    Project.get(
      {projectId: project.id},
      function(result) {
        $scope.selectedProject.stories = result.stories;
        $scope.selectedProject.kanbans = result.kanbans;
        $scope.selectedProject.sprints = result.sprints;
      }
    )
  };

  $scope.closeProject = function() {
    $scope.selectedProject = null;
    $scope.selectedProjectOpened = false;
  };

  $scope.undoStoryChanges = function(story) {
    story.isLoaded = false;
    $scope.selectStory(story);
  };

  $scope.saveStory = function(story) {
    Notifier.warning('Saving story...');
    var storyToSend = _.cloneDeep(story);
    story.updating = true;
    delete storyToSend.isOpen;
    delete storyToSend.isLoaded;
    delete storyToSend.currentTab;
    delete storyToSend.newTaskVisible;

    ProjectStory.update(
      {projectId: $scope.selectedProject.id, storyId: story.id},
      storyToSend,
      function() {
        delete story.updating;
        Notifier.success('Story saved!')
      },
      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    );
  };

  $scope.selectStory = function(story) {
    if (story.isLoaded) {
      story.isOpen = !story.isOpen;
      return;
    }
    story.loading = true;
    ProjectStory.get(
      {projectId: $scope.selectedProject.id, storyId: story.id},

      function(result) {
        story.isOpen = true;
        story.isLoaded = true;
        story.currentTab = 0;
        story.newTaskVisible = false;
        delete story.loading;
        StoryService.turnCompactStoryAsComplete(story, result);
      }
    )
  };

  $scope.changeStoryTab = function(story, tabIndex) {
    story.currentTab = tabIndex;
  };

  $scope.saveStoryTasks = function(story) {
    Notifier.warning('Saving tasks...');
    story.updating = true;
    ProjectStory.update(
      {projectId: $scope.selectedProject.id, storyId: story.id},
      {'tasks': story.tasks},
      function() {
        delete story.updating;
        Notifier.success('Tasks saved!')
      },
      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    );
  };

  $scope.addStoryToSelectedProject = function(story) {
    if (_.find($scope.selectedProject.stories, {id: story.id})) {
      return false;
    }
    Alert.loading();
    ProjectStory.save(
      {projectId: $scope.selectedProject.id},

      {storyId: story.id},

      function(result) {
        $scope.selectedProject.stories.push(story);
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
