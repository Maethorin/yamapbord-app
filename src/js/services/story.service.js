'use strict';

scrumInCeresServices.service('StoryService', ['$q', '$rootScope', 'IceBox', function($q, $rootScope, IceBox) {
  var self = this;
  var filter = {};
  this.filterByType = function(type) {
    if (type !== null) {
      filter.type = type.code
    }
    else {
      delete filter.type;
    }
    return this.getStories();
  };

  this.getStories = function() {
    var result = $q.defer();
    IceBox.query(
      filter,
      function(response) {
        result.resolve(response);
      },
      function(error) {
        result.reject(error);
      }
    );
    return result.promise;
  };

  this.addToIceLog = function(newStory) {
    var result = $q.defer();
    IceBox.save(
      newStory,
      function() {
        self.getStories().then(
          function(stories) {
            result.resolve(stories);
          },
          function(error) {
            Alert.warning('Saved!', 'Story was created but could not update stories list. Plz refresh page.');
            result.resolve([]);
          }
        );
      },
      function(error) {
        result.reject(error);
      }
    );
    return result.promise;
  };

  this.updateInIceLog = function(story) {
    var result = $q.defer();
    IceBox.update(
      {id: story.id},
      story,
      function() {
        result.resolve();
      },
      function(error) {
        result.reject(error);
      }
    );
    return result.promise;
  };
}]);