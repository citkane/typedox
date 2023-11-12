import { assert } from 'chai';
import { CategoryKind } from '@typedox/core';
import { declarationFactory, doxStub } from '@typedox/test';
import { log, logLevels } from '@typedox/logger';
import { SerialiseVariable } from '@typedox/serialiser';
import ts from 'typescript';

const localLogLevel = logLevels.silent;
const escape = ts.escapeLeadingUnderscores;

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});
	it('serialises a string variable', function () {
		const declaration = declarationFactory('common', escape('localVar'));
		const { serialised } = new SerialiseVariable(declaration);
		assert.exists(serialised);
		assert.doesNotThrow(() => JSON.stringify(serialised));
		const { name, category, flags, valueString } = serialised;
		assert.equal(name, 'localVar', name);
		assert.equal(category, CategoryKind.Variable);
		assert.equal(flags.scopeKeyword, 'const', flags.scopeKeyword);
		assert.exists(valueString);
		assert.equal(valueString, "'localVarValue'");
	});
	it('serialises a default string variable', function () {
		const declaration = declarationFactory(
			'common',
			escape('export='),
			'default/string.ts',
		);
		const { serialised } = new SerialiseVariable(declaration);
		assert.exists(serialised);
		assert.doesNotThrow(() => JSON.stringify(serialised));
		const { name, category, flags, location, type, valueString, jsDoc } =
			serialised;
		assert.equal(name, 'export=', name);
		assert.equal(category, CategoryKind.Variable);
		assert.exists(flags);
		assert.isTrue(flags.isDefault);
		assert.notExists(flags.scopeKeyword);
		assert.exists(location);
		assert.exists(type);
		assert.exists(valueString);
		assert.notExists(jsDoc);
	});
}
