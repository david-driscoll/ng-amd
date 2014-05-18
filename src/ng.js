/**
* ng plugin loader
* 
* This load takes in the format of:
*   ng-module!name
*   
*/
define(['ng-module'], function (ngModule) {
    'use strict';

    var parseParts = ngModule.parseParts,
        unwrapModule = ngModule.unwrapModule,
        normalizeModule = ngModule.normalizeModule,
        endsWith = ngModule.endsWith;

    var ng = {
        load: function (name, localRequire, onLoad, config) {
            var parts = parseParts(name),
                dependencyName = parts[0],
                moduleName = parts[1] || unwrapModule(dependencyName, config.module) || 'app',
                dependencyUrl = localRequire.toUrl(dependencyName),
                isPackage = !endsWith(dependencyUrl, dependencyName),
                deps = [dependencyName];
			parts = parts[0].split('/');

            for (var i = parts.length - 2; i >= 0; i--) {
				var potentialParents = parts.slice(0, i+1);
				for (var z = potentialParents.length - 1; z >= 0; z--) {
					var potentialParent = potentialParents.slice(z).join('/');
					if (ngModule.serviceMap[potentialParent])
					{
						moduleName = potentialParent;
						break;
					}
				}
            }

			if (dependencyUrl === 'empty:') {
				onLoad();
				return;
			}
            localRequire(deps, function(module) {
                ng.finishLoad(dependencyName, moduleName, localRequire, isPackage, module, onLoad, config);
            });
        },
        finishLoad: function(dependencyName, moduleName, localRequire, isPackage, module, onLoad, config) {
            var angularModule;

            if (config.isBuild) {
                onLoad();
                return;
            } else {
                angularModule = angular.module(moduleName);
            }
            var obj, dependencies, fn, moduleIsArray = ngModule.isArray(module);

            if (moduleIsArray) {
                obj = module[module.length-1];
                dependencies = module.slice(0, module.length-1);
            } else {
                obj = module;
                dependencies = module.$inject;
            }

            if (obj && obj.$get){
                fn = undefined;
            } else if (typeof obj === 'function') {
                fn = obj;
                obj = undefined;
            }

            if (!obj && !fn)
                throw new Error('Could not identify function or dependencies of module \'' + dependencyName + '\'');

            if (fn && !dependencies) {
                fn(angularModule);
                onLoad(module);
            } else if (dependencies) {
                var newDeps = [];
                for (var i = dependencies.length - 1; i >= 0; i--) {
                    var normalizedName = normalizeModule(dependencyName, 'ng!' + dependencies[i], isPackage);
                    if (moduleIsArray)
                        module[i] = normalizedName.split('!')[1];
                    else
                        module.$inject[i] = normalizedName.split('!')[1];
                    
                    var d = dependencies[i];
                    if (d.indexOf('!') > -1)
                        newDeps.push(d);
                    else if (d.indexOf('/') > -1)
                        newDeps.push(normalizedName);
                }
                localRequire(newDeps, function() {
                    if (fn && dependencies) {
                        angularModule.factory(dependencyName, module);
                    } else if (obj && dependencies) {
                        angularModule.provider(dependencyName, module);
                    }

                    onLoad(module);
                });
            } else {
                onLoad(module);
            }
        },
        normalize: function (name, normalize) {
            var parts = parseParts(name);
            for (var i = parts.length - 1; i >= 0; i--) {
                parts[i] = normalize(parts[i]);
            }
            return parts.join('|');
        }
        /* Is this needed? Doesn't appear to be.
        writeFile: function (pluginName, moduleName, write, config) {
        }*/
    };

    return ng;
    //pluginBuilder: ''
});
