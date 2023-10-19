import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
chai.use(chaiExclude);

import { logLevels, loggerUtils } from '../../src/backend/typedox';
export const globalLogLevel: logLevels | undefined = undefined; //logLevels.error;

const { colourise } = loggerUtils;
const _unitTest = colourise('Bright', 'Unit tests');
const _functionalTest = colourise('Bright', 'Functional tests');
const _endToEndTest = colourise('Bright', 'End to end test');

describe(title('Logger'), function () {
	describe(unitTest('Logger'), function () {
		require('./tests/logger/unit.logger.spec');
	});
	describe(functionalTest('Logger'), function () {
		require('./tests/logger/functional.logger.spec');
	});
});
describe(title('Configuration and options'), function () {
	describe(unitTest('Configuration and options'), function () {
		require('./tests/config/unit.config.spec');
	});
	describe(functionalTest('Configuration and options'), function () {
		require('./tests/config/functional.config.spec');
	});
});
describe(title('tsWrapper'), function () {
	describe(functionalTest('tsWrapper'), function () {
		require('./tests/tsWrapper/functional.tsWrapper.spec');
	});
});
describe(title('Project structure'), function () {
	describe(unitTest('Dox'), function () {
		require('./tests/projectStructure/unit.Dox.spec.ts');
	});
	describe(functionalTest('DoxProject'), function () {
		require('./tests/projectStructure/functional.DoxProject.spec');
	});
	describe(unitTest('DoxPackage'), function () {
		require('./tests/projectStructure/unit.DoxPackage.spec');
	});
	describe(functionalTest('DoxPackage'), function () {
		require('./tests//projectStructure/functional.DoxPackage.spec');
	});
	describe(functionalTest('DoxReference'), function () {
		require('./tests/projectStructure/functional.DoxReference.spec');
	});
	describe(functionalTest('DoxSourceFile'), function () {
		require('./tests/projectStructure/functional.DoxSourceFile.spec');
	});
	describe(functionalTest('DoxDeclaration'), function () {
		require('./tests/projectStructure/functional.DoxDeclaration.spec');
	});
	describe(functionalTest('DoxDeclaration relations'), function () {
		require('./tests/projectStructure/functional.DoxDeclarationRelations.spec.ts');
	});
	describe(functionalTest('Branch'), function () {
		require('./tests/projectStructure/functional.Branch.spec');
	});
});
describe(title('serialiser'), function () {
	describe(functionalTest('serialiser'), function () {
		require('./tests/serialiser/functional.serialiser.spec');
	});
	describe(functionalTest('serialiser variables'), function () {
		require('./tests/serialiser/functional.serialiser.variables.spec.ts');
	});
	describe(functionalTest('serialiser project structure'), function () {
		require('./tests/serialiser/functional.serialiser.projectStructure.spec');
	});
});
describe(title('Backend'), function () {
	describe(endToEndTest('main'), function () {
		require('./tests/endToEnd.main.spec');
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
