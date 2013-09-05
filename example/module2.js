define([], function() {
	return function(module) {
		module.value(module.name + '/helloworld', 'hello world!');
	};
});