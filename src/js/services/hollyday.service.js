'use strict';

scrumInCeresServices.service('HollydayService', ['$window', '$q', 'Hollyday', function ($window, $q, Hollyday) {
  var hollydays = [];
  var loading = false;

  this.dateIsHollyday = function(date) {
    var dateIndex = _.findIndex(hollydays, function(hollyday) {
      return hollyday.date === date.format('YYYY-MM-DD');
    });
    return dateIndex > -1;
  };


  var defer = $q.defer();
  this.getHollydays = function() {
    if (hollydays.length > 0) {
      defer.resolve(hollydays);
      return defer.promise;
    }
    if (!loading) {
      loading = true;
      Hollyday.query(
        function(response) {
          hollydays = response;
          defer.resolve(hollydays);
        }
      );
    }
    return defer.promise;
  }
}]);
