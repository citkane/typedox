import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
import {
	config,
	projectStructure,
	serialiser,
	tsWrapper,
	e2e,
} from './src/_index.mjs';
import { doxFormat } from 'typedox-test';

chai.use(chaiExclude);

export default function () {
	describe(doxFormat.title('Configuration and options'), function () {
		describe(doxFormat.unitTest('Configuration and options'), config.unit);
		describe(
			doxFormat.functionalTest('Configuration and options'),
			config.functional,
		);
	});
	describe(doxFormat.title('tsWrapper'), function () {
		describe(
			doxFormat.functionalTest('tsWrapper'),
			tsWrapper.functional.tsWrapper,
		);
	});
	describe(doxFormat.title('Project structure'), function () {
		describe(doxFormat.unitTest('Dox'), projectStructure.unit.Dox);
		describe(
			doxFormat.functionalTest('DoxProject'),
			projectStructure.functional.DoxPackage,
		);
		describe(
			doxFormat.unitTest('DoxPackage'),
			projectStructure.unit.Doxpackage,
		);
		describe(
			doxFormat.functionalTest('DoxPackage'),
			projectStructure.functional.DoxPackage,
		);
		describe(
			doxFormat.functionalTest('DoxReference'),
			projectStructure.functional.DoxReference,
		);
		describe(
			doxFormat.functionalTest('DoxSourceFile'),
			projectStructure.functional.DoxSourceFile,
		);
		describe(
			doxFormat.functionalTest('DoxDeclaration'),
			projectStructure.functional.DoxDeclaration,
		);
		describe(
			doxFormat.functionalTest('DoxDeclaration relations'),
			projectStructure.functional.DoxDeclarationRelations,
		);
		describe(
			doxFormat.functionalTest('DoxBranch'),
			projectStructure.functional.DoxBranch,
		);
	});
	describe(doxFormat.title('serialiser'), function () {
		describe(
			doxFormat.functionalTest('serialiser'),
			serialiser.functional.func,
		);
		describe(
			doxFormat.functionalTest('serialiser variables'),
			serialiser.functional.variables,
		);
		describe(
			doxFormat.functionalTest('serialiser project structure'),
			serialiser.functional.projectStructure,
		);
	});
	describe(doxFormat.title('Backend'), function () {
		describe(doxFormat.endToEndTest('End to End'), e2e);
	});
}
