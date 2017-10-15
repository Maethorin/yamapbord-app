'use strict';

scrumInCeresFilters.filter('limitWithEllipsis', function() {
  return function(text, quantity) {
    if (text.length <= quantity) {
      return text;
    }
    return '{0}...'.format([text.slice(0, quantity - 1)]);
  };
});
