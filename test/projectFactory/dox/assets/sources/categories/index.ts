import { child } from './child/child';
import { greatGrandchild } from './greatGrandchild/greatGrandchild';
import * as grandchildSpace from './grandchild/grandchild';
import defaultExport from './child/child';

export { child, grandchildSpace, defaultExport };

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
/** And a comment for why these exports are here */
export { func, arrowFunc, enumerator, Class } from './child/kinds';
export function localFunc() {}
export class LocalClass {
	static localMember = 'localMemberValue';
}

const { localMember } = LocalClass;

export default moduleDeclaration;
