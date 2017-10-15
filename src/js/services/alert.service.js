'use strict';

scrumInCeresServices.service('Alert', ['sweetAlert', function(SweetAlert) {

  this.showCase = function(title, text, type){
    return SweetAlert.swal(
      title,
      text,
      type
    );
  };

  this.success = function(title, text, timer, usePromise) {
    if (!timer) {
      timer = 2000;
    }
    if (usePromise) {
      return SweetAlert.swal({
        title: title,
        text: text,
        type: 'success',
        timer: timer,
        showConfirmButton: false
      });
    }
    return SweetAlert.swal({
      title: title,
      text: text,
      type: 'success',
      timer: timer,
      showConfirmButton: false
    }).catch(swal.noop);
  };

  this.info = function(title, text) {
    return this.showCase(title, text, 'info');
  };

  this.error = function(title, text) {
    return this.showCase(title, text, 'error');
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

  this.warning = function(title, text, callback, confirmText, notConfirmText, showCancelButton) {
    if (showCancelButton === undefined){
      showCancelButton = true
    }
    if (!confirmText) {
      confirmText = 'Yes';
    }
    if (!notConfirmText) {
      notConfirmText = 'No';
    }
    SweetAlert.swal(
      {
        title: title,
        text: text,
        type: 'warning',
        showCancelButton: showCancelButton,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: confirmText,
        cancelButtonText: notConfirmText
      }).then(callback);
  };

  this.confirm = function(title, message, confirmText, inputPlaceholder, callback) {
    SweetAlert.swal({
      title: title,
      text: message,
      type: "input",
      confirmButtonText: confirmText,
      showCancelButton: true,
      animation: "slide-from-top",
      inputPlaceholder: inputPlaceholder,
      showLoaderOnConfirm: true
    }).then(callback);
  };

  this.close = function() {
    SweetAlert.close();
  };
}]);