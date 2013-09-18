{
    baseUrl: "src",
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
    name: "example/app",
    out: "main-built.js",
    optimize: 'none'
}