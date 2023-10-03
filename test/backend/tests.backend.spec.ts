import { loggerUtils } from '../../src/backend/typedox';
const { colourise } = loggerUtils;
const _unitTest = colourise('Bright', 'Unit tests');
const _functionalTest = colourise('Bright', 'Functional tests');
const _endToEndTest = colourise('Bright', 'End to end test');
const title = (text: string) =>
	colourise('Underscore', text.toLocaleUpperCase());
const unitTest = (text: string) => `${_unitTest}: ${colourise('FgBlue', text)}`;
const functionalTest = (text: string) =>
	`${_functionalTest}: ${colourise('FgBlue', text)}`;
const endToEndTest = (text: string) =>
	`${_endToEndTest}: ${colourise('FgBlue', text)}`;

describe(title('Logger'), function () {
	describe(unitTest('Logger'), function () {
		require('./testsUnit/logger/unit.logger.spec');
	});
	describe(functionalTest('Logger'), function () {
		require('./testsFunctional/logger/functional.logger.spec');
	});
});
describe(title('Configuration and options'), function () {
	describe(unitTest('Configuration and options'), function () {
		require('./testsUnit/configurationAndOptions/unit.options.spec');
	});
	describe(functionalTest('Configuration and options'), function () {
		require('./testsFunctional/configurationAndOptions/functional.options.spec');
	});
});
describe(title('tscApiWrapper'), function () {
	describe(functionalTest('tscApiWrapper'), function () {
		require('./testsFunctional/configurationAndOptions/functional.tscWrapper.spec');
	});
});
describe(title('Project structure'), function () {
	describe(functionalTest('DoxProject'), function () {
		require('./testsFunctional/projectStructure/functional.DoxProject.spec');
	});
	describe(unitTest('NpmPackage'), function () {
		require('./testsUnit/projectStructure/unit.NpmPackage.spec');
	});
	describe(functionalTest('NpmPackage'), function () {
		require('./testsFunctional/projectStructure/functional.NpmPackage.spec');
	});
	describe.skip(functionalTest('Branch'), function () {
		require('./testsFunctional/projectStructure/functional.Branch.spec');
	});
	describe(functionalTest('TsReference'), function () {
		require('./testsFunctional/projectStructure/functional.TsReference.spec');
	});
	describe(functionalTest('TsSourceFile'), function () {
		require('./testsFunctional/projectStructure/functional.TsSourceFile.spec');
	});
	describe(functionalTest('TsDeclaration'), function () {
		require('./testsFunctional/projectStructure/functional.TsDeclaration.spec');
	});
	describe(functionalTest('TsDeclaration relations'), function () {
		require('./testsFunctional/projectStructure/functional.TsDeclarationRelations.spec.ts');
	});
});
describe.skip(title('serialiser'), function () {
	describe(unitTest('serialiser'), function () {
		require('./testsUnit/serialiser/unit.serialiser.spec');
	});
});
describe.skip(title('Backend'), function () {
	describe(endToEndTest('main'), function () {
		require('./testsEndToEnd/endToEnd.main.spec');
	});
});
