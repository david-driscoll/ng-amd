define(['ng!./provider'], function() {
	var fn = function(provider) {
		return 'provider2' + provider;
	};

	fn.$inject = ['./provider'];

	return fn;
})