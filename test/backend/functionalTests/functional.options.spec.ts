import * as stubs from '../stubs.spec';
import * as ts from 'typescript';
import { assert } from 'chai';
import {
	DoxConfig,
	config,
	logger as log,
	logLevels,
} from '../../../src/backend/typedox';

before(function () {
	log.setLogLevel(logLevels.error);
});

describe('class DoxConfig', function () {
	let doxConfig: DoxConfig;
	it('resolves the constructor overload', function () {
		const options = stubs.configs.defaultOptions;
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

		assert.deepEqual(config.resolveConstructorOverload(options, checker), [
			options,
			checker,
			process.argv,
		]);
		assert.deepEqual(
			config.resolveConstructorOverload(options, checker, clArgs),
			[options, checker, clArgs],
		);
		assert.deepEqual(config.resolveConstructorOverload(options, clArgs), [
			options,
			undefined,
			clArgs,
		]);
	});
	/*
	it('requires initial options', function () {
		assert.throws(
			() => new DoxConfig(),
			/The initial DoxConfig must include projectOptions/,
		);
	});
	it('creates a class', function () {
		assert.doesNotThrow(
			() => (doxConfig = new DoxConfig(stubs.configs.defaultOptions)),
		);
		log.info((doxConfig as any).parsedConfigs);
		log.info((doxConfig as any).rawConfigs);
	});
	it('can delete the config cache', function () {
		doxConfig._deleteCache();
		assert.throws(
			() => new DoxConfig(),
			/The initial DoxConfig must include projectOptions/,
		);
	});
	it('can create a custom project', function () {
		const options = {
			...stubs.configs.defaultOptions,
			...{ tsConfigs: [stubs.configs.testTscConfig] },
		};

		assert.doesNotThrow(() => (doxConfig = new DoxConfig(options)));
		assert.equal(
			(doxConfig as any).tsConfigs[0],
			stubs.configs.testTscConfigPath,
		);
	});
	it('can create a commandline project', function () {
		doxConfig._deleteCache();
		assert.doesNotThrow(
			() =>
				(doxConfig = new DoxConfig(stubs.configs.defaultOptions, [
					'--project',
					'test/backend/typescript.spec.json',
				])),
		);
		assert.equal(
			(doxConfig as any)._clProject()[0],
			stubs.configs.testTscConfigPath,
		);
	});

	it('has correctly formed options', function () {
		doxConfig._deleteCache();
		doxConfig = new DoxConfig(stubs.configs.defaultOptions);
		const expected = {
			...doxConfig.options,
			...{ logLevel: logLevels[doxConfig.options.logLevel] },
		};
		log.debug({
			stub: stubs.configs.defaultOptions,
			expected,
			got: doxConfig.options,
		});
		assert.deepEqual(expected, stubs.configs.defaultOptions);
	});

	it('has parsed tsc configs', function () {
		const parsedConfigs = (doxConfig as any).tscParsedConfigs;
		assert.isTrue(!!parsedConfigs && parsedConfigs.length > 0);
	});
	*/
});
