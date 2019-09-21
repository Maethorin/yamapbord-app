'use strict';

scrumInCeresServices.service('BoardService', ['$rootScope', '$q', 'Board', 'BoardStory', function($rootScope, $q, Board, BoardStory) {
  this.boards = [];
  this.selectedBoard = null;
  var _self = this;
  var shouldQueryBoardStories = true;

  this.timelineFilter = {
    type: 'kanban',
    startDate: moment().add(-12, 'months'),
    endDate: moment().add(4, 'months'),
    team: null,
    status: ['CURR', 'PLAN']
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
}]);
