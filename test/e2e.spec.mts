import main, { logApplicationHelp, isRequestForHelp } from 'typedox';
import { log, logLevels } from '@typedox/logger';
import { doxFormat, doxStub } from '@typedox/test';
import { serialiseDoxProject } from '@typedox/serialiser';
import { assert } from 'chai';
import { stub } from 'sinon';
import { config } from '@typedox/core';

const localLogLevel = logLevels.silent;

type projectObject = ReturnType<typeof serialiseDoxProject>;

export default function e2eTest() {
	describe(doxFormat.title('E2E tests'), function () {
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

		it('runs the core', function () {
			const dir = doxStub.projectDir('groups');
			const projectConfig = config.getDoxOptions([
				'--projectRootDir',
				dir,
				'--npmFileConvention',
				'package.spec.json',
			]);
			let object: projectObject;
			/*
		assert.doesNotThrow(
			() => (object = main(projectConfig) as projectObject),
		);
		*/
		});
	});
}
