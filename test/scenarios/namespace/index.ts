import { isExported } from './children';

const larry = 'larry';
const marta = 'marta';
const localOnly = 'localOnly';

export { larry as otherLarry, marta, isExported };
export * as children from './children';
export { Mary } from './grandchildren';
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

export module moduleDeclaration {
	export const one = 1;
}
export namespace nameSpaceDeclarartion {
	export const one = 1;
}
