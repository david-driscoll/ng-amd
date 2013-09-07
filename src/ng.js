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
    function count(string, subString, allowOverlapping){
        string+='';
        subString+='';
        if(subString.length<=0) 
            return string.length+1;

        var n=0, pos=0;
        var step=(allowOverlapping)?(1):(subString.length);

        while(true){
            pos=string.indexOf(subString,pos);
            if(pos>=0){ n++; pos+=step; } else break;
        }
        return(n);
    }

    function normalizeModule(parentName, name, isPackage) {
        var parts = name.split('!'),
            parentDir = parentName.split('/'),
            parentDir = parentDir.slice(0, parentDir.length- ( isPackage ? 0 : 1 )).join('/'),
            newName = parts[1];

        if (newName.indexOf('../') > -1) {
            backSteps = count(newName, '../');
            var parentParts = parentDir.split('/');
            parentDir = parentParts.slice(0, parentParts.length - backSteps + 1).join('/');

            newName = (parentDir ? parentDir + '/' : '') + newName.replace(/\.\.\//gi, '');
        }

        if (newName.indexOf('./') === 0) {
            newName = parentDir + '/' + newName.substring(2);
        }

        return parts[0] + '!' + newName;
    }

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    return {
        load: function (name, parentRequire, onLoad, config) {
        	if (!ngModule) require(['ng-module'], function (_ngModule) { ngModule = _ngModule; doLoad(); }); else doLoad();

        	function doLoad() {
	        	var parts = parseParts(name),
	        		dependencyName = parts[0],
	        		moduleName = parts[1] || unwrapModule(dependencyName, config.module) || 'app',
	        		angular = window.angular;

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

    			if (!inferedParent) {
					var contexts = window.require.s.contexts;
					for (var i in contexts) {
						var registry = contexts[i].registry;
						if (registry) {
							for (var k in ngModule.serviceMap) {
								if (registry[k] && registry[k].depMaps) {
									for (var z = registry[k].depMaps.length - 1; z >= 0; z--) {
										var depMap = registry[k].depMaps[z];
										if (depMap.name === name){
											moduleName = depMap.parentMap.name;
											break;
										}
									}
								}
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
						fn(angluarModule);
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
							else
								newDeps.push(normalizedName);
						};
						parentRequire(newDeps, function() {
							if (fn && dependencies) {
								angluarModule.factory(dependencyName, module);
							} else if (obj && dependencies) {
								angluarModule.provider(dependencyName, module);
							}

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