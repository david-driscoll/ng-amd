var tests = [];
for (var file in window.__karma__.files) {
    if (/(.*?)\/test\/(.*?)\/(.*).js$/.test(file)) {
        if (file.indexOf('/bower_components/') === -1)
            tests.push('..'+file);
    }
}

window.mocha.setup({
  timeout: 10000
});

requirejs.config({
    baseUrl: 'base/src',
    paths: {
        'angular': '../bower_components/angular/angular',
        'angular-mocks': '../bower_components/angular-mocks/angular-mocks',
        'lodash': '../bower_components/lodash/lodash',
        'jquery': '../bower_components/jquery/jquery',
        'example': '../example',
    },
    shim: {
        'angular': { deps: ['jquery'], exports: 'angular' },
        'angular-mocks': { deps: ['angular'], exports: 'angular' },
    },
    packages: [
        { name: 'example/package1', main: 'index.js', location: '../example/package1' },
        { name: 'example/package2', main: 'index.js', location: '../example/package2' }
    ],
    waitSeconds: 120,
    deps: [],
    callback: function () {
        require(tests, window.__karma__.start);
    }
});