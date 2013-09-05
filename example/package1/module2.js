define(['ng!./service/provider'], function() {
	return function(module) {
		module.value(module.name + '/xyz', 'xyz');
	};
});