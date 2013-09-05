// Karma configuration
// Generated on Tue Sep 03 2013 18:56:13 GMT-0600 (Mountain Daylight Time)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['requirejs', 'mocha', 'chai-as-promised', 'sinon-chai', 'chai'],


    // list of files / patterns to load in the browser
    files: [
      {pattern: 'src/**/*.js', included: false},
      {pattern: 'example/**/*.js', included: false},
      'test/test.require.config.js',
      {pattern: 'test/**/*.js', included: false},
      {pattern: 'bower_components/**/*.js', included: false},
    ],


    // list of files to exclude
    exclude: [
      
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'coverage'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Chrome', 'PhantomJS'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    // Code Coverage
    preprocessors: {
        // source files, that you wanna generate coverage for
        // do not include tests or libraries
        // (these files will be instrumented by Istanbul)
        //'src/**/*.js': ['coverage']
    },

    // optionally, configure the reporter
    coverageReporter: {
        type: 'html',
        dir: 'coverage/'
    },
  });
};
