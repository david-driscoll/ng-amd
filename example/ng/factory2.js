define(['ng!./factory'], function() {
	return ['./factory', function(factory) {
		return 'factory2' + factory;
	}];
})