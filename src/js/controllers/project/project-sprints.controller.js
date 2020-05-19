'use strict';

scrumInCeresControllers.controller('SelectedProjectSprintsController', ['$rootScope', '$scope', 'appConfig', 'Notifier', 'Alert', 'MeService', 'StoryService', 'HollydayService', 'ProjectStory', 'BacklogSprint', function($rootScope, $scope, appConfig, Notifier, Alert, MeService, StoryService, HollydayService, ProjectStory, BacklogSprint) {
  $scope.canAddStoryTo = false;
  $scope.canRemoveStoryFrom = true;
  $scope.removeStoryTitle = 'Remove story from selected sprint (back to Project Icebox)';
  $scope.selectedProject = null;
  $scope.selectedSprint = null;
  $scope.newSprints = [];
  $scope.storiesFiltered = [];
  $scope.storyItemsSortableOptions = { containerPositioning: 'relative' };
  $scope.storyResource = {resource: ProjectStory, urlData: {projectId: null}};

  StoryService.prepareScopeToEditStory($scope);

  $scope.$on('projects.selectedProject', function(event, selectedProject) {
    $scope.selectedProject = selectedProject;
    $scope.storyResource.urlData.projectId = selectedProject.id;
    $scope.columnName = "{name}'s Sprints".format(selectedProject);
  });

  $scope.$on('projects.addStoryToSelectedSprint', function(ev, story) {
    $scope.selectedSprint.stories.push(story);
    updateWorkingDays($scope.selectedSprint)
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
        sprint.sumStoriesPoints = _.sumBy(sprint.stories, function(story) {
          return story.points || 0;
        });
        sprint.sumValuePoints = _.sumBy(sprint.stories, function(story) {
          return story.valuePoints || 0;
        });
        sprint.storiesPerDay = 0;
        if (sprint.workingDays) {
          sprint.storiesPerDay = (sprint.sumStoriesPoints || 0) / sprint.workingDays;
        }
      }
    );
  }

  function updateSelectedSprint() {
    const sprintsOpened = _.filter($scope.selectedProject.sprints, 'isOpen');
    $scope.selectedSprint = null;
    if (sprintsOpened.length === 1) {
      $scope.selectedSprint = sprintsOpened[0];
      $scope.removeStoryTitle = 'Remove story from {0} (back to {1} Icebox)'.format([$scope.selectedSprint.name, $scope.selectedProject.name]);
    }
    $scope.$emit('projects.selectingSprint', $scope.selectedSprint);
  }

  $scope.openSprint = function(sprint) {
    if (sprint.isLoaded) {
      sprint.isOpen = !sprint.isOpen;
      updateSelectedSprint();
      return;
    }
    sprint.loading = true;

    BacklogSprint.get(
      {id: sprint.id},

      function(result) {
        sprint.name = result.name;
        sprint.objective = result.objective;
        sprint.status = result.status;
        sprint.team = result.team;
        sprint.stories = result.stories;
        sprint.startDate = moment(result.startDate).toDate();
        sprint.endDate = moment(result.endDate).toDate();
        $scope.changeStartDate(sprint, true);
        $scope.changeEndDate(sprint, true);
        sprint.isOpen = true;
        sprint.isLoaded = true;
        sprint.porraAngular = {storyFilterIsOpen: false, storyFilterIteration: null, moduleAcronym: '', orderStoryBy: null, groupStoryBy: null};
        sprint.newStories = [];
        sprint.storyFilter = {
          name: '',
          statement: ''
        };
        updateWorkingDays(sprint);
        updateSelectedSprint();
        delete sprint.loading;
      },

      function(error) {
        Alert.randomErrorMessage(error);
        delete sprint.loading;
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
    delete sprintToSend.porraAngular;
    delete sprintToSend.storyFilter;
    delete sprintToSend.newStories;

    sprintToSend.stories = _.map(sprint.stories, function(story) {
      return {id: story.id, points: story.points};
    });
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

  $scope.undoSprintChanges = function(sprint) {
    sprint.isLoaded = false;
    $scope.openSprint(sprint);
  };

  $rootScope.shouldReopenLateralMenu = false;
  $scope.toggleExpandSprintPanel = function() {
    $scope.selectedProject.sprintPanelExpanded = !$scope.selectedProject.sprintPanelExpanded;
    if ($scope.selectedProject.sprintPanelExpanded) {
      if ($rootScope.lateralMenuOpen) {
        $rootScope.lateralMenuOpen = false;
        $rootScope.shouldReopenLateralMenu = true;
      }
    }
    else {
      if ($rootScope.shouldReopenLateralMenu) {
        $rootScope.lateralMenuOpen = true;
        $rootScope.shouldReopenLateralMenu = false;
      }
    }
  }

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
    newSprint.porraAngular = {storyFilterIsOpen: false, storyFilterIteration: null, moduleAcronym: '', orderStoryBy: null, groupStoryBy: null};
    newSprint.storyFilter = {
      name: '',
      statement: ''
    };
    newSprint.newStories = [];

    $scope.startDateOptions.maxDate = new Date(2021, 12, 31);
    $scope.startDateOptions.minDate = new Date(2017, 1, 1);
    $scope.endDateOptions.maxDate = new Date(2021, 12, 31);
    $scope.endDateOptions.minDate = new Date(2017, 1, 1);
    updateWorkingDays(newSprint);
    $scope.newSprints.unshift(newSprint);
  };

  $scope.addNewStoryToSprint = function(storyType, sprint) {
    sprint.newStories.unshift(
      $scope.addNewStory(
        {project: $scope.selectedProject, type: storyType, iterationType: 'sprint', iteration: sprint},
        true
      )
    );
  };

  $scope.saveStory = function(story, $index, sprint) {
    if (story.id) {
      StoryService.updateStory(story, ProjectStory, {projectId: $scope.selectedProject.id, storyId: story.id}).then(
        function() {
          updateWorkingDays(sprint);
        },
        function(error) {
        }
      );
      return;
    }

    StoryService.createNewStory(story, ProjectStory, {projectId: $scope.selectedProject.id}).then(
      function(result) {
        sprint.stories.push(result);
        sprint.newStories.splice($index, 1);
        updateWorkingDays(sprint);
      },
      function(error) {
      }
    );
  };

  $scope.cancelNewStory = function($index, sprint) {
    sprint.newStories.splice($index, 1);
  };

  $scope.undoStoryChanges = function(story) {
    story.isLoaded = false;
    $scope.selectStory(story);
  };

  $scope.selectStory = function(story) {
    $scope.selectingStory(story, ProjectStory, {projectId: $scope.selectedProject.id, storyId: story.id});
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

  $scope.removeStoryFromSelected = function(story, stories, sprint) {
    Notifier.warning('Removing story from sprint...');
    story.updating = true;
    ProjectStory.update(
      {projectId: $scope.selectedProject.id, storyId: story.id},

      {sprintId: null},

      function() {
        const index = _.findIndex(sprint.stories, ['id', story.id]);
        sprint.stories.splice(index, 1);
        if (stories) {
          const indexGroup = _.findIndex(stories, ['id', story.id]);
          stories.splice(indexGroup, 1);
        }
        delete story.updating;
        updateWorkingDays(sprint);
        $scope.$emit('projects.storyRemovedFromSprint', story);
        Notifier.success('Story removed!');
      },

      function(error) {
        Alert.randomErrorMessage(error);
        delete story.updating;
      }
    )
  };

  $scope.$on('projects.storyDeleted', function(event, storyDeleted) {
    var selectedSprint = _.find($scope.selectedProject.sprints, ['id', storyDeleted.sprintId]);
    const indexFull = _.findIndex(selectedSprint.stories, ['id', storyDeleted.id]);
    selectedSprint.stories.splice(indexFull, 1);
    updateWorkingDays(selectedSprint)
  });

}]);
