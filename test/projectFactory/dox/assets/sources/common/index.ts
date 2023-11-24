type foo = 'localVarValue' | 'foo';
const localVar: foo = 'localVarValue';
const { default: child } = require('./child/child');

export = {
	child,
	simple: localVar,
	stringValue: 'stringValueValue',
	objectValue: {},
	arrayValue: [],
	arrowFnc: () => {},
	fnc: function () {},
};
