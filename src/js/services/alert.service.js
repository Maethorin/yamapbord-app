'use strict';

scrumInCeresServices.service('Alert', ['sweetAlert', function(SweetAlert) {
  function showAlert(title, text, type) {
    SweetAlert.swal(
      title,
      text,
      type
    );
  }

  this.success = function(title, text) {
    showAlert(title, text, 'success');
  };

  this.info = function(title, text) {
    showAlert(title, text, 'info');
  };

  this.error = function(title, text) {
    showAlert(title, text, 'error');
  };

  this.loading = function(title, text) {
    SweetAlert.swal({
      title: title,
      text: text,
      type: 'info',
      showConfirmButton: false,
      allowEscapeKey: false
    });
  };

  this.confirm = function(title, message, confirmText, inputPlaceholder, callback) {
    SweetAlert.swal({
        title: title,
        text: message,
        type: "input",
        confirmButtonText: confirmText,
        showCancelButton: true,
        closeOnConfirm: false,
        animation: "slide-from-top",
        inputPlaceholder: inputPlaceholder,
        showLoaderOnConfirm: true,
        html: true
      },
      callback
    );
  };

  this.close = function() {
    SweetAlert.close();
  };
}]);