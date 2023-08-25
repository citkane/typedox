import * as children from './children';
export { children };
export module moduleDeclaration {
	export const one = 1;
	export const two = 2;
}

declare namespace nameSpaceDeclaration {
	const farts = 'clean';
	export const one = 1;
	export { farts };
}
export { nameSpaceDeclaration };

/*
const larry = 'larry';
const marta = 1;

export function farts() {}

export { larry as otherLarry, marta };

import isExported from './children';

declare namespace nameSpaceDeclaration {
	const farts = 'clean';
	export { isExported };
	export const one = 1;
	export { farts };
}
export { nameSpaceDeclaration };

export module moduleDeclaration {
	export const one = 1;
	export const two = 2;
}

export const poop = () => {};

export { default as Bob } from './grandchildren/classes';

export type isString = string;
export interface isInterface {}
export enum isEnumerator {
	one,
	two,
	three,
}

export const a = 1,
	b = 2,
	c = 3;
*/
