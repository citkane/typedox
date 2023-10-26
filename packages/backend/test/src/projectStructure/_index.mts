import func_DoxBranch from './functional.DoxBranch.spec.mjs';
import func_DoxDeclaration from './functional.DoxDeclaration.spec.mjs';
import func_DoxDeclarationRelations from './functional.DoxDeclarationRelations.spec.mjs';
import func_DoxPackage from './functional.DoxPackage.spec.mjs';
import funcDoxProject from './functional.DoxProject.spec.mjs';
import funcDoxReference from './functional.DoxReference.spec.mjs';
import funcDoxSourceFile from './functional.DoxSourceFile.spec.mjs';
import unit_Dox from './unit.Dox.spec.mjs';
import unit_Doxpackage from './unit.DoxPackage.spec.mjs';

export default {
	functional: {
		funcDoxProject,
		DoxReference: funcDoxReference,
		DoxSourceFile: funcDoxSourceFile,
		DoxDeclaration: func_DoxDeclaration,
		DoxDeclarationRelations: func_DoxDeclarationRelations,
		DoxPackage: func_DoxPackage,
		DoxBranch: func_DoxBranch,
	},
	unit: {
		Dox: unit_Dox,
		Doxpackage: unit_Doxpackage,
	},
};
