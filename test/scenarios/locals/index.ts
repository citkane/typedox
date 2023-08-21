class LocalClass<T> {
	foo: T;
	constructor(foo: T) {
		this.foo = foo;
	}
}

export let stringVar = 'stringy';
export const numvar = 123;
export const arrayLet = [1, 2, 3];
export const objectVar = { a: 1 };
export const bool = true;
export const localClass = new LocalClass<string>('foo');
export const map = new Map([
	[1, 'one'],
	[2, 'two'],
]);
export const objectArray = new Object([1, 2, 3]);
export const objectRecord = new Object({ 1: 'one', 2: 'two', 3: 'three' });

export function fun() {
	return null;
}

export const drink = () => 'hangover';
