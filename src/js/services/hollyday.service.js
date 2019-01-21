'use strict';

scrumInCeresServices.service('HollydayService', ['$window', '$q', 'Hollyday', function ($window, $q, Hollyday) {
  var self = this;
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
  };

  this.setWorkingDays = function(component) {
    self.getHollydays().then(
      function() {
        var startDate = moment(component.startDate).startOf('day');
        var endDate = moment(component.endDate).startOf('day');
        component.workingDays = 1;
        while (startDate.add(1, 'days').diff(endDate) < 0) {
          if (startDate.weekday() !== 6 && startDate.weekday() !== 7 && !self.dateIsHollyday(startDate)) {
            component.workingDays += 1;
          }
        }
      }
    );
  }

}]);
