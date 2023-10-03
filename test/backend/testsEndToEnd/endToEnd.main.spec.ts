import main from '../../../src/backend/index';
import {
	logger as log,
	logLevels,
	serialise,
	config,
} from '../../../src/backend/typedox';
import * as stubs from '../tests.stubs.spec';
import { assert } from 'chai';

type projectObject = ReturnType<typeof serialise.serialiseProject>;

before(function () {
	log.setLogLevel(logLevels.error);
});
it('runs the backend', function () {
	const { projectDir } = stubs.compilerFactory('groups');
	const projectConfig = config.getDoxOptions([
		'--projectRootDir',
		projectDir,
		'--npmFileConvention',
		'package.spec.json',
	]);

	let object: projectObject;
	assert.doesNotThrow(() => (object = main(projectConfig) as projectObject));
});
