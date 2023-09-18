import { childFoo } from './tsWrapperChild';
const bar = 'bar';
export type bar = typeof bar;
export type isTypeOnly = string;
export const foo = 'foo';
export const fnc = () => null;
export { bar as alias };
export { bar };
export { childFoo };
export class IsClass {}

export * as child from './tsWrapperChild';
export * from './tsWrapperChild';
