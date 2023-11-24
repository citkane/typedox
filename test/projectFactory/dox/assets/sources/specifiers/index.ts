import TypeScript from 'typescript';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import clause from './child/child';
import { grandchild, childSpace } from './grandchild/grandchild';
import * as grandchildSpace from './grandchild/grandchild';

type localType = typeof localVar;
type foo = 'localVarValue' | 'foo';

/** A local string variable */
const localVar: foo = 'localVarValue';

declare namespace local {
	const foo = 'foo';
}

declare namespace local {
	const bar = 'bar';
}

export {
	clause as fileImportClause,
	TypeScript as moduleImportClause,
	EventEmitter as externalImportSpecifer,
};
export namespace moduleDeclaration {
	local;
	childSpace;
}

export {
	localType,
	localVar,
	grandchild,
	grandchildSpace,
	childSpace as nsImportSpecifier,
	fs,
};
export { child, grandchild as remote } from './child/child';
export type { childType, grandchildType } from './child/child';

export * from './child/child';

export * as namespaceExport from './child/child';
export import TypeScript = TypeScript;
export import bar = local.bar;
export import local = local;
export default clause;

export interface interfaceDeclaration {
	fooType: string;
}
export interface interfaceDeclaration {
	barType: string;
}
