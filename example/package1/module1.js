define(['ng!./service/factory'], function() {
	return function(module) {
		module.value(module.name + '/abc', 'abc');
	};
});