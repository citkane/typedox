import { logLevels, loggerUtils } from 'typedox';
import * as chai from 'chai';
import chaiExclude from 'chai-exclude';

chai.use(chaiExclude);

export const globalLogLevel: logLevels | undefined = undefined; //logLevels.error;

const { colourise } = loggerUtils;
const _unitTest = colourise('Bright', 'Unit tests');
const _functionalTest = colourise('Bright', 'Functional tests');
const _endToEndTest = colourise('Bright', 'End to end test');

import logger_unit from './backend/logger/unit.logger.spec.mjs';
import logger_functional from './backend/logger/functional.logger.spec.mjs';
describe(title('Logger'), function () {
	describe(unitTest('Logger'), logger_unit);
	describe(functionalTest('Logger'), logger_functional);
});

import conf_unit from './backend/config/unit.config.spec.mjs';
import conf_functional from './backend/config/functional.config.spec.mjs';
describe(title('Configuration and options'), function () {
	describe(unitTest('Configuration and options'), conf_unit);
	describe(functionalTest('Configuration and options'), conf_functional);
});

import wrap_functional from './backend/tsWrapper/functional.tsWrapper.spec.mjs';
describe(title('tsWrapper'), function () {
	describe(functionalTest('tsWrapper'), wrap_functional);
});

import struc_unit_dox from './backend/projectStructure/unit.Dox.spec.mjs';
import struc_functional_project from './backend/projectStructure/functional.DoxProject.spec.mjs';
import struc_unit_package from './backend/projectStructure/unit.DoxPackage.spec.mjs';
import struc_functional_package from './backend/projectStructure/functional.DoxPackage.spec.mjs';
import struc_functional_reference from './backend/projectStructure/functional.DoxReference.spec.mjs';
import struc_functional_sourcefile from './backend/projectStructure/functional.DoxSourceFile.spec.mjs';
import struc_functional_declaration from './backend/projectStructure/functional.DoxDeclaration.spec.mjs';
import struc_functional_declarationrelations from './backend/projectStructure/functional.DoxDeclarationRelations.spec.mjs';
import struc_functional_branch from './backend/projectStructure/functional.Branch.spec.mjs';

describe(title('Project structure'), function () {
	describe(unitTest('Dox'), struc_unit_dox);
	describe(functionalTest('DoxProject'), struc_functional_project);
	describe(unitTest('DoxPackage'), struc_unit_package);
	describe(functionalTest('DoxPackage'), struc_functional_package);
	describe(functionalTest('DoxReference'), struc_functional_reference);
	describe(functionalTest('DoxSourceFile'), struc_functional_sourcefile);
	describe(functionalTest('DoxDeclaration'), struc_functional_declaration);
	describe(
		functionalTest('DoxDeclaration relations'),
		struc_functional_declarationrelations,
	);
	describe(functionalTest('Branch'), struc_functional_branch);
});

import ser_functional from './backend/serialiser/functional.serialiser.spec.mjs';
import ser_functional_variables from './backend/serialiser/functional.serialiser.variables.spec.mjs';
import ser_functional_structure from './backend/serialiser/functional.serialiser.projectStructure.spec.mjs';
describe(title('serialiser'), function () {
	describe(functionalTest('serialiser'), ser_functional);
	describe(functionalTest('serialiser variables'), ser_functional_variables);
	describe(
		functionalTest('serialiser project structure'),
		ser_functional_structure,
	);
});

import e2e from './backend/endToEnd.main.spec.mjs';
describe(title('Backend'), e2e);

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
