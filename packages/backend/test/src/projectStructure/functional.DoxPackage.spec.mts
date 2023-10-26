import { assert } from 'chai';
import { config, DoxPackage, programsInPackage, Dox } from 'typedox';
import path from 'path';
import { log, logLevels } from 'typedox/logger';
import { compilerFactory, doxStub } from 'typedox-test';

const localLogLevel = logLevels.silent;
const { projectDir, compiler } = compilerFactory('configs');

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});

	it('creates a class instance', function () {
		const doxOptions = config.getDoxOptions([
			'--projectRootDir',
			projectDir,
			'--npmFileConvention',
			'package.spec.json',
		]);
		const project = doxStub.doxProject(doxOptions);
		const packagePath = path.join(projectDir, 'package.spec.json');
		const program = compiler().program;
		const programs = [[program, projectDir]] as programsInPackage;
		let doxPackage!: DoxPackage;

		assert.exists(program, 'program');
		assert.doesNotThrow(
			() => (doxPackage = new DoxPackage(project, packagePath, programs)),
		);
		assert.isTrue(Dox.isDoxPackage(doxPackage));
	});
}
