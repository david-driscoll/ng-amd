ng-amd
======

An ng-amd plugin for loading and injecting modules into an angular application.


What is it?
===========
ng-amd is a set of two AMD plugins for RequireJS.  These allow RequireJS to act as a form of Service Location, with angular controlling the Dependency Injection.


Usage
-----
Usage is fairly simple.

Add the plugins to your config file, with whatever name you want to give them.  If installed through bower, for example it might similar to below.


    'ng': '../../bower_components/ng-amd/src/ng',
    'ng-module': '../../bower_components/ng-amd/src/ng-module'


### ng-module! ###
`ng-module!path/to/module` will load the given dependency as a module, into angular.  Any dependencies loaded with ng-module will be made dependencies (module.requires) of the one that loaded it.  And so on and so forth.


### ng! ###
`ng!path/to/service` will load the given dependency as a service, into angular.   Currently it supports services in various forms...

- ['$parse', '$compile', function($parse, $compile)]  (loads as a factory)
- function($parse, $compile) {}.$inject = ['$parse', '$compile'];  (loads as a factory)
- ['$parse', '$compile', { $get: function($parse, $compile) }]  (loads as a provider)
- { $get: function($parse, $compile) {}.$inject = ['$parse', '$compile'] }  (loads as a provider)
- function(module) {}
-- The one gotcha here, you cannot by default use the inferred dependency syntax.  If we find a function, with no dependencies, then we will give you the module.  This way you can register controllers, directives, values and constants.


Anything loaded with ng! will first try to find the module it is attached too via it's path.  If it can't be inferred through the path it may be provided...

With a pipe on the dependency itself `ng!path/to/service|moduleName`


With a RequireJS config setting

    requirejs.config({ config: { 'ng': { module: 'moduleName' } } })


If those all fail, it will default simply to 'app'



Angular must be manually bootstrapped, using ngApp is not easily possible, if loading through RequireJS.


    define(['angular', 'ng-module!app'], function (angular, app) {
        angular.bootstrap(document, ['app']);
    });



Roadmap
=======
- Injecting dependencies after angular has loaded, to support things like loading controllers, directives on the fly depending on a given route.
- More comprehensive Unit Testing
