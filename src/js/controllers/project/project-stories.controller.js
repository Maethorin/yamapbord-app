'use strict';

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
