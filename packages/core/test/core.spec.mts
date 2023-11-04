import { doxFormat } from '@typedox/test';
import config from './config/_index.mjs';
import projectStructure from './projectStructure/_index.mjs';

export default function coreTest() {
	describe(doxFormat.title('Configuration and options'), function () {
		describe(doxFormat.unitTest('Configuration and options'), config.unit);
		describe(
			doxFormat.functionalTest('Configuration and options'),
			config.functional,
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
}
