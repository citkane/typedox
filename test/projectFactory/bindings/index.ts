class LocalClass {
	localProperty = function () {};
}
function localFunction() {
	return foo;
}
const foo = { bar: 'bar' };
const song = {
	doe: 'a deer',
	ray: 'a drop of golden sun',
	me: 'a name I call myself',
	far: 'a long long way to run',
};
const chords = [song.doe, song.ray, song.me, song.far];
export const { bar } = foo;
export const { child } = require('./child/child.js');
export const { localProperty } = new LocalClass();
export const { bar: foobar } = localFunction();

//const { SyntaxKind } = require('typescript') as typeof import('typescript');
export const { ra, la } = { ra: 'ra', la: 'ba' };
export const [ba] = ['ba', 'ra', 2];
export const { doe, ...rem } = song;
export const [d, ...r] = chords;
