import * as stubs from '../../tests.stubs.spec';
import * as ts from 'typescript';
import * as path from 'path';
import { assert } from 'chai';
import {
	DoxConfig,
	config,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';

describe('class DoxConfig', function () {
	const { tsConfigPath } = stubs.compilerFactory('configs');
	const getDoxConfig = () => {
		config._deleteCache();
		return new DoxConfig(config.getDoxOptions(), []);
	};
	let errorStub: any;

	before(function () {
		log.setLogLevel(logLevels.info);
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
		assert.doesNotThrow(() => new DoxConfig(config.getDoxOptions(), []));
	});
	it('can delete the config cache', function () {
		config._deleteCache();
		assert.throws(
			() => new DoxConfig(),
			/The initial DoxConfig must include projectOptions/,
		);
	});

	it('errors if entry conf does not exist', function () {
		const badRoot = path.join(stubs.rootDir, '../', 'foobar');
		const options = config.getDoxOptions(['--projectRootDir', badRoot]);

		assert.throws(
			() => new DoxConfig(options),
			/Could not locate any tsconfig files to start the documentation process under the directory/,
		);
	});

	it('errors if entry conf is not under the root directory', function () {
		config._deleteCache();
		const { projectDir } = stubs.compilerFactory('groups');
		const options = config.getDoxOptions([
			'--projectRootDir',
			path.join(projectDir, 'child'),
		]);

		assert.throws(
			() => new DoxConfig(options),
			/Could not locate any tsconfig files to start the documentation process under the directory/,
		);
	});

	it('can create a custom project', function () {
		config._deleteCache();
		let doxConfig;
		const options = config.getDoxOptions(['--tsConfigs', tsConfigPath]);
		assert.doesNotThrow(() => (doxConfig = new DoxConfig(options)));
		assert.equal((doxConfig as any).tsConfigs[0], tsConfigPath);
	});
	it('can create a commandline project', function () {
		config._deleteCache();
		let doxConfig;
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
				tsConfigs: [
					path.join(defaultOptions.projectRootDir, 'tsconfig.json'),
				],
			},
		};
		log.debug({
			expected,
			got: getDoxConfig().options,
		});
		assert.deepEqual(expected, getDoxConfig().options);
	});

	it('has parsed tsc configs', function () {
		const parsedConfigs = (getDoxConfig() as any).tscParsedConfigs;
		assert.isTrue(!!parsedConfigs && parsedConfigs.length > 0);
	});

	it('identifies specifierKinds', function () {
		const doxConfig = getDoxConfig();
		const values = Object.values(ts.SyntaxKind)
			.map((kind) => doxConfig.isSpecifierKind(kind as any))
			.filter((value) => !!value);
		assert.equal(values.length, 9);
	});
});
