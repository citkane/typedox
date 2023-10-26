import main, {
	serialiser,
	config,
	logApplicationHelp,
	isRequestForHelp,
} from 'typedox';

import { assert } from 'chai';
import { log, logLevels } from 'typedox/logger';
import { stub } from 'sinon';
import { doxFormat, doxStub } from 'typedox-test';

const localLogLevel = logLevels.silent;

type projectObject = ReturnType<typeof serialiser.serialiseProject>;

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});
	it('parses cl for help request', function () {
		assert.isTrue(isRequestForHelp(['--help']));
		assert.isFalse(isRequestForHelp());
	});
	it('logs help information', function () {
		const loggedArgs: string[] = [];
		const stubLog = stub(log, 'log');
		const stubGroup = stub(log, 'group').callsFake((arg: string) => {
			loggedArgs.push(doxFormat.unColour(arg).replace('--', ''));
		});

		logApplicationHelp();
		assert.deepEqual(loggedArgs, Object.keys(config.doxArgs));
		stubLog.restore();
		stubGroup.restore();
	});

	it('runs the backend', function () {
		const dir = doxStub.projectDir('groups');
		const projectConfig = config.getDoxOptions([
			'--projectRootDir',
			dir,
			'--npmFileConvention',
			'package.spec.json',
		]);
		main(projectConfig);
		let object: projectObject;
		assert.doesNotThrow(
			() => (object = main(projectConfig) as projectObject),
		);
	});
}
