'use strict';

yamapBordFilters.filter('formatDateString', function() {
  return function(dateAsString) {
    return moment(dateAsString).format("DD MMM YYYY - HH:mm");
  };
});
