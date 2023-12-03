import {
	DoxDeclaration,
	DoxPackage,
	DoxReference,
	DoxSourceFile,
} from '../index.mjs';

export type coreEventsApi = typeof coreEventsApi;
export const coreEventsApi = {
	'core.sourcefile.declareSourceFile': declareSourceFile,
	'core.package.declarePackage': declarePackage,
	'core.reference.declareReference': declareReference,
	'core.reference.done': doneReference,
	'core.declaration.related': relatedDeclaration,
};

function declareSourceFile(
	filePath: string,
	fileMeta: ReturnType<(typeof DoxSourceFile)['fileMeta']>,
) {}
function declarePackage(doxPackage: DoxPackage) {}
function declareReference(doxReference: DoxReference) {}
function doneReference(doxReference: DoxReference) {}
function relatedDeclaration(declaration: DoxDeclaration) {}
