import * as path from 'path';
import * as stubs from '../stubs.spec';
import { assert } from 'chai';
import { logger as log, config, logLevels } from '../../../src/backend/typedox';

before(function () {
	log.setLogLevel(logLevels.error);
});
describe('Commandline arguments', function () {
	const doxArgVstub = Object.entries(stubs.configs.defaultConfig).reduce(
		(accumulator, tuple) => {
			const [key, value] = tuple;
			accumulator.push(`${config.argHyphen}${key}`);
			typeof value === 'string' && accumulator.push(`${value}`);
			return accumulator;
		},
		[] as string[],
	);
	const tscargVStub = ['-b', '--noEmit', '--target', '--esnext'];
	const argvStub = [
		process.argv[0],
		process.argv[1],
		...doxArgVstub,
		...tscargVStub,
	];
	const orphanArgs = [
		'--projectRootDir',
		'--doxOut',
		'--typeDependencies',
		'--logLevel',
		'--tsConfigs',
		'--npmFileConvention',
		'--typedox',
	];
	it('should parse commandline options', function () {
		assert.doesNotThrow(() => config.parseDoxClArgsToOptions());
	});
	it('should parse empty commandline options to empty object', function () {
		const options = config.parseDoxClArgsToOptions([]);
		assert.deepEqual(options, {} as any);
	});
	it('should gather multiple commandline options to array', function () {
		const args = ['--typeDependencies', 'foo', 'bar'];
		const expected = { typeDependencies: ['foo', 'bar'] };
		const options = config.parseDoxClArgsToOptions(args);
		assert.deepEqual(options, expected as any);
	});
	it('should ignore orphan commandline options', function () {
		const options = config.parseDoxClArgsToOptions(orphanArgs);
		assert.deepEqual(options, {} as any);
	});
	it('should include boolean orphan commandline options', function () {
		const doxArgs = config.deepClone(config.doxArgs);
		(doxArgs.typedox as any).defaultValue = false;

		const options = config.parseDoxClArgsToOptions(orphanArgs, doxArgs);
		assert.deepEqual(options, { typedox: true } as any);
	});

	it('should get dox cl arguments', function () {
		const args = config.getClArgs(argvStub, config.doxArgs).doxClArgs;
		assert.deepEqual(args, doxArgVstub);
	});

	it('should get tsc cl arguments', function () {
		const args = config.getClArgs(argvStub).tscClArgs;
		assert.deepEqual(args.slice(2), tscargVStub);
	});
	it('should try to get tsc parsed options from commandline', function () {
		assert.doesNotThrow(() => config.getTscParsedCommandline());
	});
	it('should get tsc parsed options from commandline', function () {
		const options = config.getTscParsedCommandline(tscargVStub);
		assert.deepEqual(options.options, {
			build: true,
			noEmit: true,
			target: undefined,
		});
	});
	it('should read the config file the cl', function () {
		assert.doesNotThrow(() => config.getDoxFilepathFromArgs());
	});
	it('should return the default config file from an empty cl', function () {
		const configFile = config.getDoxFilepathFromArgs([]);
		assert.equal(configFile, stubs.configs.doxConfigFile);
	});
	it('should get the dox config file path from a relative cl argument', function () {
		const configFile = config.getDoxFilepathFromArgs([
			'--typedox',
			'typedox.json1',
		]);

		assert.equal(configFile, stubs.configs.doxConfigFile + 1);
	});
	it('should get the dox config file path from an absolute cl argument', function () {
		const configFile = config.getDoxFilepathFromArgs([
			'--typedox',
			path.join(stubs.configs.rootDir, 'typedox.json2'),
		]);

		assert.equal(configFile, stubs.configs.doxConfigFile + 2);
	});
	it('should throw if cl dox config is not under the project root', function () {
		const clArgv = ['--projectRootDir', '/foo', '--typedox', '/bar'];
		assert.throws(
			() => config.getDoxFilepathFromArgs(clArgv),
			/typedox.json must exist under the project root directory/,
		);
	});
	it('should hyphenate and un-hyphenate arguments', function () {
		assert.equal(config.hyphenateArg('arg'), '--arg');
		assert.equal(config.unHyphenateArg('--arg'), 'arg');
	});
});
describe('Parsed options', function () {
	const badConfigStub = function () {
		let badConfig = config.deepClone(stubs.configs.defaultConfig) as any;
		badConfig.typeDependencies = 123;
		const badConfigs = { wrong: config.deepClone(badConfig) } as any;
		delete badConfig.typeDependencies;
		badConfigs.missing = badConfig;

		return badConfigs as {
			wrong: config.doxOptions;
			missing: config.doxOptions;
		};
	};
	it('should get the default options', function () {
		const autoConfig = config.getDefaultDoxOptions();
		assert.deepEqual(autoConfig, stubs.configs.defaultConfig as any);
	});
	it('should validate the default options', function () {
		assert.doesNotThrow(() =>
			config.validateDoxOptions(stubs.configs.defaultConfig as any),
		);
	});
	it('should throw if required option is missing', function () {
		assert.throws(
			() => config.validateDoxOptions(badConfigStub().missing),
			/A required option was not found/,
		);
	});
	it('should throw if option is incorrect', function () {
		assert.throws(
			() => config.validateDoxOptions(badConfigStub().wrong),
			/An invalid option was found/,
		);
	});
	it('should get and validate custom options', function () {
		const customOptions = config.getDoxOptions(
			stubs.configs.defaultConfig as any,
		);
		assert.deepEqual(customOptions, stubs.configs.defaultConfig as any);
	});
	it('should try to read the default config file', function () {
		assert.doesNotThrow(() => config.getFileDoxOptions());
	});
	it('should read options from a dox config file if it exists', function () {
		const fileInfo = config.getFileDoxOptions([
			'--projectRootDir',
			'test/backend/unitTests',
			'--typedox',
			'typedox.spec.json',
		]);
		assert.deepEqual(fileInfo, {
			doxOut: 'testDocs',
			typeDependencies: ['hay', 'may'],
		} as any);
	});
	it('should return an empty object if there is not a config file', function () {
		const fileInfo = config.getFileDoxOptions([
			'--projectRootDir',
			'test/backend/unitTests',
		]);
		assert.deepEqual(fileInfo, {} as any);
	});
	it('should read options hierarchically with precedence to commandline, then file, then default options', function () {
		const expected = {
			projectRootDir: 'test/backend/unitTests',
			doxOut: 'testDocs',
			typeDependencies: ['foo', 'bar'],
			logLevel: 'info',
			tsConfigs: [],
			npmFileConvention: 'package.json',
			typedox: 'typedox.spec.json',
		};
		const options = config.getDoxOptions(undefined, [
			'--typeDependencies',
			'foo',
			'bar',
			'--projectRootDir',
			'test/backend/unitTests',
			'--typedox',
			'typedox.spec.json',
		]);
		assert.deepEqual(expected, options as any);
	});
});
describe('config tools', function () {
	const deepRef = { foo: 'bar', deep: 'deep' };
	const toFreeze = [
		{
			ref: deepRef,
		} as any,
		[{ bar: 'foo' }, { one: 1 }],
		'foo',
	];
	toFreeze[0].circular = toFreeze;
	toFreeze.push(toFreeze);

	const frozen = config.deepFreeze(toFreeze);
	const clone = config.deepClone(frozen);

	it('should deepfreeze a object', function () {
		assert.throws(() => (deepRef.deep = 'frozen'));
	});

	it('should deep clone a frozen object', function () {
		assert.doesNotThrow(() => {
			clone[0].ref.deep = 'frozen';
		});
	});
	it('should clone shallow objects', function () {
		const array = Object.freeze([]);
		const object = Object.freeze({});
		assert.doesNotThrow(() => {
			config.clone(array).push('foo');
			config.clone(object).foo = 'foo';
		});
	});
	it('should set all options using the configurator', function () {
		Object.keys(config.doxArgs).forEach((key) => {
			assert.doesNotThrow(() => config.configurators[key].set({}, 'foo'));
		});
	});
	it('should validate all options using the configurator', function () {
		Object.keys(config.doxArgs).forEach((key) => {
			assert.isBoolean(config.configurators[key].validate('foo'));
		});
	});
	it('should validate and set tsConfig arrays', function () {
		const validate = config.configurators.tsConfigs.validate;
		const set = config.configurators.tsConfigs.set;

		assert.isTrue(validate(undefined));
		assert.isFalse(validate('foo' as any));
		assert.isFalse(validate([1] as any));

		let conf = {} as any;
		set(conf, undefined);
		assert.deepEqual(conf, { tsConfigs: undefined });

		conf = {};
		set(conf, 'bar');
		assert.deepEqual(conf, {
			tsConfigs: ['bar'],
		} as any);
		set(conf, 'bar');
		assert.deepEqual(conf, {
			tsConfigs: ['bar'],
		} as any);
	});
	it('should validate a file signature for typedox', function () {
		const validate = config.configurators.typedox.validate;
		assert.isTrue(validate(undefined));
		assert.isTrue(validate('typedox.json'));
		assert.isFalse(validate('typedoxjson'));
	});
});
