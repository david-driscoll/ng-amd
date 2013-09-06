define(['lodash', 'ng-module'], function(_, ngBootstrap){
	describe('ng-module', function() {
		it('should load dependent modules', function(done) {
			var injector;

			require(['ng-module!example/module1'], function(module) {
				injector = angular.injector(['example/module1']);
				expect(injector.get('example/module2/helloworld')).to.be.equal('hello world!');

				done();
			});
		});

		it('should load package dependent modules', function(done) {
			var injector;

			require(['ng-module!example/package1'], function(module) {
				injector = angular.injector(['example/package1']);
				expect(injector.get('example/package1/module1/abc')).to.be.equal('abc');

				done();
			});
		});
	});
});