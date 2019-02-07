'use strict';

scrumInCeresControllers.controller('IceboxProjectController', ['$rootScope', '$scope', 'Notifier', 'Alert', 'StoryService', 'ProjectStory', 'IceBox', function($rootScope, $scope, Notifier, Alert, StoryService, ProjectStory, IceBox) {
  $scope.canAddStoryTo = true;
  $scope.canRemoveStoryFrom = false;
  $scope.addStoryTitle = "Add story to Selected Project's Icebox";
  $scope.iceboxStories = [];
  $scope.iceboxLoading = true;
  $scope.selectedProject = null;

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

  $scope.$on('projects.selectedProject', function(event, selectedProject) {
    $scope.selectedProject = selectedProject;
    $scope.addStoryTitle = "Add story to {name}'s Icebox".format(selectedProject);
  });

  $scope.$on('projects.movingStoryToIcebox', function(ev, story) {
    $scope.iceboxStories.push(story);
    groupStories();
  });

  $scope.$emit('projects.sendSelectedProject');

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

  $scope.addStoryToSelected = function(story, $index, stories) {
    Notifier.warning("Adding story to {name}'s Icebox...".format($scope.selectedProject));
    story.updating = true;
    IceBox.update(
      {id: story.id},

      {projectId: $scope.selectedProject.id},

      function(result) {
        const indexFull = _.findIndex($scope.iceboxStories, ['id', story.id]);
        $scope.iceboxStories.splice(indexFull, 1);
        if (stories) {
          const indexGroup = _.findIndex(stories, ['id', story.id]);
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
