import * as stubs from '../stubs.spec';
import * as ts from 'typescript';
import * as path from 'path';
import { assert, expect } from 'chai';
import { stub } from 'sinon';
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

	it('requires initial options', function () {
		assert.throws(
			() => new DoxConfig(),
			/The initial DoxConfig must include projectOptions/,
		);
	});
	it('creates a class', function () {
		assert.doesNotThrow(
			() =>
				(doxConfig = new DoxConfig(
					config.getDoxOptions(),
					{} as ts.TypeChecker,
					[],
				)),
		);
	});
	it('can delete the config cache', function () {
		config._deleteCache();
		assert.throws(
			() => new DoxConfig(),
			/The initial DoxConfig must include projectOptions/,
		);
	});

	it('errors if no entry conf is found', function () {
		const badRoot = path.join(stubs.configs.rootDir, '../', 'foobar');
		const options = config.getDoxOptions(['--projectRootDir', badRoot]);

		assert.throws(
			() => new DoxConfig(options),
			/Could not locate any tsconfig.json files to start the documentation process/,
		);
	});

	it('can create a custom project', function () {
		config._deleteCache();
		const options = config.getDoxOptions([
			'--tsConfigs',
			stubs.configs.testTscConfig,
		]);
		assert.doesNotThrow(() => (doxConfig = new DoxConfig(options)));
		assert.equal(
			(doxConfig as any).tsConfigs[0],
			stubs.configs.testTscConfigPath,
		);
	});
	it('can create a commandline project', function () {
		config._deleteCache();
		assert.doesNotThrow(
			() =>
				(doxConfig = new DoxConfig(config.getDoxOptions(), [
					'--project',
					'test/backend/tsconfig.spec.json',
				])),
		);
		assert.equal(
			(doxConfig as any)._clProject()[0],
			stubs.configs.testTscConfigPath,
		);
	});

	it('has correctly formed options', function () {
		const defaultOptions = config.getDoxOptions();
		const expected = {
			...defaultOptions,
			...{
				doxOut: path.join(
					defaultOptions.projectRootDir,
					defaultOptions.doxOut,
				),
				logLevel: logLevels[defaultOptions.logLevel],
				tsConfigs: [stubs.configs.testTscConfigPath],
			},
		};
		log.debug({
			expected,
			got: doxConfig.options,
		});
		assert.deepEqual(expected, doxConfig.options as any);
	});

	it('has parsed tsc configs', function () {
		const parsedConfigs = (doxConfig as any).tscParsedConfigs;
		assert.isTrue(!!parsedConfigs && parsedConfigs.length > 0);
	});
	it('logs an error if toObject is not registered', function () {
		const errorStub = stub(log, 'error').callsFake((...args) => {
			assert.include(args[1], 'Call made to unknown serialiser');
		});
		doxConfig.toObject;

		errorStub.restore();
	});
	it('identifies specifierKinds', function () {
		const values = Object.values(ts.SyntaxKind)
			.map((kind) => doxConfig.isSpecifierKind(kind as any))
			.filter((value) => !!value);
		assert.equal(values.length, 8);
	});
	it('throws error if trying to wrap without a checker', function () {
		assert.throws(
			() => (doxConfig as any).tsWrap({} as any),
			/Typechecker has not been registered yet/,
		);
	});
});
