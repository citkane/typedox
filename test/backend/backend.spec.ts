describe('Logger', function () {
	describe('Logger: Unit tests', function () {
		require('./unitTests/unit.logger.spec');
	});
	describe('Logger: Functional tests', function () {
		require('./functionalTests/functional.logger.spec');
	});
});
describe('Configuration and options', function () {
	describe('Configuration and options: Unit tests', function () {
		require('./unitTests/unit.options.spec');
	});
	describe('Configuration and options: Functional tests', function () {
		require('./functionalTests/functional.options.spec');
	});
});
describe('tscApiWrapper', function () {
	describe('tscApiWrapper: Functional tests', function () {
		require('./functionalTests/functional.tscWrapper.spec');
	});
});
