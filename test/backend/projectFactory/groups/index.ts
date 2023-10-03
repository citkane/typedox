import { child } from './child/child';
import { greatGrandchild } from './greatGrandchild/greatGrandchild';
import * as grandchildSpace from './grandchild/grandchild';
// @ts-ignore
import * as emptySpace from './emptyFile';

export { child, emptySpace, grandchildSpace };

export import grandchild = grandchildSpace.grandchild;

export * as childSpace from './child/child';
export * from './child/child';

const nsExport = 'nsExport';
export namespace moduleDeclaration {
	nsExport;
	greatGrandchild;
}
export namespace emptyDeclaration {}
export import rabbitHole = moduleDeclaration;

export type isTypeOnly = string;
export const localExport = 'localExport';
const localDeclaration = 'localDeclaration';
export type localDeclaration = typeof localDeclaration;
export { localDeclaration, localDeclaration as localAlias };

export { func, arrowFunc, variable, enumerator, Class } from './child/kinds';
export function localFunc() {}
export class LocalClass {}

export default moduleDeclaration;
