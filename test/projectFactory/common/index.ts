type foo = 'localVarValue' | 'foo';

/** A local string variable */
const localVar: foo = 'localVarValue';

const foo = { bar: 'bar' };
const { bar } = foo;
const { child } = require('./child/child');
//const { SyntaxKind } = require('typescript') as typeof import('typescript');
const { ra } = { ra: 'ra' };
const [ba] = ['ba'];
export = {
	child,
	bar,
	simple: localVar,
	stringValue: 'stringValueValue',
	objectValue: {},
	arrayValue: [],
	arrowFnc: () => {},
	fnc: function () {},
};
