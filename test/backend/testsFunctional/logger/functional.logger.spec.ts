import * as ts from 'typescript';
import { assert } from 'chai';
import { stub } from 'sinon';
import { logger as log, logLevels } from '../../../../src/backend/typedox';
import { Logger } from '../../../../src/backend/logger/Logger';

describe('class Logger', function () {
	const getTestLog = (level = logLevels.debug) => new Logger(level);

	before(function () {
		log.setLogLevel(logLevels.error);
	});

	it('creates a class', function () {
		assert.doesNotThrow(() => new Logger(logLevels.debug));
	});
	it('processes debug, info, warn, error', function () {
		const testLog = getTestLog();

		['debug', 'info', 'warn'].forEach((l) => {
			const level = l as keyof typeof logLevels;
			const logLevel = logLevels[level];

			testLog.setLogLevel(Number(logLevel) + 1);
			assert.isFalse(testLog[level]('foo'));
			testLog.setLogLevel(logLevel);
			assert.isNotFalse(testLog[level]('foo'));
		});
		assert.isNotFalse(testLog.error('foo'));
	});
	it('logs tsSyntaxKinds', function () {
		const testLog = getTestLog();
		Object.values(ts.SyntaxKind)
			.filter((key) => typeof key === 'number')
			.forEach((key) => {
				const infStub = stub(testLog, 'info').callsFake((arg) => {
					assert.equal(arg, ts.SyntaxKind[key as number]);
				});
				testLog.infoKind(key as number);
				infStub.restore();
			});
	});
	it('logs tsSymbolFlags', function () {
		const testLog = getTestLog();
		Object.values(ts.SymbolFlags)
			.filter((key) => typeof key === 'number')
			.forEach((key) => {
				const infStub = stub(testLog, 'info').callsFake((arg) => {
					assert.equal(arg, ts.SymbolFlags[key as number]);
				});
				testLog.infoFlagSymbol(key as any);
				infStub.restore();
			});
	});
	it('logs tsTypeFlags', function () {
		const testLog = getTestLog();
		Object.values(ts.TypeFlags)
			.filter((key) => typeof key === 'number')
			.forEach((key) => {
				const infStub = stub(testLog, 'info').callsFake((arg) => {
					assert.equal(arg, ts.TypeFlags[key as number]);
				});
				testLog.infoFlagType(key as any);
				infStub.restore();
			});
	});
	it('creates a text stack trace', function () {
		const testLog = getTestLog();
		const trace = testLog.stackTracer().split('\n');
		assert.isTrue(
			trace[1].includes(
				'typedox/test/backend/testsFunctional/logger/functional.logger.spec.ts',
			),
		);
	});
});
