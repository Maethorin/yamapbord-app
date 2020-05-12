'use strict';

scrumInCeresControllers.controller('SelectedProjectStoriesController', ['$rootScope', '$scope', 'appConfig', 'Notifier', 'Alert', 'StoryService', 'ProjectStory', function($rootScope, $scope, appConfig, Notifier, Alert, StoryService, ProjectStory) {
  $scope.canAddStoryTo = false;
  $scope.canRemoveStoryFrom = true;
  $scope.addStoryTitle = 'Add story to selected sprint';
  $scope.selectedProject = null;
  $scope.selectedSprint = null;
  $scope.storyResource = {resource: ProjectStory, urlData: {projectId: null}};

  $scope.$on('projects.selectedProject', function(event, selectedProject) {
    $scope.selectedProject = selectedProject;
    $scope.storyResource.urlData.projectId = selectedProject.id;
    $scope.columnName = "{name}'s Stories in Icebox".format(selectedProject);
    $scope.removeStoryTitle = 'Remove story from {name} (back to Icebox)'.format($scope.selectedProject);
    groupStories();
  });

  $scope.$on('projects.addStoryToSelectedProject', function(ev, story) {
    $scope.selectedProject.stories.push(story);
    groupStories();
  });

  $scope.$on('projects.selectedSprint', function(event, selectedSprint) {
    $scope.selectedSprint = selectedSprint;
    $scope.canAddStoryTo = ($scope.selectedSprint !== null && $scope.selectedKanban === null) || ($scope.selectedSprint === null && $scope.selectedKanban !== null);
    $scope.addStoryTitle = $scope.canAddStoryTo ? 'Add story to {name}'.format(selectedSprint) : 'Add story to selected sprint';
  });

  $scope.$on('projects.selectedKanban', function(event, selectedKanban) {
    $scope.selectedKanban = selectedKanban;
    $scope.canAddStoryTo = ($scope.selectedSprint !== null && $scope.selectedKanban === null) || ($scope.selectedSprint === null && $scope.selectedKanban !== null);
    $scope.addStoryTitle = $scope.canAddStoryTo ? 'Add story to {name}'.format(selectedKanban) : 'Add story to selected kanban';
  });

  $scope.$on('projects.movingStoryToProjectIcebox', function(ev, story) {
    $scope.selectedProject.stories.push(story);
    groupStories();
  });

  $scope.porraAngular = {storyFilterIsOpen: false, storyFilterIteration: null, moduleAcronym: '', orderStoryBy: null, groupStoryBy: null};
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
    $scope.selectingStory(story, ProjectStory, {projectId: $scope.selectedProject.id, storyId: story.id});
  };

  $scope.undoStoryChanges = function(story) {
    story.isLoaded = false;
    $scope.selectStory(story);
  };

  $scope.saveStory = function(story, $index) {
    if (story.id) {
      StoryService.updateStory(story, ProjectStory, {projectId: $scope.selectedProject.id, storyId: story.id});
      return;
    }
    StoryService.createNewStory(story, ProjectStory, {projectId: $scope.selectedProject.id}).then(
      function(result) {
        $scope.selectedProject.stories.push(result);
        $scope.newStories.splice($index, 1);
        groupStories();
      },
      function(error) {
      }
    );
  };

  $scope.cancelNewStory = function($index) {
    $scope.newStories.splice($index, 1);
  };

  $scope.changeStoryTab = function(story, tabIndex) {
    story.currentTab = tabIndex;
  };

  $scope.saveStoryTasks = function(story) {
    $scope.saveSelectedStoryTasks(story, ProjectStory, {projectId: $scope.selectedProject.id, storyId: story.id});
  };

  $scope.saveStoryDefinitionOfDone = function(story) {
    $scope.saveSelectedStoryDefinitionOfDone(story, ProjectStory, {projectId: $scope.selectedProject.id, storyId: story.id});
  };

  $scope.saveStoryComments = function(story) {
    $scope.saveSelectedStoryComments(
      story,
      ProjectStory,
      {projectId: $scope.selectedProject.id, storyId: story.id},
      '{0}/users/me/projects/{1}/stories/{2}'.format([appConfig.backendURL, $scope.selectedProject.id, story.id])
    );
  };

  $scope.saveStoryMergeRequests = function(story) {
    $scope.saveSelectedStoryMergeRequests(story, ProjectStory, {projectId: $scope.selectedProject.id, storyId: story.id});
  };

  $scope.removeStoryFromSelected = function(story, stories) {
    Notifier.warning('Removing story...');
    story.updating = true;
    ProjectStory.delete(
      {projectId: $scope.selectedProject.id, storyId: story.id},

      function() {
        const index = _.findIndex($scope.selectedProject.stories, ['id', story.id]);
        $scope.selectedProject.stories.splice(index, 1);
        if (stories) {
          const indexGroup = _.findIndex(stories, ['id', story.id]);
          stories.splice(indexGroup, 1);
        }
        delete story.updating;
        $scope.$emit('projects.storyRemovedFromProject', story);
        Notifier.success('Story removed!');
      },

      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    )
  };

  $scope.addingExistingStoryToSelectedProject = function() {
    $scope.$emit('projects.toggleIceboxStoriesVisible');
  };

  $scope.addNewStoryToSelectedProject = function(storyType) {
    $scope.newStories.unshift(
      $scope.addNewStory({project: $scope.selectedProject, type: storyType}, true)
    );
  };

  $scope.selectModuleStoryFilter = function() {
    $scope.porraAngular.moduleAcronym = $rootScope.modulesNames[$scope.storyFilter.moduleId];
  };

  $scope.addStoryToSelected = function(story, stories) {
    var iteration = $scope.selectedSprint || $scope.selectedKanban;
    Notifier.warning('Adding story to {name}...'.format(iteration));
    var isSprint = iteration.type === 'sprint';
    var toSend = isSprint ? {sprintId: iteration.id} : {kanbanId: iteration.id};
    story.updating = true;
    ProjectStory.update(
      {projectId: $scope.selectedProject.id, storyId: story.id},

      toSend,

      function(result) {
        const indexFull = _.findIndex($scope.selectedProject.stories, ['id', story.id]);
        $scope.selectedProject.stories.splice(indexFull, 1);
        if (stories) {
          const indexGroup = _.findIndex(stories, ['id', story.id]);
          stories.splice(indexGroup, 1);
        }
        delete story.updating;
        $scope.$emit('projects.addingStoryToSelected{0}'.format([(isSprint ? 'Sprint' : 'Kanban')]), story);
        Notifier.success('Story added!')
      },

      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    );
  };

  $scope.$on('projects.storyDeleted', function(event, storyDeleted) {
    const indexFull = _.findIndex($scope.selectedProject.stories, ['id', storyDeleted.id]);
    $scope.selectedProject.stories.splice(indexFull, 1);
    groupStories();
  });

}]);
