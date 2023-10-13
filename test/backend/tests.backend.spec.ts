import { logLevels, loggerUtils } from '../../src/backend/typedox';
export const globalLogLevel: logLevels | undefined = undefined;

const { colourise } = loggerUtils;
const _unitTest = colourise('Bright', 'Unit tests');
const _functionalTest = colourise('Bright', 'Functional tests');
const _endToEndTest = colourise('Bright', 'End to end test');

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
	describe(unitTest('DoxPackage'), function () {
		require('./testsUnit/projectStructure/unit.DoxPackage.spec');
	});
	describe(functionalTest('DoxPackage'), function () {
		require('./testsFunctional/projectStructure/functional.DoxPackage.spec');
	});
	describe(functionalTest('DoxReference'), function () {
		require('./testsFunctional/projectStructure/functional.DoxReference.spec');
	});
	describe(functionalTest('DoxSourceFile'), function () {
		require('./testsFunctional/projectStructure/functional.DoxSourceFile.spec');
	});
	describe(functionalTest('DoxDeclaration'), function () {
		require('./testsFunctional/projectStructure/functional.DoxDeclaration.spec');
	});
	describe(functionalTest('DoxDeclaration relations'), function () {
		require('./testsFunctional/projectStructure/functional.DoxDeclarationRelations.spec.ts');
	});
	describe(functionalTest('Branch'), function () {
		require('./testsFunctional/projectStructure/functional.Branch.spec');
	});
});
describe(title('serialiser'), function () {
	describe(unitTest('serialiser'), function () {
		require('./testsUnit/serialiser/unit.serialiser.spec');
	});
});
describe(title('Backend'), function () {
	describe(endToEndTest('main'), function () {
		require('./testsEndToEnd/endToEnd.main.spec');
	});
});

function title(text: string) {
	return colourise('Underscore', text.toLocaleUpperCase());
}
function unitTest(text: string) {
	return `${_unitTest}: ${colourise('FgBlue', text)}`;
}
function functionalTest(text: string) {
	return `${_functionalTest}: ${colourise('FgBlue', text)}`;
}
function endToEndTest(text: string) {
	return `${_endToEndTest}: ${colourise('FgBlue', text)}`;
}
