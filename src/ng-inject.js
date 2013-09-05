/**
* ng plugin loader
* 
* This load takes in the format of:
*   ng!name[:moduleName]

The default module name is app, or configured through the require js settings.
*/
define(function () {
    return {
        load: function (name, parentRequire, onLoad, config) {

        },
        normalize: function (name, normalize) {

        },
        write: function (pluginName, moduleName, write, config) {
            throw new Error('NYI!');
        }
    };
    //pluginBuilder: ''
});