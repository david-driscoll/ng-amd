/**
* ng plugin loader
* 
* This load takes in the format of:
*   ng-module!name
*   
*/
define(function () {
	var ngModule;

	function parseParts(name) {	return name.split('|'); }
	function unwrapModule(name, module) { return (typeof module == 'function' ? module(name) : module); }

	function pickModuleName()
	{

	}

    return {
        load: function (name, parentRequire, onLoad, config) {
        	if (!ngModule) require(['ng-module'], function (_ngModule) { ngModule = _ngModule; doLoad(); }); else doLoad();

        	function doLoad() {
	        	var parts = parseParts(name),
	        		dependencyName = parts[0],
	        		moduleName = parts[1] || unwrapModule(dependencyName, config.module) || 'app',
	        		angular = window.angular;

				var contexts = window.require.s.contexts;
				for (var i in contexts) {
					var registry = contexts[i].registry;
					for (var k in ngModule.serviceMap) {
						for (var z = registry[k].depMaps.length - 1; z >= 0; z--) {
							var depMap = registry[k].depMaps[z];
							if (depMap.name === name){
								moduleName = depMap.parentMap.name;
								break;
								break;
								break;
							}
						}
					}
				}

	    		var deps = [dependencyName];
	    		if (!angular)
	    			deps.push('angular');

	    		parentRequire(deps, function(module, _angular) {
					if (!angular) angular = _angular;
					var angluarModule = angular.module(moduleName),
						obj, dependencies, fn, moduleIsArray = angular.isArray(module);

					if (moduleIsArray) {
						obj = module[module.length];
						dependencies = module.slice(0, module.length-1);
					} else {
						obj = module;
						dependencies = module.$inject;
					}

					if (obj.$get){
						fn = undefined;
					} else if (typeof obj === 'function') {
						fn = obj;
						obj = undefined;
					}

					if (!obj && !fn)
						throw new Error('Could not identify function or dependencies of module \'' + name + '\'');

					if (fn && !dependencies) {
						fn(angluarModule);
						onLoad(module);
					} else if (dependencies) {
						parentRequire(dependencies, function() {
							for (var i = dependencies.length - 1; i >= 0; i--) {
								if (moduleIsArray)
									module[i] = dependencies[i];
								else if (module.$inject)
									module.$inject[i] = dependencies[i];
							};
							onLoad(module);
						});
					} else {
						onLoad(module);
					}
	    		});
    		}
        },
        normalize: function (name, normalize) {
    		var parts = parseParts(name);
    		for (var i = parts.length - 1; i >= 0; i--) {
    			parts[i] = normalize(parts[i]);
    		};
    		return parts.join('|');
        },
        write: function (pluginName, moduleName, write, config) {
            throw new Error('NYI!');
        }
    };
    //pluginBuilder: ''
});