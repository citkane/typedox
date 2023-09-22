import * as stubs from '../../tests.stubs.spec';
import * as ts from 'typescript';
import * as path from 'path';
import { assert } from 'chai';
import { stub } from 'sinon';
import {
	DoxConfig,
	config,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';

describe('class DoxConfig', function () {
	const { tsConfigPath, tsconfig } = stubs.compilerFactory('configs');
	let doxConfig: DoxConfig;
	let errorStub: any;

	before(function () {
		log.setLogLevel(logLevels.error);
	});
	afterEach(function () {
		if (errorStub) errorStub.restore();
	});

	it('requires initial options', function () {
		config._deleteCache();
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
		const badRoot = path.join(stubs.rootDir, '../', 'foobar');
		const options = config.getDoxOptions(['--projectRootDir', badRoot]);

		assert.throws(
			() => new DoxConfig(options),
			/Could not locate any tsconfig files to start the documentation process under the directory/,
		);
	});

	it('can create a custom project', function () {
		config._deleteCache();
		const options = config.getDoxOptions(['--tsConfigs', tsConfigPath]);
		assert.doesNotThrow(() => (doxConfig = new DoxConfig(options)));
		assert.equal((doxConfig as any).tsConfigs[0], tsConfigPath);
	});
	it('can create a commandline project', function () {
		config._deleteCache();
		assert.doesNotThrow(
			() =>
				(doxConfig = new DoxConfig(config.getDoxOptions(), [
					'--project',
					tsConfigPath,
				])),
		);
		assert.equal((doxConfig as any)._clProject()[0], tsConfigPath);
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
				tsConfigs: [tsConfigPath],
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
		errorStub = stub(log, 'error').callsFake((...args) => {
			assert.include(args[1], 'Call made to unknown serialiser');
		});
		doxConfig.toObject;
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
