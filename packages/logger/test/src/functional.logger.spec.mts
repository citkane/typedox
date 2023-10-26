import { assert } from 'chai';
import { doxStub } from 'typedox-test';
import { Logger, log, logLevels } from 'typedox/logger';

const localLogLevel = logLevels.silent;

export default function () {
	describe('class Logger', function () {
		const getTestLog = (level = logLevels.debug) => new Logger(level);

		before(function () {
			log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
		});

		it('creates a class', function () {
			assert.doesNotThrow(() => new Logger(logLevels.debug));
		});
		it('processes debug, info, warn, error', function () {
			const testLog = getTestLog();

			['debug', 'info', 'warn'].forEach((l) => {
				const level = l as Exclude<keyof typeof logLevels, 'silent'>;
				const logLevel = logLevels[level];

				testLog.setLogLevel(Number(logLevel) + 1);
				assert.isFalse(testLog[level]('foo'));
				testLog.setLogLevel(logLevel);
				assert.isNotFalse(testLog[level]('foo'));
			});
			assert.isNotFalse(testLog.error('foo'));
		});

		it('creates a text stack trace', function () {
			const testLog = getTestLog();
			const trace = testLog.stackTracer().split('\n');
			assert.include(
				trace[1],
				'logger/test/src/functional.logger.spec',
				trace[1],
			);
		});
	});
}
