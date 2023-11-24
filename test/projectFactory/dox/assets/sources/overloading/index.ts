/**
 * This enumerator
 */
export enum enumerator {
	'one',
}
export type overloaded = typeof overloaded;
export function overloaded();
export function overloaded(foo: string);
/**
 * This is the only comment for overloaded
 * @param foo
 */
export function overloaded(foo?: string) {
	console.log(foo);
}
/**
 * is purposefully split over mutiple blocks
 */
export enum enumerator {
	'two' = 2,
}
export type explicit = 'explicitType';
export function explicit();
export function explicit(foo: string);
export function explicit(foo?: string) {
	console.log(foo);
}
/**
 * To test the split block parsing capabilities of `typedox`
 */
export enum enumerator {
	'three' = 3,
}
