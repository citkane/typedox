import * as stubs from '../../factories/tests.stubs.mjs';
import { assert } from 'chai';
import {
	config,
	log,
	logLevels,
	DoxPackage,
	doxPackagePrograms,
} from 'typedox';
import { globalLogLevel } from '../../tests.backend.spec.mjs';
import { compilerFactory } from '../../factories/compilerFactory.mjs';
import path from 'path';

const localLogLevel = logLevels.silent;
const { projectDir, compiler } = compilerFactory('configs');

export default function () {
	before(function () {
		log.setLogLevel(globalLogLevel || localLogLevel);
	});

	it('creates a class instance', function () {
		const doxOptions = config.getDoxOptions([
			'--projectRootDir',
			projectDir,
			'--npmFileConvention',
			'package.spec.json',
		]);
		const doxProject = stubs.doxProject(doxOptions);
		const packagePath = path.join(projectDir, 'package.spec.json');
		const program = compiler().program;
		const programs = [[program, projectDir]] as doxPackagePrograms;
		let doxPackage!: DoxPackage;

		assert.exists(program, 'program');
		assert.doesNotThrow(
			() =>
				(doxPackage = new DoxPackage(
					doxProject,
					packagePath,
					programs,
				)),
		);
		assert.isTrue(doxPackage.isDoxPackage);
	});
}
