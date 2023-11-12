import * as path from 'path';
import { assert } from 'chai';
import { DoxConfig, config } from '@typedox/core';
import { log, logLevels } from '@typedox/logger';
import { compilerFactory, doxStub } from '@typedox/test';

const localLogLevel = logLevels.silent;

export default function () {
	describe('class DoxConfig', function () {
		const { tsConfigPath } = compilerFactory('configs');

		before(function () {
			log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
		});

		it('creates a class', function () {
			assert.doesNotThrow(() => new DoxConfig());
		});

		it('errors if entry conf does not exist', function () {
			const badRoot = path.join(doxStub.rootDir, '../', 'foobar');
			const options = config.makeDoxOptions(undefined, [
				'--projectRootDir',
				badRoot,
			]);

			assert.throws(
				() => new DoxConfig(options),
				/Could not locate any tsconfig files to start the documentation process under the directory/,
			);
		});

		it('errors if entry conf is not under the root directory', function () {
			const projectDir = doxStub.projectDir('categories');
			const options = config.makeDoxOptions(undefined, [
				'--projectRootDir',
				path.join(projectDir, 'child'),
			]);

			assert.throws(
				() => new DoxConfig(options),
				/Could not locate any tsconfig files to start the documentation process under the directory/,
			);
		});

		it('can create a custom project', function () {
			let doxConfig;
			const options = config.makeDoxOptions(undefined, [
				'--tsConfigs',
				tsConfigPath,
			]);
			assert.doesNotThrow(() => (doxConfig = new DoxConfig(options)));
			assert.equal((doxConfig as any).tsConfigs[0], tsConfigPath);
		});

		it('has correctly formed options', function () {
			const defaultOptions = config.makeDoxOptions();
			const expected = {
				...defaultOptions,
				...{
					doxOut: path.join(
						defaultOptions.projectRootDir,
						defaultOptions.doxOut,
					),
					logLevel: logLevels[defaultOptions.logLevel],
					tsConfigs: [
						path.join(
							defaultOptions.projectRootDir,
							'tsconfig.json',
						),
					],
				},
			} as unknown as config.coreDoxOptions;
			log.debug({
				expected,
				got: new DoxConfig().options,
			});
			assert.deepEqual(expected, new DoxConfig().options);
		});

		it('has parsed tsc configs', function () {
			const parsedConfigs = (new DoxConfig() as any).tscParsedConfigs;
			assert.isTrue(!!parsedConfigs && parsedConfigs.length > 0);
		});
	});
}
