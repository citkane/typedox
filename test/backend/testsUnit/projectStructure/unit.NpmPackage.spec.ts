import { assert } from 'chai';
import * as ts from 'typescript';
import {
	logger as log,
	logLevels,
	npmPackagePrograms,
} from '../../../../src/backend/typedox';
import { getNameMap } from '../../../../src/backend/projectStructure/NpmPackage';

before(function () {
	log.setLogLevel(logLevels.error);
});
it('maps typescript programs to unique namespace identifiers', function () {
	const testDirs: npmPackagePrograms = [
		'/foo/bar',
		'/foo/bar/poo/moo',
		'/bar',
		'/bar/none',
		'/foo/bar/poo',
		'/foo',
	].map((dir) => [{} as ts.Program, dir]);

	assert.deepEqual(getNameMap(testDirs), {
		'/foo/bar/poo/moo': 'foo-bar-poo-moo',
		'/foo/bar/poo': 'foo-bar-poo',
		'/foo/bar': 'foo-bar',
		'/foo': 'foo',
		'/bar/none': 'bar-none',
		'/bar': 'bar',
	});
});
