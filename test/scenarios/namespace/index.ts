export const variableDeclaration = 'variableDeclaration';
export module moduleDeclaration {
	export const one = 1;
	export const two = 2;
}

export * from './children';
export * as namespaceExport from './grandchildren';
import * as exportSpecifier from './children';
export { exportSpecifier };

declare namespace localExportSpecifier {
	const farts = 'clean';
	export const one = 1;
	export { farts };
}
export { localExportSpecifier };

const larry = 'larry';
const marta = 'marta';
export { larry as otherLarry, marta };

import importClause from './children';
export { importClause as isExported };

export { default as DefaultClass } from './grandchildren/classes';
