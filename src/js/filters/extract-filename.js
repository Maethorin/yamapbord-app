'use strict';

yamapBordFilters.filter('extractFilename', function() {
  return function(filename) {
    filename = filename.split('/');
    return filename[filename.length - 1];
  };
});
