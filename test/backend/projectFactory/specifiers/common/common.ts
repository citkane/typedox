const simple = 'simpleValue';
const foo = { bar: 'bar' };
const { bar } = foo;
const { child } = require('./commonChild');
//const { SyntaxKind } = require('typescript') as typeof import('typescript');
export = { child, bar, simple };
