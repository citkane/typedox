import main from '../../../src/backend/index';
import {
	logger as log,
	logLevels,
	serialise,
	config,
} from '../../../src/backend/typedox';
import { compilerFactory } from '../compilerFactory';
import { globalLogLevel } from '../tests.backend.spec';
import { assert } from 'chai';

const localLogLevel = logLevels.silent;

type projectObject = ReturnType<typeof serialise.serialiseProject>;

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
	assert.doesNotThrow(() => (object = main(projectConfig) as projectObject));
});
