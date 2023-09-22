import * as stubs from '../../tests.stubs.spec';
import * as path from 'path';
import * as ts from 'typescript';
import * as fs from 'fs';
import { assert } from 'chai';
import { stub } from 'sinon';
import {
	logger as log,
	config,
	logLevels,
	DoxConfig,
	tscRawConfig,
} from '../../../../src/backend/typedox';

const { configurators } = DoxConfig;
const { tsConfigPath, tsconfig } = stubs.compilerFactory('configs');

before(function () {
	log.setLogLevel(logLevels.error);
});
describe('Commandline arguments', function () {
	const doxArgVstub = Object.entries(config.getDefaultDoxOptions()).reduce(
		(accumulator, tuple) => {
			const [key, value] = tuple;
			accumulator.push(`${config.argHyphen}${key}`);
			typeof value === 'string' && accumulator.push(`${value}`);
			return accumulator;
		},
		[] as string[],
	);
	const tscArgVStub = ['-b', '--noEmit', '--target', '--esnext'];
	const argvStub = [
		process.argv[0],
		process.argv[1],
		...doxArgVstub,
		...tscArgVStub,
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
		assert.deepEqual(args.slice(2), tscArgVStub);
	});
	it('should try to get tsc parsed options from commandline', function () {
		assert.doesNotThrow(() => config.getTscParsedCommandline());
	});
	it('should get tsc parsed options from commandline', function () {
		const options = config.getTscParsedCommandline(tscArgVStub);
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
		assert.equal(configFile, stubs.configs.defaultDoxConfigPath);
	});
	it('should get the dox config file path from a relative cl argument', function () {
		const configFile = config.getDoxFilepathFromArgs([
			'--typedox',
			'typedox.json1',
		]);

		assert.equal(configFile, stubs.configs.defaultDoxConfigPath + 1);
	});
	it('should get the dox config file path from an absolute cl argument', function () {
		const configFile = config.getDoxFilepathFromArgs([
			'--typedox',
			'typedox.json2',
		]);

		assert.equal(configFile, stubs.configs.defaultDoxConfigPath + 2);
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
		let badConfig = config.getDefaultDoxOptions() as any;
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
		assert.deepEqual(autoConfig, config.getDefaultDoxOptions() as any);
	});
	it('should validate the default options', function () {
		assert.doesNotThrow(() =>
			config.validateDoxOptions(config.getDefaultDoxOptions() as any),
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
		const customOptions = config.getDefaultDoxOptions();
		customOptions.doxOut = 'foo';
		customOptions.logLevel = 'error';
		customOptions.npmFileConvention = 'foo.bar';
		customOptions.projectRootDir = 'here';
		customOptions.tsConfigs = ['there'];
		customOptions.typeDependencies = ['foo', 'bar'];
		customOptions.typedox = 'foo.bar';

		const validatedOptions = config.getDoxOptions([
			'--doxOut',
			'foo',
			'--logLevel',
			'error',
			'--npmFileConvention',
			'foo.bar',
			'--projectRootDir',
			'here',
			'--tsConfigs',
			'there',
			'--typeDependencies',
			'foo',
			'bar',
			'--typedox',
			'foo.bar',
		]);

		assert.deepEqual(customOptions, validatedOptions);
	});
	it('should try to read the default config file', function () {
		assert.doesNotThrow(() => config.getFileDoxOptions());
	});
	it('should read options from a dox config file if it exists', function () {
		const fileInfo = config.getFileDoxOptions([
			'--projectRootDir',
			'test/backend/testsUnit/configurationAndOptions',
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
			projectRootDir: 'test/backend/testsUnit/configurationAndOptions',
			doxOut: 'testDocs',
			typeDependencies: ['foo', 'bar'],
			logLevel: 'info',
			tsConfigs: undefined,
			npmFileConvention: 'package.json',
			typedox: 'typedox.spec.json',
		};
		const options = config.getDoxOptions([
			'--typeDependencies',
			'foo',
			'bar',
			'--projectRootDir',
			'test/backend/testsUnit/configurationAndOptions',
			'--typedox',
			'typedox.spec.json',
		]);
		assert.deepEqual(expected, options as any);
	});
});
describe('config tools', function () {
	let warnStub: any;

	afterEach(function () {
		if (warnStub) warnStub.restore();
	});
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
			assert.doesNotThrow(() => configurators[key].set({}, 'foo'));
		});
	});
	it('should validate all options using the configurator', function () {
		Object.keys(config.doxArgs).forEach((key) => {
			assert.isBoolean(configurators[key].validate('foo'));
		});
	});
	it('should validate and set tsConfig arrays', function () {
		const validate = configurators.tsConfigs.validate;
		const set = configurators.tsConfigs.set;

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
		const validate = configurators.typedox.validate;
		assert.isTrue(validate(undefined));
		assert.isTrue(validate('typedox.json'));
		assert.isFalse(validate('typedoxjson'));
	});
	it('throws if file does not exist', function () {
		assert.throws(() => config.ensureFileExists('foo'));
	});
	it('reports on bad json', function () {
		warnStub = stub(log, 'warn')
			.onFirstCall()
			.callsFake((...args) => {
				assert.equal(
					args[1],
					"Property value can only be string literal, numeric literal, 'true', 'false', 'null', object literal or array literal.",
				);
			});

		config.jsonFileToObject(
			stubs.ensureAbsPath(
				'test/backend/testsUnit/configurationAndOptions/badJson.spec.json',
			),
		);
	});
	it('ensures an absolute path', function () {
		const absPath = config.ensureAbsPath('/foo', '/foo/bar');
		const relPath = config.ensureAbsPath('/foo', 'bar');
		assert.equal(absPath, relPath);
	});
});
describe('config parsing', function () {
	let rawConfig;
	let rawConfigs;

	it('resolves the class constructor overloads', function () {
		const options = config.getDoxOptions();
		const clArgs = ['foo'];
		const checker = {} as ts.TypeChecker;

		assert.deepEqual(config.resolveConstructorOverload(), [
			undefined,
			undefined,
			process.argv,
		]);
		assert.deepEqual(config.resolveConstructorOverload(clArgs), [
			undefined,
			undefined,
			clArgs,
		]);
		assert.deepEqual(config.resolveConstructorOverload(options), [
			options,
			undefined,
			process.argv,
		]);
		assert.deepEqual(config.resolveConstructorOverload(checker), [
			undefined,
			checker,
			process.argv,
		]);

		assert.deepEqual(config.resolveConstructorOverload(checker, clArgs), [
			undefined,
			checker,
			clArgs,
		]);
		assert.deepEqual(config.resolveConstructorOverload(options, clArgs), [
			options,
			undefined,
			clArgs,
		]);
		assert.deepEqual(config.resolveConstructorOverload(options, checker), [
			options,
			checker,
			process.argv,
		]);
		assert.deepEqual(
			config.resolveConstructorOverload(options, checker, clArgs),
			[options, checker, clArgs],
		);
		assert.deepEqual(
			config.resolveConstructorOverload(undefined, checker, clArgs),
			[undefined, checker, clArgs],
		);
		assert.deepEqual(
			config.resolveConstructorOverload(undefined, undefined, clArgs),
			[undefined, undefined, clArgs],
		);
		assert.deepEqual(
			config.resolveConstructorOverload(options, undefined, clArgs),
			[options, undefined, clArgs],
		);
	});
	it('makes a rawTsConfig by reading a tsconfig from file', function () {
		assert.doesNotThrow(
			() =>
				(rawConfig = config.makeRawTscConfigFromFile(
					tsConfigPath,
					true,
				)),
		);
		assert.hasAllKeys(rawConfig, ['config', 'error', 'dox']);
		assert.isUndefined(
			rawConfig.error,
			JSON.stringify(rawConfig.error, null, 4),
		);
	});
	it('resolves tsc reference paths from a raw config', function () {
		const raw = config.discoverReferences({ config: {} } as tscRawConfig);
		assert.deepEqual([], raw);
		const discovered = config.discoverReferences(rawConfig);
		assert.isTrue(
			!!discovered && Array.isArray(discovered) && discovered.length > 0,
			JSON.stringify(discovered, null, 4),
		);
		discovered.forEach((file) => assert.isTrue(file.endsWith(tsconfig)));
	});
	it('finds all raw tscConfigs', function () {
		rawConfigs = config.findAllRawConfigs(
			[tsConfigPath],
			stubs.ensureAbsPath,
			true,
		);

		assert.lengthOf(rawConfigs, stubs.configs.expectedConfigLength);
		rawConfigs.forEach((config) => {
			const { rootDir, fileName } = config.dox;
			const filePath = path.join(rootDir, fileName);
			assert.equal(config.error, undefined);
			assert.isTrue(
				fs.existsSync(filePath),
				`File not found: ${filePath}`,
			);
		});
	});
	it('parses a raw config', function () {
		const parsedConfig = config.makeParsedConfig([], {}, rawConfig);
		assert.exists(parsedConfig.options);
		assert.containsAllKeys(parsedConfig.options, [
			'outDir',
			'types',
			'configFilePath',
		]);
	});
	it('parses raw configs', function () {
		const parsedConfigs = config.makeParsedConfigs(rawConfigs, [], {});

		assert.isArray(parsedConfigs);
		assert.lengthOf(parsedConfigs, stubs.configs.expectedConfigLength);
		parsedConfigs.forEach((config) => {
			assert.isTrue(
				!config.errors.length,
				config.errors.map((err) => err.messageText).join('\n'),
			);
		});
	});
});
