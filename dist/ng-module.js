/**
 * Angular-module loader plugin
 */
define([], function () {
    'use strict';
    function parseParts(name) { return name.split('|'); }
    function unwrapModule(name, module) { return (typeof module === 'function' ? module(name) : module); }
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
            newName = parts[1],
            parentParts, backSteps;
        parentDir = parentDir.slice(0, parentDir.length- ( isPackage ? 0 : 1 )).join('/');

        if (newName.indexOf('../') > -1) {
            backSteps = count(newName, '../');
            parentParts = parentDir.split('/');
            parentDir = parentParts.slice(0, parentParts.length - backSteps).join('/');

            newName = (parentDir ? parentDir + '/' : '') + newName.replace(/\.\.\//gi, '');
        }

        if (newName.indexOf('./') === 0) {
            newName = parentDir + '/' + newName.substring(2);
        }

        return parts[0] + '!' + newName;
    }

    function endsWith(str, suffix) { return str.indexOf(suffix, str.length - suffix.length) !== -1; }

    function isArray(value) { return Object.prototype.toString.apply(value) === '[object Array]'; }
    function isFunction(value){return typeof value === 'function';}
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
        };

    if (typeof process !== 'undefined' &&
               process.versions &&
               !!process.versions.node) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');
        fetchText = function (path, callback) {
            callback(fs.readFileSync(path, 'utf8'));
        };
    } else if ((typeof window !== 'undefined' && window.navigator && window.document) || typeof importScripts !== 'undefined') {
        // Browser action
        getXhr = function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== 'undefined') {
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
                throw new Error('getXhr(): XMLHttpRequest not available');
            }

            return xhr;
        };

        fetchText = function (url, callback) {
            var xhr = getXhr();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function () {
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
                encoding = 'utf-8',
                file = new java.io.File(path),
                lineSeparator = java.lang.System.getProperty('line.separator'),
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
                moduleName = parts[1] || dependencyName,
                dependencyUrl = localRequire.toUrl(dependencyName),
                isPackage = !endsWith(dependencyUrl, dependencyName),
                angularModule;

            ngModule.serviceMap[dependencyName] = dependencyName;
            
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
                    }
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
            }
            return parts.join('|');
        }
        // Needed? doesn't appear to be.
        //writeFile: function (pluginName, moduleName, write, config) {
        //}
    };

    return ngModule;
    //pluginBuilder: ''
});
