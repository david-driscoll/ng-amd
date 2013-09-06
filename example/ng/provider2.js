define([], function() {
	var fn = function($q) {
		return 'provider2';
	};

	fn.$inject = ['./provider'];

	return fn;
})