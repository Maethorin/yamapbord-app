'use strict';

scrumInCeresControllers.controller('ProjectController', ['$rootScope', '$scope', '$uibModal', 'Notifier', 'Alert', 'HollydayService', 'Project', function($rootScope, $scope, $uibModal, Notifier, Alert, HollydayService, Project) {
  $rootScope.currentController = 'ProjectController';
  $rootScope.lateralMenuOpen = true;

  Alert.loading();

  $scope.search = {
    project: {name: '', description: ''}
  };
  $scope.imInIcebox = false;
  $scope.selectedProject = null;
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

scrumInCeresControllers.controller('SelectedProjectStoriesController', ['$rootScope', '$scope', 'Notifier', 'Alert', 'StoryService', 'ProjectStory', function($rootScope, $scope, Notifier, Alert, StoryService, ProjectStory) {
  $scope.imInIcebox = false;
  $scope.selectedProject = null;
  $scope.$on('projects.selectedProject', function(event, selectedProject) {
    if ($scope.selectedProject !== null && $scope.selectedProject.id === selectedProject.id) {
      return;
    }
    $scope.selectedProject = selectedProject;
    groupStories();
  });

  $scope.$on('projects.addStoryToSelectedProject', function(ev, story) {
    $scope.selectedProject.stories.push(story);
    groupStories();
  });

  $scope.porraAngular = {storyFilterIteration: null, moduleAcronym: '', orderStoryBy: null, groupStoryBy: null};
  $scope.storyFilter = {
    name: '',
    statement: ''
  };
  $scope.storiesFiltered = [];
  $scope.storyItemsSortableOptions = { containerPositioning: 'relative' };
  $scope.newStories = [];
  $scope.groupedStories = false;
  $scope.storiesGroupOpen = {};

  StoryService.prepareScopeToEditStory($scope);

  function groupStories() {
    if (!$scope.selectedProject) {
      return false;
    }
    $scope.groupedStories = false;
    if ($scope.porraAngular.groupStoryBy === 'module') {
      $scope.groupedStories = _.groupBy($scope.selectedProject.stories, 'moduleId');
    }
    if ($scope.porraAngular.groupStoryBy === 'module-epic') {
      $scope.groupedStories = [];
      var tempGroupStories = _.groupBy($scope.selectedProject.stories, 'moduleId');
      _.forEach(tempGroupStories, function(group) {
        $scope.groupedStories.push(
          {
            id: group[0].moduleId,
            isOpen: false,
            stories: _.groupBy(group, 'epicId')
          }
        );
      });
    }
    if ($scope.porraAngular.groupStoryBy === 'type') {
      $scope.groupedStories = _.groupBy($scope.selectedProject.stories, 'type');
    }
    if ($scope.porraAngular.groupStoryBy === 'status') {
      $scope.groupedStories = _.groupBy($scope.selectedProject.stories, 'status');
    }
  }

  $scope.$watch('porraAngular.groupStoryBy', groupStories);

  $scope.openGroupedStories = function(group) {
    group.isOpen = !group.isOpen;
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
        story.currentTab = story.currentTab ? story.currentTab : 0;
        story.newTaskVisible = false;
        story.newDefinitionVisible = false;
        story.newCommentVisible = false;
        story.newCommentType = null;
        story.newMergeRequestVisible = false;
        story.name = result.name;
        story.statement = result.statement;
        story.type = result.type;
        story.typeName = result.typeName;
        story.points = result.points;
        story.valuePoints = result.valuePoints;

        delete story.loading;
        StoryService.turnCompactStoryAsComplete(story, result);
      }
    )
  };

  $scope.undoStoryChanges = function(story) {
    story.isLoaded = false;
    $scope.selectStory(story);
  };

  $scope.saveStory = function(story, $index) {
    Notifier.warning('Saving story...');
    var storyToSend = _.cloneDeep(story);
    story.updating = true;
    delete storyToSend.isOpen;
    delete storyToSend.isLoaded;
    delete storyToSend.currentTab;
    delete storyToSend.newTaskVisible;
    delete storyToSend.newDefinitionVisible;
    delete storyToSend.newCommentVisible;
    delete storyToSend.newCommentType;
    delete storyToSend.newMergeRequestVisible;
    if (story.id) {
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
    }
    else {
      ProjectStory.save(
        {projectId: $scope.selectedProject.id},
        storyToSend,
        function(result) {
          $scope.selectedProject.stories.push(result);
          $scope.newStories.splice($index, 1);
          groupStories();
          Notifier.success('Story saved!')
        },
        function(error) {
          Alert.randomErrorMessage(error);
          delete story.updating;
        }
      );
    }
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

  $scope.saveStoryDefinitions = function(story) {
    Notifier.warning('Saving definitions...');
    story.updating = true;
    ProjectStory.update(
      {projectId: $scope.selectedProject.id, storyId: story.id},
      {'definitionOfDone': story.definitionOfDone},
      function() {
        delete story.updating;
        Notifier.success('Definitions saved!')
      },
      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    );
  };

  $scope.cancelNewStory = function($index) {
    $scope.newStories.splice($index, 1);
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

  $scope.addingExistingStoryToSelectedProject = function() {
    $scope.$emit('projects.toggleIceboxStoriesVisible');
  };

  $scope.addNewStoryToSelectedProject = function(storyType) {
    var newStory = $scope.addNewStory({project: $scope.selectedProject, type: storyType}, true);
    newStory.isOpen = true;
    newStory.isLoaded = true;
    newStory.currentTab = 0;
    newStory.newTaskVisible = false;
    newStory.newDefinitionVisible = false;
    newStory.newCommentVisible = false;
    newStory.newCommentType = null;
    newStory.newMergeRequestVisible = false;
    $scope.newStories.unshift(newStory);
  };

  $scope.openStoryFilter = function() {
    $scope.storyFilterIsOpen = !$scope.storyFilterIsOpen;
  };

  $scope.setIterationStoryFilter = function() {
    delete $scope.storyFilter.sprintId;
    delete $scope.storyFilter.kanbanId;
    console.log = $scope.porraAngular.storyFilterIteration;
    if ($scope.porraAngular.storyFilterIteration === 'icebox') {
      $scope.storyFilter.sprintId = null;
      $scope.storyFilter.kanbanId = null;
    }
    if ($scope.porraAngular.storyFilterIteration === 'sprint') {
      $scope.storyFilter.sprintId = '';
      $scope.storyFilter.kanbanId = null;
    }
    if ($scope.porraAngular.storyFilterIteration === 'kanban') {
      $scope.storyFilter.sprintId = null;
      $scope.storyFilter.kanbanId = '';
    }
  };

  $scope.selectModuleStoryFilter = function() {
    $scope.porraAngular.moduleAcronym = $rootScope.modulesNames[$scope.storyFilter.moduleId];
  };

  $scope.clearStoryFilter = function() {
    $scope.porraAngular.storyFilterIteration = null;
    $scope.porraAngular.moduleAcronym = '';

    $scope.storyFilter = {
      name: '',
      statement: ''
    };
  };

}]);

scrumInCeresControllers.controller('SelectedProjectSprintsController', ['$rootScope', '$scope', 'Notifier', 'Alert', 'StoryService', 'ProjectStory', 'BacklogSprint', function($rootScope, $scope, Notifier, Alert, StoryService, ProjectStory, BacklogSprint) {
  $scope.imInIcebox = false;
  $scope.selectedProject = null;
  $scope.$on('projects.selectedProject', function(event, selectedProject) {
    if ($scope.selectedProject !== null && $scope.selectedProject.id === selectedProject.id) {
      return;
    }
    $scope.selectedProject = selectedProject;
    groupStories();
  });


  $scope.openSprint = function(sprint) {
    if (sprint.isLoaded) {
      sprint.isOpen = !sprint.isOpen;
      return;
    }
    sprint.loading = true;

    BacklogSprint.get(
      {id: sprint.id},

      function(result) {
        sprint.stories = result.stories;
        sprint.isOpen = true;
        sprint.isLoaded = true;
        delete sprint.loading;
      },

      function(error) {
        Alert.randomErrorMessage(error);
      }
    )
  };

  $scope.$on('projects.addStoryToSelectedProject', function(ev, story) {
    $scope.selectedProject.stories.push(story);
    groupStories();
  });

  $scope.porraAngular = {storyFilterIteration: null, moduleAcronym: '', orderStoryBy: null, groupStoryBy: null};
  $scope.storyFilter = {
    name: '',
    statement: ''
  };
  $scope.storiesFiltered = [];
  $scope.storyItemsSortableOptions = { containerPositioning: 'relative' };
  $scope.newStories = [];
  $scope.groupedStories = false;
  $scope.storiesGroupOpen = {};

  StoryService.prepareScopeToEditStory($scope);

  function groupStories() {
    if (!$scope.selectedProject) {
      return false;
    }
    $scope.groupedStories = false;
    if ($scope.porraAngular.groupStoryBy === 'module') {
      $scope.groupedStories = _.groupBy($scope.selectedProject.stories, 'moduleId');
    }
    if ($scope.porraAngular.groupStoryBy === 'module-epic') {
      $scope.groupedStories = [];
      var tempGroupStories = _.groupBy($scope.selectedProject.stories, 'moduleId');
      _.forEach(tempGroupStories, function(group) {
        $scope.groupedStories.push(
          {
            id: group[0].moduleId,
            isOpen: false,
            stories: _.groupBy(group, 'epicId')
          }
        );
      });
    }
    if ($scope.porraAngular.groupStoryBy === 'type') {
      $scope.groupedStories = _.groupBy($scope.selectedProject.stories, 'type');
    }
    if ($scope.porraAngular.groupStoryBy === 'status') {
      $scope.groupedStories = _.groupBy($scope.selectedProject.stories, 'status');
    }
  }

  $scope.$watch('porraAngular.groupStoryBy', groupStories);

  $scope.openGroupedStories = function(group) {
    group.isOpen = !group.isOpen;
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
        story.currentTab = story.currentTab ? story.currentTab : 0;
        story.newTaskVisible = false;
        story.newDefinitionVisible = false;
        story.newCommentVisible = false;
        story.newCommentType = null;
        story.newMergeRequestVisible = false;
        story.name = result.name;
        story.statement = result.statement;
        story.type = result.type;
        story.typeName = result.typeName;
        story.points = result.points;
        story.valuePoints = result.valuePoints;

        delete story.loading;
        StoryService.turnCompactStoryAsComplete(story, result);
      }
    )
  };

  $scope.undoStoryChanges = function(story) {
    story.isLoaded = false;
    $scope.selectStory(story);
  };

  $scope.saveStory = function(story, $index) {
    Notifier.warning('Saving story...');
    var storyToSend = _.cloneDeep(story);
    story.updating = true;
    delete storyToSend.isOpen;
    delete storyToSend.isLoaded;
    delete storyToSend.currentTab;
    delete storyToSend.newTaskVisible;
    delete storyToSend.newDefinitionVisible;
    delete storyToSend.newCommentVisible;
    delete storyToSend.newCommentType;
    delete storyToSend.newMergeRequestVisible;
    if (story.id) {
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
    }
    else {
      ProjectStory.save(
        {projectId: $scope.selectedProject.id},
        storyToSend,
        function(result) {
          $scope.selectedProject.stories.push(result);
          $scope.newStories.splice($index, 1);
          groupStories();
          Notifier.success('Story saved!')
        },
        function(error) {
          Alert.randomErrorMessage(error);
          delete story.updating;
        }
      );
    }
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

  $scope.saveStoryDefinitions = function(story) {
    Notifier.warning('Saving definitions...');
    story.updating = true;
    ProjectStory.update(
      {projectId: $scope.selectedProject.id, storyId: story.id},
      {'definitionOfDone': story.definitionOfDone},
      function() {
        delete story.updating;
        Notifier.success('Definitions saved!')
      },
      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    );
  };

  $scope.cancelNewStory = function($index) {
    $scope.newStories.splice($index, 1);
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

  $scope.addingExistingStoryToSelectedProject = function() {
    $scope.$emit('projects.toggleIceboxStoriesVisible');
  };

  $scope.addNewStoryToSelectedProject = function(storyType) {
    var newStory = $scope.addNewStory({project: $scope.selectedProject, type: storyType}, true);
    newStory.isOpen = true;
    newStory.isLoaded = true;
    newStory.currentTab = 0;
    newStory.newTaskVisible = false;
    newStory.newDefinitionVisible = false;
    newStory.newCommentVisible = false;
    newStory.newCommentType = null;
    newStory.newMergeRequestVisible = false;
    $scope.newStories.unshift(newStory);
  };

  $scope.openStoryFilter = function() {
    $scope.storyFilterIsOpen = !$scope.storyFilterIsOpen;
  };

  $scope.setIterationStoryFilter = function() {
    delete $scope.storyFilter.sprintId;
    delete $scope.storyFilter.kanbanId;
    console.log = $scope.porraAngular.storyFilterIteration;
    if ($scope.porraAngular.storyFilterIteration === 'icebox') {
      $scope.storyFilter.sprintId = null;
      $scope.storyFilter.kanbanId = null;
    }
    if ($scope.porraAngular.storyFilterIteration === 'sprint') {
      $scope.storyFilter.sprintId = '';
      $scope.storyFilter.kanbanId = null;
    }
    if ($scope.porraAngular.storyFilterIteration === 'kanban') {
      $scope.storyFilter.sprintId = null;
      $scope.storyFilter.kanbanId = '';
    }
  };

  $scope.selectModuleStoryFilter = function() {
    $scope.porraAngular.moduleAcronym = $rootScope.modulesNames[$scope.storyFilter.moduleId];
  };

  $scope.clearStoryFilter = function() {
    $scope.porraAngular.storyFilterIteration = null;
    $scope.porraAngular.moduleAcronym = '';

    $scope.storyFilter = {
      name: '',
      statement: ''
    };
  };

}]);

scrumInCeresControllers.controller('IceboxProjectController', ['$rootScope', '$scope', 'Notifier', 'Alert', 'StoryService', 'ProjectStory', 'IceBox', function($rootScope, $scope, Notifier, Alert, StoryService, ProjectStory, IceBox) {
  $scope.imInIcebox = true;
  $scope.iceboxStories = [];
  $scope.iceboxLoading = true;
  $scope.selectedProject = null;
  $scope.$on('projects.selectedProject', function(event, selectedProject) {
    $scope.selectedProject = selectedProject;
  });
  $scope.$emit('projects.sendSelectedProject');
  $scope.porraAngular = {storyFilterIteration: null, moduleAcronym: '', orderStoryBy: null, groupStoryBy: null};
  $scope.storyFilter = {
    name: '',
    statement: ''
  };
  $scope.storiesFiltered = [];
  $scope.storyItemsSortableOptions = { containerPositioning: 'relative' };
  $scope.newStories = [];
  $scope.groupedStories = false;
  $scope.storiesGroupOpen = {};

  IceBox.query(
    function(stories) {
      $scope.iceboxStories = stories;
      groupStories();
      $scope.iceboxLoading = false;
    },

    function(error) {
      Alert.randomErrorMessage(error);
      $scope.iceboxLoading = false;
    }
  );

  StoryService.prepareScopeToEditStory($scope);

  function groupStories() {
    if (!$scope.iceboxStories) {
      return false;
    }
    $scope.groupedStories = false;
    if ($scope.porraAngular.groupStoryBy === 'module') {
      $scope.groupedStories = _.groupBy($scope.iceboxStories, 'moduleId');
    }
    if ($scope.porraAngular.groupStoryBy === 'module-epic') {
      $scope.groupedStories = [];
      var tempGroupStories = _.groupBy($scope.iceboxStories, 'moduleId');
      _.forEach(tempGroupStories, function(group) {
        $scope.groupedStories.push(
          {
            id: group[0].moduleId,
            isOpen: false,
            stories: _.groupBy(group, 'epicId')
          }
        );
      });
    }
    if ($scope.porraAngular.groupStoryBy === 'type') {
      $scope.groupedStories = _.groupBy($scope.iceboxStories, 'type');
    }
    if ($scope.porraAngular.groupStoryBy === 'status') {
      $scope.groupedStories = _.groupBy($scope.iceboxStories, 'status');
    }
  }

  $scope.$watch('porraAngular.groupStoryBy', groupStories);

  $scope.openGroupedStories = function(group) {
    group.isOpen = !group.isOpen;
  };

  $scope.selectStory = function(story) {
    if (story.isLoaded) {
      story.isOpen = !story.isOpen;
      return;
    }
    story.loading = true;
    IceBox.get(
      {id: story.id},

      function(result) {
        story.isOpen = true;
        story.isLoaded = true;
        story.currentTab = story.currentTab ? story.currentTab : 0;
        story.newTaskVisible = false;
        story.newDefinitionVisible = false;
        story.newCommentVisible = false;
        story.newCommentType = null;
        story.newMergeRequestVisible = false;
        story.name = result.name;
        story.statement = result.statement;
        story.type = result.type;
        story.typeName = result.typeName;
        story.points = result.points;
        story.valuePoints = result.valuePoints;

        delete story.loading;
        StoryService.turnCompactStoryAsComplete(story, result);
      }
    )
  };

  $scope.undoStoryChanges = function(story) {
    story.isLoaded = false;
    $scope.selectStory(story);
  };

  $scope.saveStory = function(story, $index) {
    Notifier.warning('Saving story...');
    var storyToSend = _.cloneDeep(story);
    story.updating = true;
    delete storyToSend.isOpen;
    delete storyToSend.isLoaded;
    delete storyToSend.currentTab;
    delete storyToSend.newTaskVisible;
    delete storyToSend.newDefinitionVisible;
    delete storyToSend.newCommentVisible;
    delete storyToSend.newCommentType;
    delete storyToSend.newMergeRequestVisible;

    if (story.id) {
      IceBox.update(
        {id: story.id},

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
    }
    else {
      IceBox.save(
        storyToSend,

        function(result) {
          $scope.iceboxStories.push(result);
          $scope.newStories.splice($index, 1);
          groupStories();
          Notifier.success('Story saved!')
        },

        function(error) {
          Alert.randomErrorMessage(error);
          delete story.updating;
        }
      );
    }
  };

  $scope.changeStoryTab = function(story, tabIndex) {
    story.currentTab = tabIndex;
  };

  $scope.saveStoryTasks = function(story) {
    Notifier.warning('Saving tasks...');
    story.updating = true;
    IceBox.update(
      {id: story.id},

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

  $scope.saveStoryDefinitions = function(story) {
    Notifier.warning('Saving definitions...');
    story.updating = true;
    IceBox.update(
      {id: story.id},

      {'definitionOfDone': story.definitionOfDone},

      function() {
        delete story.updating;
        Notifier.success('Definitions saved!')
      },

      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    );
  };

  $scope.cancelNewStory = function($index) {
    $scope.newStories.splice($index, 1);
  };

  $scope.addStoryToSelectedProject = function(story, stories) {
    Notifier.warning('Adding story...');
    story.updating = true;
    IceBox.update(
      {id: story.id},

      {projectId: $scope.selectedProject.id},

      function(result) {
        var indexFull = _.findIndex($scope.iceboxStories, ['id', story.id]);
        $scope.iceboxStories.splice(indexFull, 1);
        if (stories) {
          var indexGroup = _.findIndex(stories, ['id', story.id]);
          stories.splice(indexGroup, 1);
        }
        story.updating = false;
        $scope.$emit('projects.addingStoryToSelectedProject', story);
        Notifier.success('Story added!')
      },

      function(error) {
        Alert.randomErrorMessage(error);
      }
    );
  };

  $scope.addNewStoryToIcebox = function(storyType) {
    var newStory = $scope.addNewStory({type: storyType}, true);
    newStory.isOpen = true;
    newStory.isLoaded = true;
    newStory.currentTab = 0;
    newStory.newTaskVisible = false;
    newStory.newDefinitionVisible = false;
    newStory.newCommentVisible = false;
    newStory.newCommentType = null;
    newStory.newMergeRequestVisible = false;
    $scope.newStories.unshift(newStory);
  };

  $scope.openStoryFilter = function() {
    $scope.storyFilterIsOpen = !$scope.storyFilterIsOpen;
  };

  $scope.setIterationStoryFilter = function() {
    delete $scope.storyFilter.sprintId;
    delete $scope.storyFilter.kanbanId;
    console.log = $scope.porraAngular.storyFilterIteration;
    if ($scope.porraAngular.storyFilterIteration === 'icebox') {
      $scope.storyFilter.sprintId = null;
      $scope.storyFilter.kanbanId = null;
    }
    if ($scope.porraAngular.storyFilterIteration === 'sprint') {
      $scope.storyFilter.sprintId = '';
      $scope.storyFilter.kanbanId = null;
    }
    if ($scope.porraAngular.storyFilterIteration === 'kanban') {
      $scope.storyFilter.sprintId = null;
      $scope.storyFilter.kanbanId = '';
    }
  };

  $scope.selectModuleStoryFilter = function() {
    $scope.porraAngular.moduleAcronym = $rootScope.modulesNames[$scope.storyFilter.moduleId];
  };

  $scope.clearStoryFilter = function() {
    $scope.porraAngular.storyFilterIteration = null;
    $scope.porraAngular.moduleAcronym = '';

    $scope.storyFilter = {
      name: '',
      statement: ''
    };
  };

  $scope.closeIcebox = function() {
    $scope.$emit('projects.toggleIceboxStoriesVisible');
  };
}]);
