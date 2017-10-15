'use strict';

scrumInCeresServices.service('Alert', ['sweetAlert', function(SweetAlert) {

  var randomSuccessMessages = [
    'That`s my boy', 'Not bad!', 'You did it!', 'Congratulations!', 'Nice Job!', 'It`s Amazing, but it works!', 'We are done here!', 'What`s next Duuude!!!'
  ];

  this.randomSuccessMessage = function() {
    var index = Math.floor(Math.random() * randomSuccessMessages.length);
    if (index ===  randomSuccessMessages.length) {
      index -= 1;
    }
    this.success('Yaaay!', randomSuccessMessages[index])
  };

  var randomErrorMessages = [
    'What a Hell!!!', 'What a Heck!!!', 'Really?!?', 'Oh God why?!?', 'You got be kidding me, right?', 'Not again...', 'Came back later, maybe never!', 'I`m tyred of this, lets try other thing...'
  ];

  this.randomErrorMessage = function(error, message) {
    var index = Math.floor(Math.random() * randomErrorMessages.length);
    if (index ===  randomErrorMessages.length) {
      index -= 1;
    }
    if (!message) {
      message = 'Hmpf!';
    }
    this.error(message, randomErrorMessages[index]);
    console.log(error);
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
        imageUrl: '/img/yaaay.jpg',
        imageClass: 'alert-icon',
        timer: timer,
        showConfirmButton: false
      });
    }
    return SweetAlert.swal({
      title: title,
      text: text,
      type: 'success',
      imageUrl: '/img/yaaay.jpg',
      imageClass: 'alert-icon',
      timer: timer,
      showConfirmButton: false
    }).catch(swal.noop);
  };

  this.info = function(title, text) {
    return SweetAlert.swal({
      title: title,
      text: text,
      type: 'info'
    });
  };

  this.error = function(title, text) {
    return SweetAlert.swal({
      title: title,
      text: text,
      imageUrl: '/img/hmpf.jpg',
      imageClass: 'alert-icon',
      type: 'error'
    });
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