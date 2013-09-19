/* ng-amd - v0.0.1 - 2013-09-18
* Copyright (c) 2013 ; Licensed  */
define([ "ng-module" ], function(ngModule) {
    "use strict";
    var parseParts = ngModule.parseParts, unwrapModule = ngModule.unwrapModule, normalizeModule = ngModule.normalizeModule, endsWith = ngModule.endsWith, ng = {
        load: function(name, localRequire, onLoad, config) {
            for (var parts = parseParts(name), dependencyName = parts[0], moduleName = parts[1] || unwrapModule(dependencyName, config.module) || "app", dependencyUrl = localRequire.toUrl(dependencyName), isPackage = !endsWith(dependencyUrl, dependencyName), deps = [ dependencyName ], i = parts.length - 2; i >= 0; i--) {
                var potentialParent = parts.slice(0, i + 1).join("/");
                if (ngModule.serviceMap[potentialParent]) {
                    moduleName = potentialParent;
                    break;
                }
            }
            localRequire(deps, function(module) {
                ng.finishLoad(dependencyName, moduleName, localRequire, isPackage, module, onLoad, config);
            });
        },
        finishLoad: function(dependencyName, moduleName, localRequire, isPackage, module, onLoad, config) {
            var angularModule;
            angularModule = angular.module(moduleName);
            var obj, dependencies, fn, moduleIsArray = ngModule.isArray(module);
            if (moduleIsArray ? (obj = module[module.length - 1], dependencies = module.slice(0, module.length - 1)) : (obj = module, 
            dependencies = module.$inject), obj && obj.$get ? fn = void 0 : "function" == typeof obj && (fn = obj, 
            obj = void 0), !obj && !fn) throw new Error("Could not identify function or dependencies of module '" + dependencyName + "'");
            if (fn && !dependencies) fn(angularModule), onLoad(module); else if (dependencies) {
                for (var newDeps = [], i = dependencies.length - 1; i >= 0; i--) {
                    var normalizedName = normalizeModule(dependencyName, "ng!" + dependencies[i], isPackage);
                    moduleIsArray ? module[i] = normalizedName.split("!")[1] : module.$inject[i] = normalizedName.split("!")[1];
                    var d = dependencies[i];
                    d.indexOf("!") > -1 ? newDeps.push(d) : d.indexOf("/") > -1 && newDeps.push(normalizedName);
                }
                localRequire(newDeps, function() {
                    fn && dependencies ? angularModule.factory(dependencyName, module) : obj && dependencies && angularModule.provider(dependencyName, module), 
                    onLoad(module);
                });
            } else onLoad(module);
        },
        normalize: function(name, normalize) {
            for (var parts = parseParts(name), i = parts.length - 1; i >= 0; i--) parts[i] = normalize(parts[i]);
            return parts.join("|");
        }
    };
    return ng;
});