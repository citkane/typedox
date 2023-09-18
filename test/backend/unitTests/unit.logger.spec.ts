import * as stubs from '../stubs.spec';

import { assert } from 'chai';
import { stub } from 'sinon';
import {
	logger as log,
	config,
	loggerUtils,
} from '../../../src/backend/typedox';

describe('logging tools', function () {
	it('logs help information', function () {
		const loggedArgs: string[] = [];
		const stubLog = stub(log, 'log');
		const stubGroup = stub(log, 'group').callsFake((arg: string) => {
			loggedArgs.push(stubs.unColour(arg).replace('--', ''));
		});

		loggerUtils.logApplicationHelp();
		assert.deepEqual(loggedArgs, Object.keys(config.doxArgs));

		stubLog.restore();
		stubGroup.restore();
	});
	it('parses cl for help request', function () {
		assert.isTrue(loggerUtils.isRequestForHelp(['--help']));
		assert.isFalse(loggerUtils.isRequestForHelp());
	});
	it('tidies newline and double spaces', function () {
		const messy = `   A very
		messy     and 
		split
		
		
		   line   `;
		assert.equal(loggerUtils.toLine(messy), 'A very messy and split line');
	});
	it('identifies subject inputs', function () {
		const Foo = class Foo {};
		const foo = new Foo();

		assert.equal(loggerUtils.identifier(__filename), '[unit.logger.spec]');
		assert.equal(loggerUtils.identifier(123), '[123]');
		assert.equal(loggerUtils.identifier(foo), '[foo]');
		assert.equal(loggerUtils.identifier(Foo), '[Foo]');
		assert.equal(loggerUtils.identifier('notAFilename'), '[notAFilename]');
		assert.equal(loggerUtils.identifier(this), '[context]');
		assert.equal(loggerUtils.identifier({}), '[[object Object]]');
		assert.equal(loggerUtils.identifier([]), '[array]');
	});
	it('inspects items and logs their cleaned up values', function () {
		let valueString: string;
		const stubLog = stub(log, 'log').callsFake((...args) => {
			valueString = loggerUtils.toLine(stubs.unColour(args[1]));
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
		assert.equal(valueString!, "{ foo: 'bar', bar: '[hidden boolean]' }");

		log.inspect({ foo: 'bar', bar: [1, 2, 3] }, ['bar']);
		assert.equal(
			valueString!,
			"{ foo: 'bar', bar: '[hidden (3): Array]' }",
		);

		log.inspect(['foo', 'bar']);
		assert.equal(valueString!, "[ 'foo', 'bar' ]");

		const foo = 'foo';
		const bar = undefined;
		const circular = { foo, bar };
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
});
