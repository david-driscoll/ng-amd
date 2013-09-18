
/**
 * Angular-module loader plugin
 */
define('ng-module',[], function () {
    var regex = /^ng([a-z\-\n]*?)!/i;

    function parseParts(name) { return name.split('|'); }
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
            parentDir = parentParts.slice(0, parentParts.length - backSteps).join('/');

            newName = (parentDir ? parentDir + '/' : '') + newName.replace(/\.\.\//gi, '');
        }

        if (newName.indexOf('./') === 0) {
            newName = parentDir + '/' + newName.substring(2);
        }

        return parts[0] + '!' + newName;
    }

    function endsWith(str, suffix) { return str.indexOf(suffix, str.length - suffix.length) !== -1; }

    function isArray(value) { return toString.apply(value) == '[object Array]'; }
    function isFunction(value){return typeof value == 'function';}
    function noop() {}
    function mockAngularModule(dependencyName) {
        return {
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
    }

    var fs, getXhr,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        fetchText = function () {
            throw new Error('Environment unsupported.');
        },
        buildMap = {};

    if (typeof process !== "undefined" &&
               process.versions &&
               !!process.versions.node) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');
        fetchText = function (path, callback) {
            callback(fs.readFileSync(path, 'utf8'));
        };
    } else if ((typeof window !== "undefined" && window.navigator && window.document) || typeof importScripts !== "undefined") {
        // Browser action
        getXhr = function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            if (!xhr) {
                throw new Error("getXhr(): XMLHttpRequest not available");
            }

            return xhr;
        };

        fetchText = function (url, callback) {
            var xhr = getXhr();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function (evt) {
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    callback(xhr.responseText);
                }
            };
            xhr.send(null);
        };
        // end browser.js adapters
    } else if (typeof Packages !== 'undefined') {
        //Why Java, why is this so awkward?
        fetchText = function (path, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(path),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                stringBuffer.append(line);

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    }

    var ngModule = {
        serviceMap: {},
        parseParts: parseParts,
        endsWith: endsWith,
        normalizeModule: normalizeModule,
        unwrapModule: unwrapModule,
        count: count,
        isArray: isArray,
        fetchText: fetchText,
        mockAngularModule: mockAngularModule,
        load: function (name, localRequire, onLoad, config) {
            var parts = parseParts(name),
                dependencyName = parts[0],
                moduleName = parts[1] || dependencyName;

            var dependencyUrl = localRequire.toUrl(dependencyName);
            var isPackage = !endsWith(dependencyUrl, dependencyName);
            ngModule.serviceMap[dependencyName] = dependencyName;
            var angularModule

            if (config.isBuild) {
                angularModule = mockAngularModule(dependencyName);
            } else {
                angularModule = angular.module(moduleName, []);
                angularModule.dependencyName = dependencyName;
            }   
            fetchText(localRequire.toUrl(dependencyName + '.js'), function (moduleText) {

                var depsMatch = moduleText.match(/define\([\s\S]*?\[([\s\S]*?)\]/im);
                if (depsMatch && depsMatch[1]) {
                    var depsText = depsMatch[1];
                    var deps = depsText.replace(/['|"|\s|\n|\r]/ig, '').split(',');
                    for (var i = deps.length - 1; i >= 0; i--) {
                        var dep = deps[i];
                        if (dep.indexOf('ng-module!') === -1){
                            deps.splice(i, 1);
                        } else {
                            var normalizedName = normalizeModule(dependencyName, dep, isPackage);
                            deps[i] = normalizedName;
                            angularModule.requires.push(normalizedName.split('!')[1]);
                        }
                    };
                    localRequire(deps, function () {
                        ngModule.finishLoad(localRequire, dependencyName, angularModule, onLoad);
                    });
                } else {
                    ngModule.finishLoad(localRequire, dependencyName, angularModule, onLoad);
                }
            });
            
        },
        finishLoad: function(localRequire, name, angularModule, onLoad) {
            localRequire([name], function(module) {
                    if (isFunction(module))
                        module(angularModule);

                    onLoad(angularModule);
                });
        },        
        normalize: function (name, normalize) {
            var parts = parseParts(name);
            for (var i = parts.length - (parts.length > 1 ? 2 : 1); i >= 0; i--) {
                parts[i] = normalize(parts[i]);
            };
            return parts.join('|');
        },
        writeFile: function (pluginName, moduleName, write, config) {
            console.log('ng-module!write');
        }
    };

    return ngModule;
    //pluginBuilder: ''
});

/**
* ng plugin loader
* 
* This load takes in the format of:
*   ng-module!name
*   
*/
define('ng',['ng-module', 'module'], function (ngModule, rjsModule) {
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
                var angularModule = ngModule.mockAngularModule(dependencyName);
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
define('example/ng/factory',[], function() {
	return [function($q) {
		return 'abc';
	}];
});
define('example/ng/factory2',['ng!./factory'], function() {
	return ['./factory', function(factory) {
		return 'factory2' + factory;
	}];
});
define('example/module2',['ng!./ng/factory2'], function() {
	return function(module) {
		module.value(module.name + '/helloworld', 'hello world!');
	};
});
define('example/package1/service/factory',[], function(){
	return function() {

	};
});
define('example/package1/module1',['ng!./service/factory'], function() {
	return function(module) {
		module.value(module.name + '/abc', 'abc');
	};
});
define('example/package1/service/provider',[], function(){
	return {
		$get: function() {

		}
	};
});
define('example/package1/module2',['ng!./service/provider'], function() {
	return function(module) {
		module.value(module.name + '/xyz', 'xyz');
	};
});
define('example/package1/index',['ng-module!./module1', 'ng-module!./module2'], function() {
	return [];
});
define('example/package1', ['example/package1/index'], function (main) { return main; });

define('example/module1',['ng-module!./module2', 'ng-module!example/package1'], function() {
	return function(module) {
	};
});
define('example/app',['ng-module!./module1'], function(){
	
});