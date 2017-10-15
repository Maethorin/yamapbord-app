'use strict';

scrumInCeresFilters.filter('numberOrText', function() {
  return function(number, text) {
    if (!text) {
      text = 'N'
    }
    return (number === undefined || number === null ? text : number);
  };
});
