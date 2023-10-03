import TypeScript from 'typescript';
import clause from './child/child';
import { grandchild, childSpace } from './grandchild/grandchild';
import * as grandchildSpace from './grandchild/grandchild';

const localVar = 'localVar';

declare namespace local {
	const foo = 'foo';
}

declare namespace local {
	const bar = 'bar';
}

export { clause as fileImportClause, TypeScript as moduleImportClause };
export namespace moduleDeclaration {
	local;
	childSpace;
}

export {
	localVar,
	grandchild,
	grandchildSpace,
	childSpace as nsImportSpecifier,
};
export { child } from './child/child';

export * from './child/child';
export * from './grandchild/grandchild';

export * as childSpace from './child/child';
export import TypeScript = TypeScript;
export import bar = local.bar;
export import local = local;
export default clause;
