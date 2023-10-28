import {
	DoxDeclaration,
	DoxPackage,
	DoxProject,
	DoxReference,
	DoxSourceFile,
} from '../index.mjs';

export const eventsApi = {
	/** accumulates the doxDeclarations which have no parents, ie. the root project declarations */
	'declarations.findRootDeclarations': DoxDeclaration.findRootDeclarations,
	'project.begin': projectStaged,
	'project.end': projectStaged,
	'package.begin': packageStaged,
	'package.end': packageStaged,
	'reference.begin': referenceStaged,
	'reference.file.discovered': referenceFileStaged,
	'reference.file.registered': referenceFileStaged,
	'reference.discoveredDeclarations': referenceStaged,
	'reference.end': referenceStaged,
	'declaration.begin': declarationStaged,
	'declaration.declared': declarationStaged,
	'declaration.end': declarationStaged,
};

function projectStaged(doxProject: DoxProject) {}
function packageStaged(doxPackage: DoxPackage, npmPackage?: object) {}
function referenceStaged(doxReference: DoxReference) {}
function referenceFileStaged(
	doxReference: DoxReference,
	fileName: string,
	skip: (skip: boolean) => void,
	sourceFile?: DoxSourceFile,
) {}
function declarationStaged(declaration: DoxDeclaration) {}
