'use strict';

scrumInCeresServices.service('Notifier', ['$timeout', function($timeout) {
  var config = {
    defaultTimeout: 3000
  };

  var notificationCount = 0;
  var notificationPositions = [];

  return {
    notify: function(message, title, type) {
      notificationCount += 1;
      var notification = document.createElement('div');
      notification.className = 'notifier-box {0}'.format([type]);
      notification.onclick = function() {
        this.style.display = 'none';
      };

      var icon = document.createElement('i');
      icon.className = 'notifier-icon {0}'.format([type]);

      notification.appendChild(icon);

      var text = document.createElement('div');
      text.className = 'notifier-text';

      notification.appendChild(text);

      if (title) {
        var titleText = document.createElement('div');
        titleText.className = 'notifier-title';
        titleText.appendChild(document.createTextNode(title));
        text.appendChild(titleText);
      }

      if (message) {
        var messageText = document.createElement('div');
        messageText.appendChild(document.createTextNode(message));
        text.appendChild(messageText);
      }

      var container = document.createElement('div');
      container.className = 'notifier-container';
      var baseTop = 80;
      var containerTop = notificationCount * (baseTop + 15);
      container.style.top = '{0}px'.format([containerTop]);
      container.insertBefore(notification, container.firstChild);
      document.body.appendChild(container);

      $timeout(function() {
        container.className = 'notifier-container show-in';
      }, 0.5);

      $timeout(
        function() {
          container.className = 'notifier-container';
        },
        config.defaultTimeout
      ).then(
        function() {
          $timeout(
            function() {
              document.body.removeChild(container);
              notificationCount -= 1;
            },
            1000
          )
        }
      );
    },
    info: function(message, title) {
      this.notify(message, title, 'info');
    },
    warning: function(message, title) {
      this.notify(message, title, 'warning');
    },
    success: function(message, title) {
      this.notify(message, title, 'success');
    },
    danger: function(message, title) {
      this.notify(message, title, 'danger');
    }
  };
}]);