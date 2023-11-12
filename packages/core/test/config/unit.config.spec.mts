import * as path from 'path';
import ts from 'typescript';
import * as fs from 'fs';
import { assert } from 'chai';
import { stub } from 'sinon';
import { config, tscRawConfig } from '@typedox/core';

import { log, logLevels } from '@typedox/logger';
import { compilerFactory, doxStub } from '@typedox/test';

const localLogLevel = logLevels.silent;

const coreApi =
	config.CoreArgsApi as unknown as config.ArgsApi<config.CoreArgsApi>;
const { tsConfigPath, tsconfig } = compilerFactory('configs');
let warnStub: any;
export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});
	afterEach(function () {
		if (!!warnStub) warnStub.restore();
	});
	describe('Commandline arguments', function () {
		const doxArgVstub = Object.entries(
			config.getDefaultDoxOptions<config.CoreArgsApi>(),
		).reduce((accumulator, tuple) => {
			const [key, value] = tuple;
			accumulator.push(`${config.argHyphen}${key}`);
			typeof value === 'string' && accumulator.push(`${value}`);
			return accumulator;
		}, [] as string[]);

		const tscArgVStub = ['-b', '--noEmit', '--target', 'esnext'];
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
			assert.doesNotThrow(() =>
				config.getClDoxOptions<config.CoreArgsApi>(process.argv),
			);
		});
		it('should parse empty commandline options to empty object', function () {
			const options = config.getClDoxOptions<config.CoreArgsApi>([]);
			assert.deepEqual(options, {} as any);
		});
		it('should gather multiple commandline options to array', function () {
			const args = ['--typeDependencies', 'foo', 'bar'];
			const expected = { typeDependencies: ['foo', 'bar'] };
			const options = config.getClDoxOptions<config.CoreArgsApi>(args);
			assert.deepEqual(options, expected as any);
		});
		it('should ignore orphan commandline options', function () {
			const options =
				config.getClDoxOptions<config.CoreArgsApi>(orphanArgs);
			assert.deepEqual(options, {} as any);
		});
		it('should include boolean orphan commandline options', function () {
			const doxArgs = new config.CoreArgsApi();
			(doxArgs.typedox as any).defaultValue = false;

			const options = config.getClDoxOptions<config.CoreArgsApi>(
				orphanArgs,
				doxArgs,
			);
			assert.deepEqual(options, { typedox: true } as any);
		});
		it('should get dox cl arguments', function () {
			const args = config.getClArgs(coreApi, argvStub).doxClArgs;

			assert.deepEqual(args, doxArgVstub);
		});
		it('should get tsc cl arguments', function () {
			const args = config.getClArgs(coreApi, argvStub).tscClArgs;
			assert.deepEqual(args.slice(2), tscArgVStub);
		});
		it('should try to get tsc parsed options from commandline', function () {
			assert.doesNotThrow(() => config.getTscParsedCommandline(coreApi));
		});
		it('should get tsc parsed options from commandline', function () {
			let warnings: boolean = false;
			warnStub = stub(log, 'warn').callsFake((warn) => {
				log.error(warn, log.stackTracer());
				warnings = true;
			});
			const options = config.getTscParsedCommandline(coreApi, [
				...tscArgVStub,
				'--doxOut',
				'foo',
			]);
			assert.deepEqual(options.options, {
				build: true,
				noEmit: true,
				target: 99,
			});
			assert.isFalse(warnings);
		});

		it('should hyphenate and un-hyphenate arguments', function () {
			assert.equal(config.hyphenateArg('arg'), '--arg');
			assert.equal(config.unHyphenateArg('--arg'), 'arg');
		});
	});
	describe('Parsed options', function () {
		it.skip('should get the default options', function () {
			const autoConfig = config.getDefaultDoxOptions();
			assert.deepEqual(autoConfig, config.getDefaultDoxOptions() as any);
		});

		it('should get and validate custom options', function () {
			const specOptions = config.getDefaultDoxOptions<any>();
			specOptions;
			specOptions.doxOut = 'foo';
			specOptions.logLevel = 'error';
			specOptions.npmFileConvention = 'foo.bar';
			specOptions.projectRootDir = 'here';
			specOptions.tsConfigs = ['there'];
			specOptions.typedox = 'foo.bar';

			const clOptions = config.getClDoxOptions<config.CoreArgsApi>([
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
				'--typedox',
				'foo.bar',
			]);
			const customOptions = config.makeDoxOptions(
				undefined,
				undefined,
				specOptions,
			);

			assert.deepEqual(specOptions, clOptions);
			assert.deepEqual(specOptions, customOptions);
		});
		it('should try to read the default config file', function () {
			assert.doesNotThrow(() =>
				config.getFileDoxOptions(
					config.getDefaultDoxOptions<any>(),
					[],
				),
			);
		});
		it('should read options from a dox config file if it exists', function () {
			const projectRootDir = doxStub.projectDir('configs');
			const fileInfo = config.getFileDoxOptions(
				config.getDefaultDoxOptions<any>(),
				[
					'--projectRootDir',
					projectRootDir,
					'--typedox',
					'typedox.spec.json',
				],
			);
			assert.deepEqual(fileInfo, {
				doxOut: 'testDocs',
				typeDependencies: ['hay', 'may'],
			} as any);
		});
		it('should return an empty object if there is not a config file', function () {
			const projectRootDir = doxStub.projectDir('configs');
			const fileInfo = config.getFileDoxOptions(
				config.getDefaultDoxOptions<any>(),
				['--projectRootDir', projectRootDir],
			);
			assert.deepEqual(fileInfo, {} as any);
		});
		it('should read options hierarchically with precedence to commandline, then file, then default options', function () {
			const projectRootDir = doxStub.projectDir('configs');
			const expected = {
				projectRootDir,
				doxOut: 'testDocs',
				typeDependencies: ['foo', 'bar'],
				logLevel: 'info',
				tsConfigs: undefined,
				npmFileConvention: 'package.json',
				typedox: 'typedox.spec.json',
			};
			const options = config.makeDoxOptions(undefined, [
				'--typeDependencies',
				'foo',
				'bar',
				'--projectRootDir',
				projectRootDir,
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
		const clone = doxStub.deepClone(frozen);

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
			Object.values(config.CoreArgsApi).forEach(
				(arg: config.Arg<unknown, unknown>) => {
					assert.doesNotThrow(() => {
						const val =
							arg.typeof === 'array'
								? []
								: arg.typeof === 'object'
								? {}
								: arg.typeof === 'number'
								? 0
								: arg.typeof === 'boolean'
								? true
								: 'foo';

						arg.set({} as config.options<any>, val as any);
					});
				},
			);
		});
		it('should validate all options using the configurator', function () {
			Object.values(config.CoreArgsApi).forEach((arg) => {
				assert.isBoolean(arg.validate('foo' as any));
			});
		});

		it('throws if file does not exist', function () {
			assert.throws(() => config.ensureFileExists('foo'));
		});
		it('reports on bad json', function () {
			const projectRootDir = doxStub.projectDir('configs');
			warnStub = stub(log, 'warn')
				.onFirstCall()
				.callsFake((...args) => {
					assert.equal(
						args[1],
						"Property value can only be string literal, numeric literal, 'true', 'false', 'null', object literal or array literal.",
					);
				});

			config.jsonFileToObject(
				doxStub.ensureAbsPath(
					path.join(projectRootDir, 'badJson.spec.json'),
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
		const rawConfigs = () =>
			config.findAllRawConfigs(
				[tsConfigPath],
				doxStub.ensureAbsPath,
				true,
			);

		const rawConfig = () =>
			config.makeRawTscConfigFromFile(tsConfigPath, true);

		it('makes a rawTsConfig by reading a tsconfig from file', function () {
			let rawConfig!: tscRawConfig;
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
			const raw = config.discoverReferences({
				config: {},
			} as tscRawConfig);
			assert.deepEqual([], raw);
			const discovered = config.discoverReferences(rawConfig());
			assert.isTrue(
				!!discovered &&
					Array.isArray(discovered) &&
					discovered.length > 0,
				JSON.stringify(discovered, null, 4),
			);
			discovered.forEach((file) =>
				assert.isTrue(file.endsWith(tsconfig)),
			);
		});
		it('finds all raw tscConfigs', function () {
			let rawConfigs = config.findAllRawConfigs(
				[tsConfigPath],
				doxStub.ensureAbsPath,
				true,
			);

			assert.lengthOf(rawConfigs, doxStub.configs.expectedConfigLength);
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
			const parsedConfig = config.makeParsedConfig({}, rawConfig());
			assert.exists(parsedConfig.options);
			assert.containsAllKeys(parsedConfig.options, [
				'outDir',
				'suppressImplicitAnyIndexErrors',
				'configFilePath',
			]);
		});
		it('parses raw configs', function () {
			const parsedConfigs = config.makeParsedConfigs(rawConfigs(), {});

			assert.isArray(parsedConfigs);
			assert.lengthOf(
				parsedConfigs,
				doxStub.configs.expectedConfigLength,
			);
			parsedConfigs.forEach((config) => {
				assert.isTrue(
					!config.errors.length,
					config.errors.map((err) => err.messageText).join('\n'),
				);
			});
		});
	});
}
