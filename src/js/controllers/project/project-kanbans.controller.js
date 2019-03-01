'use strict';

scrumInCeresControllers.controller('SelectedProjectKanbansController', ['$rootScope', '$scope', 'appConfig', 'Notifier', 'Alert', 'MeService', 'StoryService', 'HollydayService', 'ProjectStory', 'BacklogKanban', function($rootScope, $scope, appConfig, Notifier, Alert, MeService, StoryService, HollydayService, ProjectStory, BacklogKanban) {
  $scope.canAddStoryTo = false;
  $scope.canRemoveStoryFrom = true;
  $scope.removeStoryTitle = 'Remove story from selected kanban (back to Project Icebox)';
  $scope.selectedProject = null;
  $scope.selectedKanban = null;
  $scope.newKanbans = [];
  $scope.storiesFiltered = [];
  $scope.kanbanStorySortableOptions = { containerPositioning: 'relative' };

  StoryService.prepareScopeToEditStory($scope);

  $scope.$on('projects.selectedProject', function(event, selectedProject) {
    $scope.selectedProject = selectedProject;
    $scope.columnName = "{name}'s Kanbans".format(selectedProject);
    // groupStories();
  });

  $scope.$on('projects.addStoryToSelectedKanban', function(ev, story) {
    $scope.selectedKanban.stories.push(story);
    // groupStories();
  });

  $scope.teams = [];
  MeService.getInfo().then(
    function(info) {
      $scope.teams = info.teams;
      if ($scope.teams == null || $scope.teams.length === 0) {
        $scope.teams = [info.team];
      }
    }
  );

  function updateSelectedKanban() {
    const kanbansOpened = _.filter($scope.selectedProject.kanbans, 'isOpen');
    $scope.selectedKanban = null;
    if (kanbansOpened.length === 1) {
      $scope.selectedKanban = kanbansOpened[0];
      $scope.removeStoryTitle = 'Remove story from {0} (back to {1} Icebox)'.format([$scope.selectedKanban.name, $scope.selectedProject.name]);
    }
    $scope.$emit('projects.selectingKanban', $scope.selectedKanban);
  }

  $scope.openKanban = function(kanban) {
    if (kanban.isLoaded) {
      kanban.isOpen = !kanban.isOpen;
      updateSelectedKanban();
      return;
    }
    kanban.loading = true;

    BacklogKanban.get(
      {id: kanban.id},

      function(result) {
        kanban.name = result.name;
        kanban.description = result.description;
        kanban.teams = result.teams;
        kanban.stories = result.stories;
        kanban.isOpen = true;
        kanban.isLoaded = true;
        kanban.porraAngular = {storyFilterIsOpen: false, storyFilterIteration: null, moduleAcronym: '', orderStoryBy: null, groupStoryBy: null};
        kanban.newStories = [];
        kanban.storyFilter = {
          name: '',
          statement: ''
        };
        updateSelectedKanban();
        delete kanban.loading;
      },

      function(error) {
        Alert.randomErrorMessage(error);
        delete kanban.loading;
      }
    )
  };


  $scope.saveKanban = function(kanban, $index) {
    Notifier.warning('Saving kanban...');
    var kanbanToSend = _.cloneDeep(kanban);
    kanban.updating = true;
    delete kanbanToSend.isOpen;
    delete kanbanToSend.isLoaded;
    delete kanbanToSend.porraAngular;
    delete kanbanToSend.storyFilter;
    delete kanbanToSend.newStories;
    delete kanbanToSend.createdAtObj;

    kanbanToSend.stories = _.map(kanban.stories, function(story) {
      return {id: story.id, points: story.points};
    });
    if (kanban.id) {
      BacklogKanban.update(
        {id: kanban.id},
        kanbanToSend,
        function() {
          delete kanban.updating;
          Notifier.success('Kanban saved!')
        },
        function(error) {
          Alert.randomErrorMessage(error);
          delete kanban.updating;
        }
      );
    }
    else {
      BacklogKanban.save(
        kanbanToSend,
        function(result) {
          $scope.selectedProject.kanbans.push(result);
          $scope.newKanbans.splice($index, 1);
          // groupStories();
          Notifier.success('Kanban saved!')
        },
        function(error) {
          Alert.randomErrorMessage(error);
          delete kanban.updating;
        }
      );
    }
  };

  $scope.cancelNewKanban = function($index) {
    $scope.newKanbans.splice($index, 1);
  };

  $scope.undoKanbanChanges = function(kanban) {
    kanban.isLoaded = false;
    $scope.openKanban(kanban);
  };

  $scope.addNewKanbanToSelectedProject = function() {
    var newKanban = {
      name: null,
      description: null,
      type: 'kanban',
      teams: [],
      stories: [],
      project: {id: $scope.selectedProject.id}
    };

    newKanban.isOpen = true;
    newKanban.isLoaded = true;
    newKanban.porraAngular = {storyFilterIsOpen: false, storyFilterIteration: null, moduleAcronym: '', orderStoryBy: null, groupStoryBy: null};
    newKanban.storyFilter = {
      name: '',
      statement: ''
    };
    newKanban.newStories = [];

    $scope.newKanbans.unshift(newKanban);
  };

  $scope.quantityOf = function(stories, status) {
    return _.filter(stories, ['status', status]).length;
  };

  $scope.addNewStoryToKanban = function(storyType, kanban) {
    kanban.newStories.unshift(
      $scope.addNewStory(
        {project: $scope.selectedProject, type: storyType, iterationType: 'kanban', iteration: kanban},
        true
      )
    );
  };

  $scope.saveStory = function(story, $index, kanban) {
    if (story.id) {
      StoryService.updateStory(story, ProjectStory, {projectId: $scope.selectedProject.id, storyId: story.id});
      return;
    }
    StoryService.createNewStory(story, ProjectStory, {projectId: $scope.selectedProject.id}).then(
      function(result) {
        kanban.stories.push(result);
        kanban.newStories.splice($index, 1);
        // groupStories();
      },
      function(error) {
      }
    );
  };

  $scope.cancelNewStory = function($index, kanban) {
    kanban.newStories.splice($index, 1);
  };

  $scope.undoStoryChanges = function(story) {
    story.isLoaded = false;
    $scope.selectStory(story);
  };

  $scope.selectStory = function(story) {
    $scope.selectingStory(story, ProjectStory, {projectId: $scope.selectedProject.id, storyId: story.id});
    // if (story.isLoaded) {
    //   story.isOpen = !story.isOpen;
    //   return;
    // }
    // story.loading = true;
    // ProjectStory.get(
    //   {projectId: $scope.selectedProject.id, storyId: story.id},
    //
    //   function(result) {
    //     story.isOpen = true;
    //     story.isLoaded = true;
    //     story.currentTab = story.currentTab ? story.currentTab : 0;
    //     story.newTaskVisible = false;
    //     story.newDefinitionVisible = false;
    //     story.newCommentVisible = false;
    //     story.newCommentType = null;
    //     story.newMergeRequestVisible = false;
    //     story.name = result.name;
    //     story.statement = result.statement;
    //     story.type = result.type;
    //     story.typeName = result.typeName;
    //     story.points = result.points;
    //     story.valuePoints = result.valuePoints;
    //
    //     delete story.loading;
    //     StoryService.turnCompactStoryAsComplete(story, result);
    //   }
    // )
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

  $scope.removeStoryFromSelected = function(story, stories, kanban) {
    Notifier.warning('Removing story from kanban...');
    story.updating = true;
    ProjectStory.update(
      {projectId: $scope.selectedProject.id, storyId: story.id},

      {kanbanId: null},

      function() {
        const index = _.findIndex(kanban.stories, ['id', story.id]);
        kanban.stories.splice(index, 1);
        if (stories) {
          const indexGroup = _.findIndex(stories, ['id', story.id]);
          stories.splice(indexGroup, 1);
        }
        delete story.updating;
        updateWorkingDays(kanban);
        $scope.$emit('projects.storyRemovedFromKanban', story);
        Notifier.success('Story removed!');
      },

      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    )
  };





  $scope.groupedStories = false;
  $scope.storiesGroupOpen = {};


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


  $scope.openGroupedStories = function(group) {
    group.isOpen = !group.isOpen;
  };

}]);
