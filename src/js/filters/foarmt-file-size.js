'use strict';

yamapBordFilters.filter('formatFileSize', function() {
  var units = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  return function(bytes, precision) {
    if (isNaN(parseFloat(bytes))) {
        return "-";
    }
    if (bytes < 1) {
        return "0 B";
    }
    if (isNaN(precision)) {
        precision = 1;
    }

    var unitIndex = Math.floor(Math.log(bytes) / Math.log(1000));
    var value = bytes / Math.pow(1000, unitIndex);
    return value.toFixed(precision) + " " + units[unitIndex];
  };
});
