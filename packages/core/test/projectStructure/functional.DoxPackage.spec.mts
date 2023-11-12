import { assert } from 'chai';
import { config, DoxPackage, Dox, DoxProject } from '@typedox/core';
import path from 'path';
import { log, logLevels } from '@typedox/logger';
import { compilerFactory, doxStub } from '@typedox/test';

const localLogLevel = logLevels.silent;
const { projectDir, compiler } = compilerFactory('configs');

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});

	it('creates a class instance', function () {
		const doxOptions = config.makeDoxOptions(undefined, [
			'--projectRootDir',
			projectDir,
			'--npmFileConvention',
			'package.spec.json',
		]);
		const project = doxStub.doxProject(doxOptions);
		const packagePath = path.join(projectDir, 'package.spec.json');
		const { program, parsedConfig } = compiler();

		let doxPackage!: DoxPackage;

		assert.exists(program, 'program');
		const programsRootDir = DoxProject.getProgramRootDir(
			parsedConfig,
			projectDir,
		);
		assert.doesNotThrow(
			() =>
				(doxPackage = new DoxPackage(
					project,
					packagePath,
					[parsedConfig],
					[programsRootDir!],
				)),
		);
		assert.isTrue(Dox.isDoxPackage(doxPackage));
	});
}
