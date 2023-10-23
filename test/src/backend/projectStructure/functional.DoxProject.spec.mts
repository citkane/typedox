import { assert } from 'chai';
import * as path from 'path';
import * as stubs from '../../factories/tests.stubs.mjs';
import { log, DoxProject, config, logLevels } from 'typedox';
import { stub } from 'sinon';
import { globalLogLevel } from '../../tests.backend.spec.mjs';
import { compilerFactory } from '../../factories/compilerFactory.mjs';

const localLogLevel = logLevels.silent;

const { projectDir, tsconfig } = compilerFactory('configs');
let infoStub: any;
let warningStub: any;
let doxOptions: config.doxOptions;

export default function () {
	before(function () {
		log.setLogLevel(globalLogLevel || localLogLevel);
	});

	afterEach(function () {
		if (infoStub) infoStub.restore();
		if (warningStub) warningStub.restore();
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
		assert.isTrue(project.isDoxProject);
	});

	it('ignores tsConfigs that do not emit', function () {
		const ignoredMessages: string[] = [];
		infoStub = stub(log, 'info').callsFake((...args) => {
			const message = `${args[1]} ${args[2]}`;
			message.endsWith(
				`${tsconfig} has no out directory or does not emit. It's file list is being ignored.`,
			) && ignoredMessages.push(`${args[1]} ${args[2]}`);
		});
		new DoxProject(doxOptions);
		assert.lengthOf(
			ignoredMessages,
			stubs.configs.expectedConfigLength - 2,
		);
	});

	it('throws if no usable typescript configs are found', function () {
		const root = path.join(projectDir, 'child');
		const tsconfig = path.join(projectDir, 'child/tsconfig.spec.json');
		doxOptions = config.getDoxOptions(['--projectRootDir', root]);

		assert.throws(
			() => new DoxProject(doxOptions),
			/Did not find any typescript configs which emit and have out directories in/,
		);
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
	it('reports diagnostics for typescript programs and throws if error', function () {
		const warnings: string[] = [];
		warningStub = stub(log, 'warn').callsFake((...args) => {
			args[0].startsWith('Cannot find global type') &&
				warnings.push(args[0]);
		});

		doxOptions = config.getDoxOptions([
			'--projectRootDir',
			projectDir,
			'--npmFileConvention',
			'package.spec.json',
		]);

		assert.throws(
			() => new DoxProject(doxOptions, ['--noLib', 'true']),
			/Error in ts.Program/,
		);
		assert.lengthOf(warnings, 8);
	});
}
