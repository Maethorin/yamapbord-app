'use strict';

scrumInCeresFilters.filter('extractFilename', function() {
  return function(filename) {
    filename = filename.split('/');
    return filename[filename.length - 1];
  };
});
