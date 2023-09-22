import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import * as path from 'path';
import {
	TsDeclaration,
	TsReference,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';

let tsReference: TsReference;
let errorStub: any;
let warnStub: any;

const { projectDir } = stubs.compilerFactory('groups');
before(function () {
	log.setLogLevel(logLevels.error);

	const npmPackage = stubs.projectFactory.specNpmPackage();
	tsReference = npmPackage.tsReferences[0];
});
afterEach(function () {
	if (errorStub) errorStub.restore();
	if (warnStub) warnStub.restore();
});
it('gets a class instance from npmPackage', function () {
	assert.exists(tsReference);
});
it('dedupes and maps a file to the register', function () {
	const size = tsReference.filesMap.size;
	const file = path.join(projectDir, 'greatGrandchild/greatGrandchild.ts');
	tsReference.filesMap.delete(file);
	assert.doesNotThrow(() => tsReference.discoverFiles([file, file]));
	assert.isTrue(
		tsReference.filesMap.size === size,
		`${size} : ${tsReference.filesMap.size}`,
	);
});
it('parses files recursively', function () {
	tsReference.discoverFiles();
	assert.isTrue(tsReference.filesMap.size > 2);
});
it('reports error if file not found', function () {
	let error!: string;
	errorStub = stub(log, 'error').callsFake((...args) => {
		error = args[1];
	});
	tsReference.discoverFiles(['foo']);
	assert.include(error, 'No source file was found');
});
it('warns if symbol was not created', function () {
	const file = path.join(projectDir, 'emptyFile.ts');
	let warning!: string;
	warnStub = stub(log, 'warn').callsFake((...args) => {
		warning = args[1];
	});
	tsReference.discoverFiles([file]);

	assert.include(
		warning,
		'File was not included as part of the documentation set',
	);
});
it('does not throw on declaration discovery', function () {
	assert.doesNotThrow(() => tsReference.discoverDeclarations());
});
it('does not throw on relationship building', function () {
	tsReference.buildRelationships();
	errorStub = stub(log, 'error');
	assert.doesNotThrow(() => tsReference.buildRelationships());
});
it('gets the root declarations', function () {
	let roots!: TsDeclaration[];
	assert.doesNotThrow(() => (roots = tsReference.getRootDeclarations()));
	assert.isTrue(roots.length > 8, 'did not get root declarations');
	roots.forEach((declaration) => {
		assert.equal(
			declaration.constructor.name,
			'TsDeclaration',
			'was not a declaration',
		);
	});
});
