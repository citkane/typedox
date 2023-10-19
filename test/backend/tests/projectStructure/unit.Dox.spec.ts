import ts from 'typescript';
import { assert } from 'chai';
import { logLevels, logger as log, Dox } from '../../../../src/backend/typedox';
import { globalLogLevel } from '../../tests.backend.spec';

const localLogLevel = logLevels.silent;
before(function () {
	log.setLogLevel(globalLogLevel || localLogLevel);
});

it('identifies specifierKinds', function () {
	const values = Object.values(ts.SyntaxKind)
		.map((kind) => Dox.isSpecifierKind(kind as any))
		.filter((value) => !!value);
	assert.equal(values.length, 9);
});
