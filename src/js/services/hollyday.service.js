'use strict';

scrumInCeresServices.service('HollydayService', ['$window', '$q', 'Hollyday', function ($window, $q, Hollyday) {
  var hollydays = [];

  this.dateIsHollyday = function(date) {
    var dateIndex = _.findIndex(hollydays, function(hollyday) {
      return hollyday.date === date.format('YYYY-MM-DD');
    });
    return dateIndex > -1;
  };


  this.getHollydays = function() {
    var defer = $q.defer();
    if (hollydays.length > 0) {
      defer.resolve(hollydays);
      return defer.promise;
    }
    Hollyday.query(
      function(response) {
        hollydays = response;
        defer.resolve(hollydays);
      }
    );
    return defer.promise;
  }
}]);
