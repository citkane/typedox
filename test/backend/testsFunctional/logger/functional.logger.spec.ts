import * as ts from 'typescript';
import { assert } from 'chai';
import { stub } from 'sinon';
import { logger as log, logLevels } from '../../../../src/backend/typedox';
import { Logger } from '../../../../src/backend/logger/Logger';

describe('class Logger', function () {
	let testLog: Logger;

	before(function () {
		log.setLogLevel(logLevels.error);
	});

	it('creates a class', function () {
		assert.doesNotThrow(() => (testLog = new Logger(logLevels.debug)));
	});
	it('processes debug, info, warn, error', function () {
		['debug', 'info', 'warn'].forEach((level) => {
			const logLevel = logLevels[level];
			testLog.setLogLevel(logLevel + 1);
			assert.isFalse(testLog[level]('foo'));
			testLog.setLogLevel(logLevel);
			assert.isNotFalse(testLog[level]('foo'));
		});
		assert.isNotFalse(testLog.error('foo'));
	});
	it('logs tsSyntaxkinds', function () {
		Object.values(ts.SyntaxKind)
			.filter((key) => typeof key === 'number')
			.forEach((key) => {
				const infStub = stub(testLog, 'info').callsFake((arg) => {
					assert.equal(arg, ts.SyntaxKind[key]);
				});
				testLog.infoKind(key as any);
				infStub.restore();
			});
	});
	it('logs tsSymbolFlags', function () {
		Object.values(ts.SymbolFlags)
			.filter((key) => typeof key === 'number')
			.forEach((key) => {
				const infStub = stub(testLog, 'info').callsFake((arg) => {
					assert.equal(arg, ts.SymbolFlags[key]);
				});
				testLog.infoFlagSymbol(key as any);
				infStub.restore();
			});
	});
	it('logs tsTypeFlags', function () {
		Object.values(ts.TypeFlags)
			.filter((key) => typeof key === 'number')
			.forEach((key) => {
				const infStub = stub(testLog, 'info').callsFake((arg) => {
					assert.equal(arg, ts.TypeFlags[key]);
				});
				testLog.infoFlagType(key as any);
				infStub.restore();
			});
	});
	it('creates a text stack trace', function () {
		const trace = testLog.stackTracer().split('\n');
		assert.isTrue(
			trace[1].includes(
				'typedox/test/backend/testsFunctional/logger/functional.logger.spec.ts',
			),
		);
	});
});
