export * as grandchildren from './grandchildren';

export * as children from './children';
export module rootModule {}
declare namespace rootNameSpace {}
export { rootNameSpace };

export * from './grandchildren';

export * from './children';

export class rootClass {}
export const rootConst = 'rootConst';
export function rootFunction() {}
export const rootArrowFunction = () => {};
export enum rootEnum {}

/*
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
*/
