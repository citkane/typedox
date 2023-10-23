import { assert } from 'chai';
import ts from 'typescript';
import { log, logLevels, doxPackagePrograms, DoxPackage } from 'typedox';
import { globalLogLevel } from '../../tests.backend.spec.mjs';

const localLogLevel = logLevels.silent;

export default function () {
	before(function () {
		log.setLogLevel(globalLogLevel || localLogLevel);
	});
	it('maps typescript programs to unique namespace identifiers', function () {
		const testDirs: doxPackagePrograms = [
			'/foo/bar',
			'/foo/bar/poo/moo',
			'/bar',
			'/bar/none',
			'/foo/bar/poo',
			'/foo',
		].map((dir) => [{} as ts.Program, dir]);

		assert.deepEqual(DoxPackage.getNameMap(testDirs), {
			'/foo/bar/poo/moo': 'foo-bar-poo-moo',
			'/foo/bar/poo': 'foo-bar-poo',
			'/foo/bar': 'foo-bar',
			'/foo': 'foo',
			'/bar/none': 'bar-none',
			'/bar': 'bar',
		});
	});
}
