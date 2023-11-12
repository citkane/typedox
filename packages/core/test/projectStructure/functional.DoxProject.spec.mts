import { assert } from 'chai';
import * as path from 'path';
import { DoxProject, config, Dox } from '@typedox/core';
import { stub } from 'sinon';
import { log, logLevels } from '@typedox/logger';
import { compilerFactory, doxStub } from '@typedox/test';

const localLogLevel = logLevels.silent;

const { projectDir, tsconfig } = compilerFactory('configs');
let infoStub: ReturnType<typeof stub>;
let warningStub: ReturnType<typeof stub>;
let errorStub: ReturnType<typeof stub>;
let doxConfig: config.DoxConfig;

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});

	afterEach(function () {
		if (infoStub) infoStub.restore();
		if (warningStub) warningStub.restore();
		if (errorStub) errorStub.restore();
	});

	it('creates a doxProject instance', function () {
		doxConfig = new config.DoxConfig(undefined, [
			'--projectRootDir',
			projectDir,
			'--npmFileConvention',
			'package.spec.json',
		]);
		let project!: DoxProject;
		assert.doesNotThrow(() => (project = new DoxProject(doxConfig)));
		assert.isTrue(Dox.isDoxProject(project));
	});

	it('throws if no package.json is found', function () {
		const root = path.join(projectDir, 'grandchild');
		const tsconfig = path.join(projectDir, 'grandchild/tsconfig.json');
		doxConfig = new config.DoxConfig(undefined, ['--projectRootDir', root]);

		assert.throws(
			() => new DoxProject(doxConfig),
			/no npm package files were found for the project/,
		);
	});
	it('handles diagnostics and errors for typescript programs', function () {
		const warnings: string[] = [];
		let error = '';
		warningStub = stub(log, 'warn').callsFake((...args) => {
			args[1].startsWith('Cannot find global type') &&
				warnings.push(args[1]);
		});
		errorStub = stub(log, 'error').callsFake((...args) => {
			error = args[1];
			return false;
		});

		doxConfig = new config.DoxConfig(undefined, [
			'--projectRootDir',
			projectDir,
			'--npmFileConvention',
			'package.spec.json',
			'--noLib',
			'true',
		]);
		assert.throws(
			() => new DoxProject(doxConfig),
			/no npm package files were found for the project/,
		);
		assert.isTrue(warnings.length >= 32);
		assert.equal(error, 'Error in ts.Program:');
	});
}
