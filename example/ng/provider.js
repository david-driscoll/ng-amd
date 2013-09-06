define([], function() {
	var fn = function($q) {
		return 'def';
	};

	fn.$inject = [];

	return fn;
})