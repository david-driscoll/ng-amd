define(['ng!./ng/factory2'], function() {
	return function(module) {
		module.value(module.name + '/helloworld', 'hello world!');
	};
});