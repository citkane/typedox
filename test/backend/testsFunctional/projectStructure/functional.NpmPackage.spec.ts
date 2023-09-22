import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import {
	logger as log,
	config,
	logLevels,
	NpmPackage,
	npmPackageDefinitions,
} from '../../../../src/backend/typedox';

before(function () {
	config._deleteCache();
	log.setLogLevel(logLevels.error);
});
after(function () {
	config._deleteCache();
});
it('creates a class instance', function () {
	const doxProject = stubs.projectFactory.specProject();
	const { npmPackageDefinitions } = doxProject as unknown as {
		npmPackageDefinitions: npmPackageDefinitions;
	};
	const packagePath = Object.keys(npmPackageDefinitions)[0];
	const program = npmPackageDefinitions[packagePath];

	assert.doesNotThrow(() => new NpmPackage(doxProject, packagePath, program));
});
