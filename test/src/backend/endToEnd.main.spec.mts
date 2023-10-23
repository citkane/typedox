import main, { log, logLevels, serialiser, config } from 'typedox';
import { compilerFactory } from '../factories/compilerFactory.mjs';
import { globalLogLevel } from '../tests.backend.spec.mjs';
import { assert } from 'chai';

const localLogLevel = logLevels.silent;

type projectObject = ReturnType<typeof serialiser.serialiseProject>;

export default function () {
	before(function () {
		log.setLogLevel(globalLogLevel || localLogLevel);
	});
	it('runs the backend', function () {
		const { projectDir } = compilerFactory('groups');
		const projectConfig = config.getDoxOptions([
			'--projectRootDir',
			projectDir,
			'--npmFileConvention',
			'package.spec.json',
		]);

		let object: projectObject;
		assert.doesNotThrow(
			() => (object = main(projectConfig) as projectObject),
		);
	});
}
