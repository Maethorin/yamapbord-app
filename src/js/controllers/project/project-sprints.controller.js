'use strict';

scrumInCeresControllers.controller('SelectedProjectSprintsController', ['$rootScope', '$scope', 'Notifier', 'Alert', 'MeService', 'StoryService', 'HollydayService', 'ProjectStory', 'BacklogSprint', function($rootScope, $scope, Notifier, Alert, MeService, StoryService, HollydayService, ProjectStory, BacklogSprint) {
  $scope.imInIcebox = false;
  $scope.selectedProject = null;
  $scope.newSprints = [];

  $scope.$on('projects.selectedProject', function(event, selectedProject) {
    if ($scope.selectedProject !== null && $scope.selectedProject.id === selectedProject.id) {
      return;
    }
    $scope.selectedProject = selectedProject;
    groupStories();
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

  function updateWorkingDays(sprint) {
    HollydayService.setWorkingDays(sprint).then(
      function() {
        sprint.storiesPerDay = (sprint.sumStoriesPoints || 0) / sprint.workingDays;
      }
    );
  }

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
        sprint.startDate = moment(sprint.startDate).toDate();
        sprint.endDate = moment(sprint.endDate).toDate();
        $scope.changeStartDate(sprint, true);
        $scope.changeEndDate(sprint, true);
        sprint.isOpen = true;
        sprint.isLoaded = true;
        sprint.sumStoriesPoints = _.sumBy(sprint.stories, function(story) {
          return story.points || 0;
        });
        sprint.sumValuePoints = _.sumBy(sprint.stories, function(story) {
          return story.valuePoints || 0;
        });
        updateWorkingDays(sprint);
        delete sprint.loading;
      },

      function(error) {
        Alert.randomErrorMessage(error);
      }
    )
  };

  $scope.altInputFormats = ['d!/M!/yyyy', 'yyyy-M!-d!', 'dd MMM yyyy'];

  $scope.startDateOptions = {
    formatYear: 'yyyy',
    maxDate: new Date(2021, 12, 31),
    minDate: new Date(2017, 1, 1),
    startingDay: 1
  };

  $scope.endDateOptions = {
    formatYear: 'yyyy',
    maxDate: new Date(2021, 12, 31),
    minDate: new Date(2017, 1, 1),
    startingDay: 1
  };

  $scope.openStartDate = function(sprint) {
    sprint.startDateIsOpen = !sprint.startDateIsOpen;
  };

  $scope.openEndDate = function(sprint) {
    sprint.endDateIsOpen = !sprint.endDateIsOpen;
  };

  $scope.changeStartDate = function(sprint, noUpdate) {
    var startDate = moment(sprint.startDate).startOf('day');
    $scope.endDateOptions.minDate = startDate.add(1, 'days').toDate();
    if (noUpdate) {
      return;
    }
    updateWorkingDays(sprint);
  };

  $scope.changeEndDate = function(sprint, noUpdate) {
    var endDate = moment(sprint.endDate).startOf('day');
    $scope.startDateOptions.maxDate = endDate.add(-1, 'days').toDate();
    if (noUpdate) {
      return;
    }
    updateWorkingDays(sprint);
  };

  $scope.saveSprint = function(sprint, $index) {
    Notifier.warning('Saving sprint...');
    var sprintToSend = _.cloneDeep(sprint);
    sprint.updating = true;
    delete sprintToSend.isOpen;
    delete sprintToSend.isLoaded;
    delete sprintToSend.sumStoriesPoints;
    delete sprintToSend.sumValuePoints;
    delete sprintToSend.storiesPerDay;
    delete sprintToSend.workingDays;
    delete sprintToSend.endDateIsOpen;
    delete sprintToSend.startDateIsOpen;
    sprintToSend.stories = _.map(sprint.stories, 'id');
    if (sprint.id) {
      BacklogSprint.update(
        {id: sprint.id},
        sprintToSend,
        function() {
          delete sprint.updating;
          Notifier.success('Sprint saved!')
        },
        function(error) {
          Alert.randomErrorMessage(error);
          delete sprint.updating;
        }
      );
    }
    else {
      BacklogSprint.save(
        sprintToSend,
        function(result) {
          $scope.selectedProject.sprints.push(result);
          $scope.newSprints.splice($index, 1);
          // groupStories();
          Notifier.success('Sprint saved!')
        },
        function(error) {
          Alert.randomErrorMessage(error);
          delete sprint.updating;
        }
      );
    }
  };

  $scope.cancelNewSprint = function($index) {
    $scope.newSprints.splice($index, 1);
  };

  $scope.addNewSprintToSelectedProject = function() {
    var newSprint = {
      name: null,
      objective: null,
      startDate: null,
      endDate: null,
      points: null,
      status: 'PLAN',
      isPlanned: true,
      type: 'sprint',
      team: null,
      stories: [],
      project: {id: $scope.selectedProject.id}
    };

    newSprint.isOpen = true;
    newSprint.isLoaded = true;

    $scope.startDateOptions.maxDate = new Date(2021, 12, 31);
    $scope.startDateOptions.minDate = new Date(2017, 1, 1);

    $scope.endDateOptions.maxDate = new Date(2021, 12, 31);
    $scope.endDateOptions.minDate = new Date(2017, 1, 1);

    $scope.newSprints.unshift(newSprint);
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
