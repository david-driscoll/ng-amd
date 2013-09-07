/**
* ng plugin loader
* 
* This load takes in the format of:
*   ng-module!name
*   
*/
define(function () {
	var regex = /^ng([a-z\-\n]*?)!/i;
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

    var ngModule = {
        serviceMap: {},
        load: function (name, parentRequire, onLoad, config) {
        	var parts = parseParts(name),
        		dependencyName = parts[0],
        		angular = window.angular;

            var dependencyUrl = parentRequire.toUrl(dependencyName);
            var isPackage = !endsWith(dependencyUrl, dependencyName);
            ngModule.serviceMap[dependencyName] = dependencyName;

            if (!angular)
                require(['angular'], function (_angular) { angular = _angular; doLoad(); });
            else
                doLoad();

            function doLoad() {
                var deps = [dependencyName],
                    angularModule = angular.module(dependencyName, []);

        		parentRequire(deps, function(module) {

    				var isArray = angular.isArray(module);

                    if (isArray)
                        angularModule.requires.push.apply(angularModule.requires, module);
    				if (angular.isFunction(module))
    					module(angularModule);

    				var deps = [];
    				if (angularModule.requires)	{
    					angular.forEach(angularModule.requires, function(x, i)	{
    						if (x.indexOf('ng-module!') === 0) {
                                var normalizedName = normalizeModule(dependencyName, x, isPackage);
                                angularModule.requires[i] = normalizedName.split('!')[1];
                                ngModule.serviceMap[angularModule.requires[i]] = angularModule.requires[i];
    							deps.push(normalizedName);
    						}
    					});
    				}

    				if (deps.length)
    					require(deps, function() {
    						onLoad(angularModule);
    					});
    				else 
    					onLoad(angularModule);
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

    return ngModule;
    //pluginBuilder: ''
});
