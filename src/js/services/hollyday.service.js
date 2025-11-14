'use strict';

yamapBordServices.service('HolidayService', ['$window', '$q', 'Holiday', function ($window, $q, Holiday) {
  var self = this;
  var holidays = [];
  var loading = false;

  this.dateIsHoliday = function(date) {
    var dateIndex = _.findIndex(holidays, function(holiday) {
      return holiday.date === date.format('YYYY-MM-DD');
    });
    return dateIndex > -1;
  };

  var defer = $q.defer();
  this.getHolidays = function() {
    if (holidays.length > 0) {
      defer.resolve(holidays);
      return defer.promise;
    }
    if (!loading) {
      loading = true;
      Holiday.query(
        function(response) {
          holidays = response;
          defer.resolve(holidays);
        }
      );
    }
    return defer.promise;
  };

  this.setWorkingDays = function(component) {
    var defer = $q.defer();
    self.getHolidays().then(
      function() {
        var startDate = moment(component.startDate).startOf('day');
        var endDate = moment(component.endDate).startOf('day');
        component.workingDays = 1;
        while (startDate.add(1, 'days').diff(endDate) < 0) {
          if (startDate.weekday() !== 6 && startDate.weekday() !== 7 && !self.dateIsHoliday(startDate)) {
            component.workingDays += 1;
          }
        }
        defer.resolve();
      }
    );
    return defer.promise;
  };

}]);
