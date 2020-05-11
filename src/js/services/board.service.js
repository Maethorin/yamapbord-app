'use strict';

scrumInCeresServices.service('BoardService', ['$rootScope', '$q', 'Board', 'BoardStory', function($rootScope, $q, Board, BoardStory) {
  this.boards = [];
  this.selectedBoard = null;
  var _self = this;
  var shouldQueryBoardStories = true;

  this.timelineFilter = {
    type: null,
    startDate: moment().add(-120, 'months'),
    endDate: moment().add(80, 'months'),
    team: null,
    status: [
      {filter: 'PLAN', label: 'Planned', selected: true},
      {filter: 'CURR', label: 'Current', selected: true},
      {filter: 'SUCC', label: 'Success', selected: false},
      {filter: 'FAIL', label: 'Failure', selected: false}
    ]
  };

  this.listBoards = function(currentBoardId) {
    var boardsDefer = $q.defer();
    if (currentBoardId === undefined || this.boards.length === 0) {
      Board.query(function(response) {
        _self.boards = response;
        _self.selectedBoard = null;
        boardsDefer.resolve(_self.boards);
      });
    }
    else {
      boardsDefer.resolve(_self.boards);
    }
    return boardsDefer.promise;
  };

  this.selectBoard = function(board) {
    shouldQueryBoardStories = _self.selectedBoard === null || board.id !== _self.selectedBoard.id || _self.selectedBoard.stories === undefined || _self.selectedBoard.stories.length === 0;
    _self.selectedBoard = board;
  };

  this.loadBoardStories = function() {
    var boardStoriesDefer = $q.defer();
    if (shouldQueryBoardStories) {
      BoardStory.query(
        {boardId: _self.selectedBoard.id, boardType: _self.selectedBoard.type},
        function(response) {
          _self.selectedBoard.stories = response;
          boardStoriesDefer.resolve(_self.selectedBoard.stories);
        },
        function(error) {
          boardStoriesDefer.reject(error);
        }
      );
    }
    else {
      boardStoriesDefer.resolve(_self.selectedBoard.stories);
    }
    return boardStoriesDefer.promise;
  };

  this.updateBoard = function(iteration) {
    var defer = $q.defer();
    Board.update(
      {boardId: iteration.id},

      iteration,

      function() {
        defer.resolve();
      },
      function(error) {
        defer.reject(error);
      }
    );
    return defer.promise;
  };
}]);
