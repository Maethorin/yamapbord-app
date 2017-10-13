'use strict';

scrumInCeresControllers.controller('IceBoxController', ['$rootScope', '$scope', 'Alert', 'IceBox', function($rootScope, $scope, Alert, IceBox) {
  $scope.points = [0, 1, 2, 3, 5, 8];
  $scope.storyTypes = [
    {code: 'FEA', name: 'Feature'},
    {code: 'BUG', name: 'Bug'},
    {code: 'CHO', name: 'Chore'},
    {code: 'TEC', name: 'Techinical'}
  ];
  $scope.completeStoryPopupOpened = false;
  $scope.selectedStory = null;

  IceBox.query(
    function(response) {
      $scope.stories = response;
    }
  );

  $scope.setStoryType = function(story, type) {
    story.typeCode = type.code;
    story.typeName = type.name;
  };

  $scope.selectStoryToEdit = function(story) {
    $scope.selectedStory = story;
    $scope.completeStoryPopupOpened = true;
  };

  $scope.saveSelectedStory = function() {
    $scope.completeStoryPopupOpened = false;
  };

  $scope.cancelSaveSelectedStory = function() {
    $scope.completeStoryPopupOpened = false;
  };
}]);
