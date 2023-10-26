import { assert } from 'chai';
import ts from 'typescript';
import { programsInPackage, DoxPackage } from 'typedox';
import { log, logLevels } from 'typedox/logger';
import { doxStub } from 'typedox-test';

const localLogLevel = logLevels.silent;

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});
	it('maps typescript programs to unique namespace identifiers', function () {
		const testDirs: programsInPackage = [
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
