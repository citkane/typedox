import { assert } from 'chai';
import * as path from 'path';
import { DoxProject, config, Dox } from 'typedox';
import { stub } from 'sinon';
import { log, logLevels } from 'typedox/logger';
import { compilerFactory, doxStub } from 'typedox-test';

const localLogLevel = logLevels.silent;

const { projectDir, tsconfig } = compilerFactory('configs');
let infoStub: ReturnType<typeof stub>;
let warningStub: ReturnType<typeof stub>;
let errorStub: ReturnType<typeof stub>;
let doxOptions: config.doxOptions;

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
		doxOptions = config.getDoxOptions([
			'--projectRootDir',
			projectDir,
			'--npmFileConvention',
			'package.spec.json',
		]);
		let project!: DoxProject;
		assert.doesNotThrow(() => (project = new DoxProject(doxOptions)));
		assert.isTrue(Dox.isDoxProject(project));
	});

	it('throws if no package.json is found', function () {
		const root = path.join(projectDir, 'grandchild');
		const tsconfig = path.join(projectDir, 'grandchild/tsconfig.json');
		doxOptions = config.getDoxOptions(['--projectRootDir', root]);

		assert.throws(
			() => new DoxProject(doxOptions),
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

		doxOptions = config.getDoxOptions([
			'--projectRootDir',
			projectDir,
			'--npmFileConvention',
			'package.spec.json',
		]);
		assert.throws(
			() => new DoxProject(doxOptions, ['--noLib', 'true']),
			/no npm package files were found for the project/,
		);
		assert.isTrue(warnings.length >= 32);
		assert.equal(error, 'Error in ts.Program:');
	});
}
