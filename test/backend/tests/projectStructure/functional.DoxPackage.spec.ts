import * as stubs from '../../factories/tests.stubs.spec';
import { assert } from 'chai';
import {
	config,
	logger as log,
	logLevels,
	DoxPackage,
	doxPackagePrograms,
} from '../../../../src/backend/typedox';
import { globalLogLevel } from '../../tests.backend.spec';
import { compilerFactory } from '../../factories/compilerFactory';
import path from 'path';

const localLogLevel = logLevels.silent;
const { projectDir, compiler } = compilerFactory('configs');

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
		() => (doxPackage = new DoxPackage(doxProject, packagePath, programs)),
	);
	assert.isTrue(doxPackage.isDoxPackage);
});
