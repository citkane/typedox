export type overloaded = typeof overloaded;
export function overloaded();
export function overloaded(foo: string);
export function overloaded(foo?: string) {
	console.log(foo);
}

export type explicit = 'explicitType';
export function explicit();
export function explicit(foo: string);
export function explicit(foo?: string) {
	console.log(foo);
}

export enum enumerator {
	'one',
}

export enum enumerator {
	'two' = 2,
}

export enum enumerator {
	'three' = 3,
}
