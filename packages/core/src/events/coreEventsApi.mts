import {
	DoxDeclaration,
	DoxPackage,
	DoxProject,
	DoxReference,
	DoxSourceFile,
} from '../index.mjs';

export type coreEventsApi = typeof coreEventsApi;
export const coreEventsApi = {
	'core.declarations.findRootDeclarations': findRootDeclarations,
	'core.project.begin': projectStaged,
	'core.project.end': projectStaged,
	'core.package.begin': packageStaged,
	'core.package.end': packageStaged,
	'core.reference.begin': referenceStaged,
	'core.reference.file.discovered': referenceFileStaged,
	'core.reference.file.registered': referenceFileStaged,
	'core.reference.discoveredDeclarations': referenceStaged,
	'core.reference.end': referenceStaged,
	'core.declaration.begin': declarationStaged,
	'core.declaration.declared': declarationStaged,
	'core.declaration.end': declarationStaged,
};

function findRootDeclarations(
	this: DoxDeclaration,
	accumulator: DoxDeclaration[],
	packageName: string,
	referenceName: string,
) {
	return DoxDeclaration.findRootDeclarations.call(
		this,
		accumulator,
		packageName,
		referenceName,
	);
}
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
