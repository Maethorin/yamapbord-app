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
  $scope.storyResource = {resource: IceBox, urlData: {}};
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
    $scope.selectingStory(story, IceBox, {storyId: story.id});
  };

  $scope.undoStoryChanges = function(story) {
    story.isLoaded = false;
    $scope.selectStory(story);
  };

  $scope.saveStory = function(story, $index) {
    if (story.id) {
      StoryService.updateStory(story, IceBox, {storyId: story.id});
      return;
    }
    StoryService.createNewStory(story, IceBox, {}).then(
      function(result) {
        $scope.iceboxStories.push(result);
        $scope.newStories.splice($index, 1);
        groupStories();
      },
      function(error) {
      }
    );
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

  $scope.cancelNewStory = function($index) {
    $scope.newStories.splice($index, 1);
  };

  $scope.addStoryToSelected = function(story, $index, stories) {
    Notifier.warning("Adding story to {name}'s Icebox...".format($scope.selectedProject));
    story.updating = true;
    IceBox.update(
      {storyId: story.id},

      {projectId: $scope.selectedProject.id},

      function(result) {
        const indexFull = _.findIndex($scope.iceboxStories, ['id', story.id]);
        $scope.iceboxStories.splice(indexFull, 1);
        if (stories) {
          const indexGroup = _.findIndex(stories, ['id', story.id]);
          stories.splice(indexGroup, 1);
        }
        $scope.$emit('projects.addingStoryToSelectedProject', story);
        delete story.updating;
        Notifier.success('Story added!')
      },

      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    );
  };

  $scope.addNewStoryToIcebox = function(storyType) {
    $scope.newStories.unshift($scope.addNewStory({type: storyType}, true));
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

  $scope.$on('projects.storyDeleted', function(event, storyDeleted) {
    const indexFull = _.findIndex($scope.iceboxStories, ['id', storyDeleted.id]);
    $scope.iceboxStories.splice(indexFull, 1);
    groupStories();
  });

  $scope.closeIcebox = function() {
    $scope.$emit('projects.toggleIceboxStoriesVisible');
  };
}]);
