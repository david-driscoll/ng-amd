define(['lodash', 'ng', 'angular-mocks'], function(_){
	describe('ng-module', function() {
		angular.module('app', []);

		it('should load and inject factory services', function(done) {
			var injector;
			require(['ng!example/ng/factory'], function() {
				injector = angular.injector(['app']);
				expect(injector.get('example/ng/factory')).to.be.equal('abc');

				done();
			})
		});

		it('should load and inject provider services', function(done) {
			var injector;
			require(['ng!example/ng/provider'], function() {
				injector = angular.injector(['app']);
				expect(injector.get('example/ng/provider')).to.be.equal('def');

				done();
			})
		});

		it('should load and inject factory services with dependencies', function(done) {
			var injector;
			require(['ng!example/ng/factory2'], function() {
				injector = angular.injector(['app']);
				expect(injector.get('example/ng/factory2')).to.be.equal('factory2');

				done();
			})
		});

		it('should load and inject provider services with dependencies', function(done) {
			var injector;
			require(['ng!example/ng/provider2'], function() {
				injector = angular.injector(['app']);
				expect(injector.get('example/ng/provider2')).to.be.equal('provider2');

				done();
			})
		});
	});
});