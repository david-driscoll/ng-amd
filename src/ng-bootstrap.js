define([], function() {
    var amdTag = 'ng-module!',
        ngTag = 'ng!',
        angular = window.angular,
		depsModule = {};

	function parseParts(name) {	return name.split('|'); }
    function updateModuleName(collection, name)
    {
        for (var i = 0, len = collection.length; i < len; i++) {
            if (collection[i] === name)
            {
                collection[i] = collection[i].substring(amdTag.length-1);
            }
        }
    }
  
	function pickModuleName(moduleName, callback)
	{
		for (var i = 1, len = arguments.length -2; i < len; i++)
		{
			var name = arguments[i];
			if (name)
			{
				if (typeof(name) === 'function')
				{
					var result = name(moduleName);
					if (typeof(result) === 'function')
						return result(callback);
					return callback(moduleName);
				}
				return callback(name);
			}
		}
	}

    function RequestHandler(cb){
    	this.cb = cb;
    	this.outstandingRequests = [];
    }
    RequestHandler.prototype.handleRequest = function handleRequest(cb)
    {
        this.outstandingRequests.push(null);
        return function oustandingRequest() {
            if (cb)
            	cb.apply(null, arguments);
            this.outstandingRequests.pop();

            if (!this.outstandingRequests.length)
                this.cb();
        };
    };

    function getDynamicModulesToLoad(modules, ignoreExisting, module) {
        var loadDeps = [];
        angular.forEach(modules, function(name, i)
        {
            var name = modules[i];
            if (name.indexOf(amdTag) === 0)      {
                var depName = module.replace(amdTag, ngTag);
                loadDeps.push(name);
                if (module)
                {
                    if (!depsModule[name])
                        depsModule[name] = [];
                    depsModule[name].push(module);
                }
                modules[i] = name.substring(amdTag.length - 1);
            } else if (!ignoreExisting) {
                var m = angular.module(name),
                    requires = m.requires;
                
                if (requires){
                	loadDeps.push.apply(loadDeps,
                		getDynamicModulesToLoad(requires, ignoreExisting, name));
                }
            }
        });
        return loadDeps;
    }

	return {
		load: function (name, require, onLoad, config) {
        	var parts = parseParts(name),
        		dependencyName = parts[0],
        		moduleName, element, modules,
        		requestHandler = new RequestHandler(function() {
			    	angular.bootstrap(element, [moduleName]);
			    });

    		pickModuleName(dependencyName, requestHandler.handleRequest(setModuleName), parts[1], config.module, 'app');

			var deps = [dependencyName];
    		if (!angular)
    			deps.push('angular');

			require(deps, function(depModule, _angular){
				if (!angular) angular = _angular;

				var element = depModule[0],
					modules = depModule[1];
			    
			    var depsToLoad = getDynamicModulesToLoad(modules);
			    loadDynamicModules(depsToLoad);
			});

			function setModuleName(name)
			{
				moduleName = name;
			}

		    function loadDynamicModules(modules, cb)
		    {
		        require(modules, function()
		        {
		            var additionalDeps = [], args = arguments;
		            angular.forEach(modules, function(name, i)  {
		                var dep = args[i],
		                depModule = depsModule[name],
		                moduleName = name.replace(ngTag,''),
		                amdTagName = name.replace(ngTag, amdTag);
		                
		                if (depModule) {
		                    angular.forEach(depModule, function(x){
		                        updateModuleName(angular.module(x).requires, amdTagName);
		                    });
		                } else {
		                    updateModuleName(modules, amdTagName);
		                }
		                
		                var angularModule = angular.module(moduleName);
		                additionalDeps.push.call(additionalDeps, getDynamicModulesToLoad(angularModule.requires, true));
		            });
		            
		            if (additionalDeps.length) {
		                loadDynamicModules(additionalDeps, requestHandler.handleRequest());
		            }
		            if (cb) {
		                cb();
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
});