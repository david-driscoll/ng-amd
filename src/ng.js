/**
* ng plugin loader
* 
* This load takes in the format of:
*   ng-module!name
*   
*/
define(['ng-module', 'module'], function (ngModule, rjsModule) {
	var parseParts = ngModule.parseParts,
		unwrapModule = ngModule.unwrapModule,
		count = ngModule.count,
		normalizeModule = ngModule.normalizeModule,
		endsWith = ngModule.endsWith;

	var masterConfig = rjsModule.config;

	var fs, fetchText = function (path, callback) {
            localRequire([path], callback);
        },
        buildMap = {};

    var ng = {
    	buildMap: {},
        load: function (name, parentRequire, onLoad, config) {
        	var parts = parseParts(name),
        		dependencyName = parts[0],
        		moduleName = parts[1] || unwrapModule(dependencyName, config.module) || 'app';

			var dependencyUrl = parentRequire.toUrl(dependencyName);
    		var isPackage = !endsWith(dependencyUrl, dependencyName);

    		var inferedParent = false;
    		//ngModule.serviceMap
    		var parts = dependencyName.split('/');
    		for (var i = parts.length - 2; i >= 0; i--) {
    			var potentialParent = parts.slice(0, i+1).join('/');
    			if (ngModule.serviceMap[potentialParent])
    			{
    				moduleName = potentialParent;
					inferedParent = true;
					break;
    			}
    		}

    		var deps = [dependencyName];

    		parentRequire(deps, function(module) {
    			ng.finishLoad(dependencyName, moduleName, parentRequire, isPackage, module, onLoad, config);
    		});
        },
        finishLoad: function(dependencyName, moduleName, parentRequire, isPackage, module, onLoad, config) {
			
            if (config.isBuild) {
                var noop = function() {};
                var angularModule = {
                    requires: [],
                    animation: noop,
                    config: noop,
                    constant: noop,
                    controller: noop,
                    directive: noop,
                    factory: noop,
                    filter: noop,
                    provider: noop,
                    run: noop,
                    service: noop,
                    value: noop,
                    name: dependencyName
                };
                onLoad();
                return;
            } else {
                var angularModule = angular.module(moduleName);
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
				throw new Error('Could not identify function or dependencies of module \'' + name + '\'');

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
				};
				parentRequire(newDeps, function() {
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
    		};
    		return parts.join('|');
        },
        writeFile: function (pluginName, moduleName, write, config) {
            console.log('ng!writeFile');
        }
    };

    return ng;
    //pluginBuilder: ''
});