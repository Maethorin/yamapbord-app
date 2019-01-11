module.exports = function(config) {
  config.set({
    basePath: './',
    files: [
      "src/lib/moment/moment.js",
      "src/lib/moment/locale/pt-br.js",
      "src/lib/sweetalert2/dist/sweetalert2.js",
      "src/lib/lodash/dist/lodash.js",
      "src/lib/jquery/dist/jquery.js",
      "src/lib/bootstrap-sass/assets/javascripts/bootstrap.js",

      "src/lib/angular/angular.js",
      "src/lib/angular-sanitize/angular-sanitize.js",
      "src/lib/angular-touch/angular-touch.js",
      "src/lib/angular-ui-router/release/angular-ui-router.js",
      "src/lib/angular-animate/angular-animate.js",
      "src/lib/angular-resource/angular-resource.js",
      "src/lib/angular-input-masks/angular-input-masks-standalone.js",
      "src/lib/angular-sweetalert-2/SweetAlert.js",
      "src/lib/angular-cookies/angular-cookies.js",
      "src/lib/angular-bootstrap/ui-bootstrap.js",
      "src/lib/angular-bootstrap/ui-bootstrap-tpls.js",
      "src/lib/ng-scrollable/src/ng-scrollable.js",
      "src/lib/angular-bootstrap-checkbox/angular-bootstrap-checkbox.js",
      "src/lib/ng-sortable/dist/ng-sortable.js",
      "src/lib/angular-aria/angular-aria.js",
      "src/lib/angular-messages/angular-messages.js",
      "src/lib/angular-material/angular-material.js",
      "src/lib/ng-file-upload/ng-file-upload.js",
      "src/lib/angular-mocks/angular-mocks.js",

      "node_modules/angular-bootstrap-datetimepicker/src/js/datetimepicker.js",
      "node_modules/angular-bootstrap-datetimepicker/src/js/datetimepicker.templates.js",
      "node_modules/angular-date-time-input/src/dateTimeInput.js",

      'src/js/**/*.js',
      'tests/unit/**/*.js'
    ],
    autoWatch: true,
    frameworks: ['jasmine'],
    reporters: ['spec'],
    browsers: ['Chrome'],
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-spec-reporter'
    ]
  });
};
