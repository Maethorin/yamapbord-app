'use strict';

var withBind = {
      bind: function() {

      }
};

var Pusher = function() {
  return {
    connection: withBind,
    subscribe: function() {
      return withBind;
    }
  }
};

describe('Home Controller', function() {
  var $scope, $rootScope, $httpBackend, Alert;

  beforeEach(module('scrumInCeres'));

  beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_) {
		$scope = _$rootScope_.$new();
		$rootScope = _$rootScope_;
		$httpBackend = _$httpBackend_;
		Alert = jasmine.createSpyObj('Alert', ['loading', 'warnig']);
    $httpBackend.when('GET', '@@backendURL/me').respond(200, 'ME');
    $httpBackend.when('GET', '@@backendURL/users/me/requesters').respond(200, ['REQ']);
    $httpBackend.when('GET', '@@backendURL/users/me/epics').respond(200, ['EPIC']);
    $httpBackend.when('GET', '@@backendURL/users/me/modules').respond(200, ['MOD']);

		_$controller_('HomeController', {$scope: $scope, Alert: Alert})
  }));

  describe('when starting', function(){
    it('should set the rootScope current controller', function() {
      expect($rootScope.currentController).toBe('HomeController');
    });

    it('should $scope had this', function() {
      expect($scope.iHadThis).toBeTruthy();
    });

    it('should alert loading', function() {
      expect(Alert.loading).toHaveBeenCalledWith('What', 'A Nice!');
    });
  });

  describe('when normalizing arg', function() {
    it('should call resource with success', function() {
      $httpBackend.expect('GET', '@@backendURL/users/me/backlog/kanbans/123').respond(200, 'Alooo');
      $scope.normalizeArgs(123)
      $httpBackend.flush();
    });

    it('should call resource with error', function() {
      $httpBackend.when('GET', '@@backendURL/users/me/backlog/kanbans/123').respond(404, 'Alooo');
      $scope.normalizeArgs(123)
      $httpBackend.flush();
    })
  })

  describe('when doing this', function() {
    beforeEach(function() {
      spyOn($scope, 'normalizeArgs').and.returnValue(2)
      spyOn($scope, 'calculate').and.callThrough()
    });

    it('should call calculate', function() {
      $scope.doThis(4)
      expect($scope.calculate).toHaveBeenCalledWith(2)
    });

    it('should call calculate', function() {
      $scope.doThis(4)
      expect($scope.normalizeArgs).toHaveBeenCalledWith(4)
    });

    it('should return args times three', function() {
      expect($scope.doThis(4)).toBe(6)
    });

    it('should return args times three even if negative', function() {
      expect($scope.doThis(-4)).toBe(6)
    });

    it('should alert loading', function() {
      $scope.doThis(4);
      expect(Alert.loading).toHaveBeenCalledWith('Who')
    });
  });
});
