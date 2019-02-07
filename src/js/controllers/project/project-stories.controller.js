'use strict';

scrumInCeresControllers.controller('SelectedProjectStoriesController', ['$rootScope', '$scope', 'Notifier', 'Alert', 'StoryService', 'ProjectStory', function($rootScope, $scope, Notifier, Alert, StoryService, ProjectStory) {
  $scope.canAddStoryTo = false;
  $scope.canRemoveStoryFrom = true;
  $scope.addStoryTitle = 'Add story to selected sprint';
  $scope.selectedProject = null;
  $scope.selectedSprint = null;
  $scope.$on('projects.selectedProject', function(event, selectedProject) {
    if ($scope.selectedProject !== null && $scope.selectedProject.id === selectedProject.id) {
      return;
    }
    $scope.selectedProject = selectedProject;
    $scope.columnName = "{name}'s Stories in Icebox".format(selectedProject);
    $scope.removeStoryTitle = 'Remove story from {name} (back to Icebox)'.format($scope.selectedProject);
    groupStories();
  });

  $scope.$on('projects.addStoryToSelectedProject', function(ev, story) {
    $scope.selectedProject.stories.push(story);
    groupStories();
  });

  $scope.$on('projects.selectedSprint', function(event, selectedSprint) {
    if (selectedSprint !== null && $scope.selectedSprint !== null && $scope.selectedSprint.id === selectedSprint.id) {
      return;
    }
    $scope.selectedSprint = selectedSprint;
    $scope.canAddStoryTo = selectedSprint !== null;
    $scope.addStoryTitle = $scope.canAddStoryTo ? 'Add story to {name}'.format(selectedSprint) : 'Add story to selected sprint';
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

  $scope.selectModuleStoryFilter = function() {
    $scope.porraAngular.moduleAcronym = $rootScope.modulesNames[$scope.storyFilter.moduleId];
  };

  $scope.addStoryToSelected = function(story, stories) {
    Notifier.warning('Adding story to {name}...'.format($scope.selectedSprint));
    story.updating = true;
    ProjectStory.update(
      {projectId: $scope.selectedProject.id, storyId: story.id},

      {sprintId: $scope.selectedSprint.id},

      function(result) {
        const indexFull = _.findIndex($scope.selectedProject.stories, ['id', story.id]);
        $scope.selectedProject.stories.splice(indexFull, 1);
        if (stories) {
          const indexGroup = _.findIndex(stories, ['id', story.id]);
          stories.splice(indexGroup, 1);
        }
        delete story.updating;
        $scope.$emit('projects.addingStoryToSelectedSprint', story);
        Notifier.success('Story added!')
      },

      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    );
  };
}]);
