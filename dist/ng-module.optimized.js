/* ng-amd - v0.0.1 - 2013-09-18
* Copyright (c) 2013 ; Licensed  */
define([], function() {
    "use strict";
    function parseParts(name) {
        return name.split("|");
    }
    function unwrapModule(name, module) {
        return "function" == typeof module ? module(name) : module;
    }
    function count(string, subString, allowOverlapping) {
        if (string += "", subString += "", subString.length <= 0) return string.length + 1;
        for (var n = 0, pos = 0, step = allowOverlapping ? 1 : subString.length; ;) {
            if (pos = string.indexOf(subString, pos), !(pos >= 0)) break;
            n++, pos += step;
        }
        return n;
    }
    function normalizeModule(parentName, name, isPackage) {
        var parentParts, backSteps, parts = name.split("!"), parentDir = parentName.split("/"), newName = parts[1];
        return parentDir = parentDir.slice(0, parentDir.length - (isPackage ? 0 : 1)).join("/"), 
        newName.indexOf("../") > -1 && (backSteps = count(newName, "../"), parentParts = parentDir.split("/"), 
        parentDir = parentParts.slice(0, parentParts.length - backSteps).join("/"), newName = (parentDir ? parentDir + "/" : "") + newName.replace(/\.\.\//gi, "")), 
        0 === newName.indexOf("./") && (newName = parentDir + "/" + newName.substring(2)), 
        parts[0] + "!" + newName;
    }
    function endsWith(str, suffix) {
        return -1 !== str.indexOf(suffix, str.length - suffix.length);
    }
    function isArray(value) {
        return "[object Array]" === Object.prototype.toString.apply(value);
    }
    function isFunction(value) {
        return "function" == typeof value;
    }
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
    var getXhr, progIds = [ "Msxml2.XMLHTTP", "Microsoft.XMLHTTP", "Msxml2.XMLHTTP.4.0" ], fetchText = function() {
        throw new Error("Environment unsupported.");
    };
    ("undefined" != typeof window && window.navigator && window.document || "undefined" != typeof importScripts) && (getXhr = function() {
        var xhr, i, progId;
        if ("undefined" != typeof XMLHttpRequest) return new XMLHttpRequest();
        for (i = 0; 3 > i; i += 1) {
            progId = progIds[i];
            try {
                xhr = new ActiveXObject(progId);
            } catch (e) {}
            if (xhr) {
                progIds = [ progId ];
                break;
            }
        }
        if (!xhr) throw new Error("getXhr(): XMLHttpRequest not available");
        return xhr;
    }, fetchText = function(url, callback) {
        var xhr = getXhr();
        xhr.open("GET", url, !0), xhr.onreadystatechange = function() {
            4 === xhr.readyState && callback(xhr.responseText);
        }, xhr.send(null);
    });
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
        load: function(name, localRequire, onLoad, config) {
            var angularModule, parts = parseParts(name), dependencyName = parts[0], moduleName = parts[1] || dependencyName, dependencyUrl = localRequire.toUrl(dependencyName), isPackage = !endsWith(dependencyUrl, dependencyName);
            ngModule.serviceMap[dependencyName] = dependencyName, angularModule = angular.module(moduleName, []), 
            angularModule.dependencyName = dependencyName, fetchText(localRequire.toUrl(dependencyName + ".js"), function(moduleText) {
                var depsMatch = moduleText.match(/define\([\s\S]*?\[([\s\S]*?)\]/im);
                if (depsMatch && depsMatch[1]) {
                    for (var depsText = depsMatch[1], deps = depsText.replace(/['|"|\s|\n|\r]/gi, "").split(","), i = deps.length - 1; i >= 0; i--) {
                        var dep = deps[i];
                        if (-1 === dep.indexOf("ng-module!")) deps.splice(i, 1); else {
                            var normalizedName = normalizeModule(dependencyName, dep, isPackage);
                            deps[i] = normalizedName, angularModule.requires.push(normalizedName.split("!")[1]);
                        }
                    }
                    localRequire(deps, function() {
                        ngModule.finishLoad(localRequire, dependencyName, angularModule, onLoad);
                    });
                } else ngModule.finishLoad(localRequire, dependencyName, angularModule, onLoad);
            });
        },
        finishLoad: function(localRequire, name, angularModule, onLoad) {
            localRequire([ name ], function(module) {
                isFunction(module) && module(angularModule), onLoad(angularModule);
            });
        },
        normalize: function(name, normalize) {
            for (var parts = parseParts(name), i = parts.length - (parts.length > 1 ? 2 : 1); i >= 0; i--) parts[i] = normalize(parts[i]);
            return parts.join("|");
        }
    };
    return ngModule;
});