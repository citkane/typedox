import { log, loggerUtils } from 'typedox/logger';

import { assert } from 'chai';
import { stub } from 'sinon';
import { doxFormat, doxStub } from 'typedox-test';

const __filename = log.getFilename(import.meta.url);

export default function () {
	describe('logging tools', function () {
		let stubLog: ReturnType<typeof stub>;
		let stubGroup: ReturnType<typeof stub>;
		this.afterEach(function () {
			if (stubLog) stubLog.restore();
			if (stubGroup) stubGroup.restore();
		});

		it('tidies newline and double spaces', function () {
			const messy = `   A very
		messy     and 
		split
		
		
		   line   `;
			assert.equal(
				loggerUtils.toLine(messy),
				'A very messy and split line',
			);
		});
		it('identifies subject inputs', function () {
			const Foo = class Foo {};
			const foo = new Foo();

			assert.equal(
				loggerUtils.identifier(__filename),
				'[unit.logger.spec]',
			);
			assert.equal(loggerUtils.identifier(123), '[123]');
			assert.equal(loggerUtils.identifier(foo), '[foo]');
			assert.equal(loggerUtils.identifier(Foo), '[Foo]');
			assert.equal(
				loggerUtils.identifier('notAFilename'),
				'[notAFilename]',
			);
			assert.equal(loggerUtils.identifier(this), '[context]');
			assert.equal(loggerUtils.identifier({}), '[[object Object]]');
			assert.equal(loggerUtils.identifier([]), '[array]');
		});
		it('inspects items and logs their cleaned up values', function () {
			let valueString: string;
			const stubLog = stub(log, 'log').callsFake((...args) => {
				valueString = loggerUtils.toLine(doxFormat.unColour(args[1]));
			});
			log.inspect('foobar');
			assert.equal(valueString!, "'foobar'");

			log.inspect({ foo: 'bar' });
			assert.equal(valueString!, "{ foo: 'bar' }");

			log.inspect({ foo: 'bar', bar: undefined }, true);
			assert.equal(valueString!, "{ foo: 'bar' }");

			log.inspect({ foo: 'bar', bar: false }, true);
			assert.equal(valueString!, "{ foo: 'bar', bar: false }");

			log.inspect({ foo: 'bar', bar: false }, ['bar']);
			assert.equal(
				valueString!,
				"{ foo: 'bar', bar: '[hidden boolean]' }",
			);

			log.inspect({ foo: 'bar', bar: [1, 2, 3] }, ['bar']);
			assert.equal(
				valueString!,
				"{ foo: 'bar', bar: '[hidden (3): Array]' }",
			);

			log.inspect(['foo', 'bar']);
			assert.equal(valueString!, "[ 'foo', 'bar' ]");

			const foo = 'foo';
			const bar = undefined;
			const circular = { foo, bar } as any;
			circular['self'] = circular;
			const circularArray: any[] = [];
			circularArray.push(circularArray);
			circularArray.push('unwanted');

			log.inspect([foo, bar], true);
			assert.equal(valueString!, "[ 'foo' ]");

			log.inspect(circular, true);
			assert.equal(
				valueString!,
				"{ foo: 'foo', self: { foo: '[circular]', bar: '[circular]', self: '[circular]' } }",
			);
			log.inspect(circularArray, true, ['unwanted']);
			assert.equal(valueString!, "[ [ '[circular]' ] ]");

			stubLog.restore();
		});

		it('shortens a string', function () {
			const string = '12345678910111213';
			assert.equal(loggerUtils.shortenString(string), string);
			assert.equal(loggerUtils.shortenString(string, 8), '1234 ... 1213');
			assert.equal(loggerUtils.shortenString('hello', 8), 'hello');
		});
		it('formats bytes', function () {
			assert.equal(loggerUtils.formatBytes(0), '0 Bytes');
			assert.equal(loggerUtils.formatBytes(10), '10 Bytes');
			assert.equal(loggerUtils.formatBytes(10000), '9.77 KiB');
			assert.equal(loggerUtils.formatBytes(10000, -1), '10 KiB');
		});
	});
}
