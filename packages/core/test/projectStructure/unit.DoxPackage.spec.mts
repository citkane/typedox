import { assert } from 'chai';
import { DoxPackage } from '@typedox/core';
import { log, logLevels } from '@typedox/logger';
import { doxStub } from '@typedox/test';

const localLogLevel = logLevels.silent;

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});
	it('maps typescript programs to unique namespace identifiers', function () {
		const testDirs = [
			'/rootDir/3base/one/two/three',
			'/rootDir/3base/one/two',
			'/rootDir/3base/one',
			'/rootDir/3base',
			'/rootDir/base',
			'/rootDir/2base',
			'/rootDir/2base/two/foo/one/bar',
			'/rootDir/2base/one/two/buckle/my/shoe',
		];
		const nameSpaces = DoxPackage.getUniqueNameMap(testDirs, '/rootDir');

		assert.deepEqual(nameSpaces, {
			'/rootDir/3base': '3base',
			'/rootDir/base': 'base',
			'/rootDir/2base': '2base',
			'/rootDir/3base/one': '3base/one',
			'/rootDir/3base/one/two': '3base/one/two',
			'/rootDir/3base/one/two/three': '3base/one/two/three',
			'/rootDir/2base/two/foo/one/bar': '2base/two',
			'/rootDir/2base/one/two/buckle/my/shoe': '2base/one',
		});
	});
}
