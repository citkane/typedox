import ts from 'typescript';
import { assert } from 'chai';
import { logLevels, log, Dox } from 'typedox';
import { globalLogLevel } from '../../tests.backend.spec.mjs';

const localLogLevel = logLevels.silent;

export default function () {
	before(function () {
		log.setLogLevel(globalLogLevel || localLogLevel);
	});

	it('identifies specifierKinds', function () {
		const values = Object.values(ts.SyntaxKind)
			.map((kind) => Dox.isSpecifierKind(kind as any))
			.filter((value) => !!value);
		assert.equal(values.length, 9);
	});
}
